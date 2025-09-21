import type { World, WorldChunk } from '../types'
import { geometryToPxMesh, PMeshHandle } from '../extras/geometryToPxMesh'
import THREE from '../extras/three'
import { System } from './System'
import { EventType } from '../types/events'
import { NoiseGenerator } from '../utils/NoiseGenerator'
import { InstancedMeshManager } from '../utils/InstancedMeshManager'

/**
 * Terrain System
 *
 * Specifications:
 * - 100x100m tiles (100m x 100m each)
 * - 100x100 world grid = 10km x 10km total world
 * - Only load current tile + adjacent tiles (3x3 = 9 tiles max)
 * - Procedural heightmap generation with biomes
 * - PhysX collision support
 * - Resource placement and road generation
 */

import type { BiomeData } from '../types/core'
import type { ResourceNode, TerrainTile } from '../types/terrain'
import { PhysicsHandle } from '../types/physics'
import { getPhysX } from '../PhysXManager'
import { Layers } from '../extras/Layers'

interface BiomeCenter {
  x: number
  z: number
  type: string
  influence: number
}

export class TerrainSystem extends System {
  private terrainTiles = new Map<string, TerrainTile>()
  private terrainContainer!: THREE.Group
  public instancedMeshManager!: InstancedMeshManager
  private _terrainInitialized = false
  private _initialTilesReady = false // Track when initial tiles are loaded
  private lastPlayerTile = { x: 0, z: 0 }
  private updateTimer = 0
  private noise!: NoiseGenerator
  private biomeCenters: BiomeCenter[] = []
  private databaseSystem!: {
    saveWorldChunk(chunkData: unknown): void
  } // DatabaseSystem reference
  private chunkSaveInterval?: NodeJS.Timeout
  private terrainUpdateIntervalId?: NodeJS.Timeout
  private serializationIntervalId?: NodeJS.Timeout
  private boundingBoxIntervalId?: NodeJS.Timeout
  private activeChunks = new Set<string>()

  private coreChunkRange = 2 // 9 core chunks (5x5 grid)
  private ringChunkRange = 3 // Additional ring around core chunks
  private terrainOnlyChunkRange = 5 // Furthest ring with only terrain geometry
  private unloadPadding = 1 // Hysteresis padding for unloading beyond ring range
  private playerChunks = new Map<string, Set<string>>() // player -> chunk keys
  private simulatedChunks = new Set<string>() // chunks with active simulation
  private isGenerating = false // Track if terrain generation is in progress
  private chunkPlayerCounts = new Map<string, number>() // chunk -> player count
  // Smooth generation queue to avoid main-thread spikes when player moves
  private pendingTileKeys: string[] = []
  private pendingTileSet = new Set<string>()
  private pendingCollisionKeys: string[] = []
  private pendingCollisionSet = new Set<string>()
  private maxTilesPerFrame = 2 // cap tiles generated per frame
  private generationBudgetMsPerFrame = 6 // time budget per frame (ms)
  private _tempVec3 = new THREE.Vector3();
  private _tempVec3_2 = new THREE.Vector3();
  private _tempVec2 = new THREE.Vector2();
  private _tempVec2_2 = new THREE.Vector2();
  private _tempBox3 = new THREE.Box3();

  // Serialization system
  private lastSerializationTime = 0
  private serializationInterval = 15 * 60 * 1000 // 15 minutes in milliseconds
  private worldStateVersion = 1
  private pendingSerializationData = new Map<
    string,
    {
      key: string
      tileX: number
      tileZ: number
      biome: string
      heightData?: number[]
      resourceStates: Array<{
        id: string
        type: string
        position: [number, number, number]
      }>
      roadData: Array<{
        start: [number, number]
        end: [number, number]
        width: number
      }>
      playerCount: number
      lastActiveTime?: Date
      isSimulated: boolean
      worldStateVersion: number
      timestamp: number
    }
  >()

  // Bounding box verification
  private worldBounds = {
    minX: -1000,
    maxX: 1000,
    minZ: -1000,
    maxZ: 1000,
    minY: -50,
    maxY: 100,
  }
  private terrainBoundingBoxes = new Map<string, THREE.Box3>()
  tileSize: number = 0

  // Deterministic noise seeding
  private computeSeedFromWorldId(): number {
    // Check for explicit seed in world config or environment
    const worldConfig = (this.world as { config?: { terrainSeed?: number } }).config
    if (worldConfig?.terrainSeed !== undefined) {
      return worldConfig.terrainSeed
    }

    // Check environment variable
    if (typeof process !== 'undefined' && process.env?.TERRAIN_SEED) {
      const envSeed = parseInt(process.env.TERRAIN_SEED, 10)
      if (!isNaN(envSeed)) {
        return envSeed
      }
    }

    // Always use fixed seed of 0 for deterministic terrain on both client and server
    const FIXED_SEED = 0
    return FIXED_SEED
  }

  /**
   * Queue a tile for generation if not already queued or present
   */
  private enqueueTileForGeneration(tileX: number, tileZ: number, _generateContent = true): void {
    const key = `${tileX}_${tileZ}`
    if (this.terrainTiles.has(key) || this.pendingTileSet.has(key)) return
    this.pendingTileSet.add(key)
    this.pendingTileKeys.push(key)
  }

  /**
   * Process queued tile generations within per-frame time and count budgets
   */
  private processTileGenerationQueue(): void {
    if (this.pendingTileKeys.length === 0) return
    const nowFn = typeof performance !== 'undefined' && performance.now ? () => performance.now() : () => Date.now()
    const start = nowFn()
    let generated = 0
    while (this.pendingTileKeys.length > 0) {
      if (generated >= this.maxTilesPerFrame) break
      if (nowFn() - start > this.generationBudgetMsPerFrame) break
      const key = this.pendingTileKeys.shift()!
      this.pendingTileSet.delete(key)
      const [x, z] = key.split('_').map(Number)
      this.generateTile(x, z)
      generated++
    }
  }

  private processCollisionGenerationQueue(): void {
    if (this.pendingCollisionKeys.length === 0 || !this.world.network?.isServer) return

    const key = this.pendingCollisionKeys.shift()!
    this.pendingCollisionSet.delete(key)

    const tile = this.terrainTiles.get(key)
    if (!tile || tile.collision) return

        const geometry = tile.mesh.geometry
        const transformedGeometry = geometry.clone()
        transformedGeometry.translate(tile.x * this.CONFIG.TILE_SIZE, 0, tile.z * this.CONFIG.TILE_SIZE)

        const meshHandle = geometryToPxMesh(this.world, transformedGeometry, false)
        if (meshHandle) {
          tile.collision = meshHandle
        }
  }

  private initializeBiomeCenters(): void {
    const worldSize = this.CONFIG.WORLD_SIZE * this.CONFIG.TILE_SIZE // 10km x 10km
    const numCenters = Math.floor((worldSize * worldSize) / 1000000) // Roughly 100 centers for 10km x 10km

    // Use deterministic PRNG for reproducible biome placement
    const baseSeed = this.computeSeedFromWorldId()
    let randomState = baseSeed

    const nextRandom = () => {
      // Linear congruential generator for deterministic random
      randomState = (randomState * 1664525 + 1013904223) >>> 0
      return randomState / 0xffffffff
    }

    const biomeTypes = ['darkwood_forest', 'mistwood_valley', 'goblin_wastes', 'northern_reaches', 'plains', 'lakes']

    // Clear any existing centers
    this.biomeCenters = []

    for (let i = 0; i < numCenters; i++) {
      const x = (nextRandom() - 0.5) * worldSize
      const z = (nextRandom() - 0.5) * worldSize
      const typeIndex = Math.floor(nextRandom() * biomeTypes.length)
      const influence = 200 + nextRandom() * 400 // 200-600m influence radius

      this.biomeCenters.push({
        x,
        z,
        type: biomeTypes[typeIndex],
        influence,
      })
    }
  }

  // World Configuration - Your Specifications
  private readonly CONFIG = {
    // Core World Specs
    TILE_SIZE: 100, // 100m x 100m tiles
    WORLD_SIZE: 100, // 100x100 grid = 10km x 10km world
    TILE_RESOLUTION: 64, // 64x64 vertices per tile for smooth terrain
    MAX_HEIGHT: 80, // 80m max height variation

    // Chunking - Only adjacent tiles
    VIEW_DISTANCE: 1, // Load only 1 tile in each direction (3x3 = 9 tiles)
    UPDATE_INTERVAL: 0.5, // Check player movement every 0.5 seconds

    // Movement Constraints
    WATER_IMPASSABLE: true, // Water blocks movement
    MAX_WALKABLE_SLOPE: 0.7, // Maximum slope for movement (tan of angle)
    SLOPE_CHECK_DISTANCE: 1, // Distance to check for slope calculation

    // Features
    ROAD_WIDTH: 4, // 4m wide roads
    RESOURCE_DENSITY: 0.15, // 15% chance per area for resources (increased for more resources)
    TREE_DENSITY: 0.25, // 25% chance for trees in forest biomes (increased for visibility)
    TOWN_RADIUS: 25, // Safe radius around towns
  }

  // GDD-Compliant Biomes - All 8 specified biomes from Game Design Document
  private readonly BIOMES: Record<string, BiomeData> = {
    // Core biomes from GDD
    mistwood_valley: {
      id: 'mistwood_valley',
      name: 'Mistwood Valley',
      description: 'A mystical valley shrouded in perpetual mist, home to ancient trees and hidden dangers',
      difficultyLevel: 1,
      terrain: 'forest',
      color: 0x4caf50, // Brighter green
      heightRange: [0.1, 0.4],
      resources: ['tree', 'herb'],
      mobs: ['goblin', 'bandit'],
      fogIntensity: 0.7,
      ambientSound: 'forest_ambient',
      colorScheme: {
        primary: '#4CAF50',
        secondary: '#388E3C',
        fog: '#e0e8e4',
      },
      terrainMultiplier: 0.6,
      waterLevel: 2.0,
      maxSlope: 0.4,
      mobTypes: ['goblin', 'bandit'],
      difficulty: 1,
      baseHeight: 0.25,
      heightVariation: 0.15,
      resourceDensity: 0.12,
      resourceTypes: ['tree', 'herb'],
    },
    goblin_wastes: {
      id: 'goblin_wastes',
      name: 'Goblin Wastes',
      description: 'A barren wasteland overrun by goblin hordes, scarred by their destructive presence',
      difficultyLevel: 1,
      terrain: 'wastes',
      color: 0xd2b48c, // Lighter tan
      heightRange: [0.0, 0.3],
      resources: ['rock', 'ore'],
      mobs: ['goblin', 'hobgoblin'],
      fogIntensity: 0.3,
      ambientSound: 'wastes_wind',
      colorScheme: {
        primary: '#D2B48C',
        secondary: '#BC9D76',
        fog: '#d4c4b0',
      },
      terrainMultiplier: 0.4,
      waterLevel: 1.0,
      maxSlope: 0.6,
      mobTypes: ['goblin', 'hobgoblin'],
      difficulty: 1,
      baseHeight: 0.15,
      heightVariation: 0.15,
      resourceDensity: 0.08,
      resourceTypes: ['rock', 'ore'],
    },
    darkwood_forest: {
      id: 'darkwood_forest',
      name: 'Darkwood Forest',
      description: 'An ancient forest where darkness reigns eternal and powerful warriors guard forbidden secrets',
      difficultyLevel: 2,
      terrain: 'forest',
      color: 0x2e7d32, // More saturated dark green
      heightRange: [0.2, 0.7],
      resources: ['tree', 'herb', 'rare_ore'],
      mobs: ['dark_warrior', 'barbarian'],
      fogIntensity: 0.8,
      ambientSound: 'dark_forest_ambient',
      colorScheme: {
        primary: '#2E7D32',
        secondary: '#1B5E20',
        fog: '#2a3a2a',
      },
      terrainMultiplier: 0.9,
      waterLevel: 2.5,
      maxSlope: 0.5,
      mobTypes: ['dark_warrior', 'barbarian'],
      difficulty: 2,
      baseHeight: 0.45,
      heightVariation: 0.25,
      resourceDensity: 0.15,
      resourceTypes: ['tree', 'herb', 'rare_ore'],
    },
    northern_reaches: {
      id: 'northern_reaches',
      name: 'Northern Reaches',
      description: 'Frozen mountains at the edge of the world where only the strongest survive the eternal winter',
      difficultyLevel: 3,
      terrain: 'frozen',
      color: 0xadd8e6, // Light snowy blue
      heightRange: [0.6, 1.0],
      resources: ['rock', 'gem', 'rare_ore'],
      mobs: ['ice_warrior', 'black_knight'],
      fogIntensity: 0.6,
      ambientSound: 'frozen_wind',
      colorScheme: {
        primary: '#ADD8E6',
        secondary: '#87CEEB',
        fog: '#e8f0f8',
      },
      terrainMultiplier: 1.2,
      waterLevel: 0.5,
      maxSlope: 0.8,
      mobTypes: ['ice_warrior', 'black_knight'],
      difficulty: 3,
      baseHeight: 0.8,
      heightVariation: 0.2,
      resourceDensity: 0.06,
      resourceTypes: ['rock', 'gem', 'rare_ore'],
    },
    blasted_lands: {
      id: 'blasted_lands',
      name: 'Blasted Lands',
      description: 'A corrupted wasteland where dark magic has twisted the very earth into a nightmarish realm',
      difficultyLevel: 3,
      terrain: 'corrupted',
      color: 0x8b4513, // Reddish-brown
      heightRange: [0.0, 0.4],
      resources: ['rare_ore'],
      mobs: ['dark_ranger', 'black_knight'],
      fogIntensity: 0.5,
      ambientSound: 'corrupted_whispers',
      colorScheme: {
        primary: '#8B4513',
        secondary: '#7A3D10',
        fog: '#8a7a6a',
      },
      terrainMultiplier: 0.3,
      waterLevel: 0.0,
      maxSlope: 0.7,
      mobTypes: ['dark_ranger', 'black_knight'],
      difficulty: 3,
      baseHeight: 0.2,
      heightVariation: 0.2,
      resourceDensity: 0.04,
      resourceTypes: ['rare_ore'],
    },
    lakes: {
      id: 'lakes',
      name: 'Lakes',
      description: 'Serene lakes providing safe passage and abundant fishing opportunities',
      difficultyLevel: 0,
      terrain: 'lake',
      color: 0x1e88e5, // Vibrant blue
      heightRange: [-0.2, 0.1],
      resources: ['fish'],
      mobs: [],
      fogIntensity: 0.1,
      ambientSound: 'water_lapping',
      colorScheme: {
        primary: '#1E88E5',
        secondary: '#1565C0',
        fog: '#d0e4f7',
      },
      terrainMultiplier: 0.1,
      waterLevel: 5.0,
      maxSlope: 0.2,
      mobTypes: [],
      difficulty: 0,
      baseHeight: -0.05,
      heightVariation: 0.15,
      resourceDensity: 0.05,
      resourceTypes: ['fish'],
    },
    plains: {
      id: 'plains',
      name: 'Plains',
      description: 'Rolling grasslands where bandits roam and resources are scattered across the open fields',
      difficultyLevel: 1,
      terrain: 'plains',
      color: 0x8bc34a, // Vibrant lime green
      heightRange: [0.0, 0.2],
      resources: ['tree', 'herb'],
      mobs: ['bandit', 'barbarian'],
      fogIntensity: 0.2,
      ambientSound: 'plains_wind',
      colorScheme: {
        primary: '#8BC34A',
        secondary: '#689F38',
        fog: '#e8f0e0',
      },
      terrainMultiplier: 0.3,
      waterLevel: 1.5,
      maxSlope: 0.3,
      mobTypes: ['bandit', 'barbarian'],
      difficulty: 1,
      baseHeight: 0.1,
      heightVariation: 0.1,
      resourceDensity: 0.08,
      resourceTypes: ['tree', 'herb'],
    },
    starter_towns: {
      id: 'starter_towns',
      name: 'Starter Towns',
      description: 'Safe havens where new adventurers begin their journey, protected from hostile forces',
      difficultyLevel: 0,
      terrain: 'plains',
      color: 0x9ccc65, // Light, friendly green
      heightRange: [0.1, 0.3],
      resources: ['tree'],
      mobs: [],
      fogIntensity: 0.0,
      ambientSound: 'town_ambient',
      colorScheme: {
        primary: '#9CCC65',
        secondary: '#7CB342',
        fog: '#f0f8f0',
      },
      terrainMultiplier: 0.2,
      waterLevel: 2.0,
      maxSlope: 0.2,
      mobTypes: [],
      difficulty: 0,
      baseHeight: 0.2,
      heightVariation: 0.1,
      resourceDensity: 0.05,
      resourceTypes: ['tree'],
    },
  }

  constructor(world: World) {
    super(world)
  }

  async init(): Promise<void> {
    // Initialize deterministic noise from world id
    this.noise = new NoiseGenerator(this.computeSeedFromWorldId())

    // Initialize biome centers using deterministic random placement
    this.initializeBiomeCenters()

    // Get systems references
    // Check if database system exists and has the required method
    const dbSystem = this.world.getSystem('rpg-database') as { saveWorldChunk(chunkData: unknown): void } | undefined
    if (dbSystem) {
      this.databaseSystem = dbSystem
    }

    // Initialize chunk loading system
    this.initializeChunkLoadingSystem()

    // Initialize serialization system
    this.initializeSerializationSystem()

    // Initialize bounding box verification
    this.initializeBoundingBoxSystem()

    // Environment detection (deferred until network system is available)
    const networkSystem = this.world.network
    if (networkSystem?.isClient) {
      // Client-side initialization
    } else if (networkSystem?.isServer) {
      // Server-side initialization
    } else {
      // Environment not yet determined
    }
  }

  async start(): Promise<void> {
    // Initialize noise generator if not already initialized (failsafe)
    if (!this.noise) {
            this.noise = new NoiseGenerator(this.computeSeedFromWorldId())
      this.initializeBiomeCenters()
    }

    // Final environment detection
    const isServer = this.world.network?.isServer || false
    const isClient = this.world.network?.isClient || false

    if (isClient) {
      this.setupClientTerrain()
    } else if (isServer) {
      this.setupServerTerrain()
    } else {
      throw new Error('[TerrainSystem] Environment not detected - terrain setup deferred')
    }

    // Load initial tiles
    this.loadInitialTiles()

    // Start player-based terrain update loop
    this.terrainUpdateIntervalId = setInterval(() => {
      this.updatePlayerBasedTerrain()
    }, 1000) // Update every second

    // Start serialization loop
    this.serializationIntervalId = setInterval(() => {
      this.performPeriodicSerialization()
    }, 60000) // Check every minute

    // Start bounding box verification
    this.boundingBoxIntervalId = setInterval(() => {
      this.verifyTerrainBoundingBoxes()
    }, 30000) // Verify every 30 seconds

      }

  private setupClientTerrain(): void {
    const stage = this.world.stage as { scene: THREE.Scene }
    const scene = stage.scene

    // Create terrain container
    this.terrainContainer = new THREE.Group()
    this.terrainContainer.name = 'TerrainContainer'
    scene.add(this.terrainContainer)

    // Initialize InstancedMeshManager
    this.instancedMeshManager = new InstancedMeshManager(scene, this.world)
    this.registerInstancedMeshes()

    // Setup initial camera only if no client camera system controls it
    // Leave control to ClientCameraSystem for third-person follow

    // Load initial tiles
    this.loadInitialTiles()
  }

  private registerInstancedMeshes(): void {
    // Register tree mesh - now with automatic pooling (1000 visible max)
    const treeSize = { x: 1.2, y: 3.0, z: 1.2 }
    const treeGeometry = new THREE.BoxGeometry(treeSize.x, treeSize.y, treeSize.z)
    const treeMaterial = new THREE.MeshStandardMaterial({ color: 0x2f7d32 })
    this.instancedMeshManager.registerMesh('tree', treeGeometry, treeMaterial, 1000)

    // Register rock mesh - pooled to 500 visible instances
    const rockSize = { x: 1.0, y: 1.0, z: 1.0 }
    const rockGeometry = new THREE.BoxGeometry(rockSize.x, rockSize.y, rockSize.z)
    const rockMaterial = new THREE.MeshLambertMaterial({ color: 0x8a8a8a })
    this.instancedMeshManager.registerMesh('rock', rockGeometry, rockMaterial, 500)
    this.instancedMeshManager.registerMesh('ore', rockGeometry, rockMaterial, 500)
    this.instancedMeshManager.registerMesh('rare_ore', rockGeometry, rockMaterial, 200)

    // Register herb mesh - pooled to 800 visible instances
    const herbSize = { x: 0.6, y: 0.8, z: 0.6 }
    const herbGeometry = new THREE.BoxGeometry(herbSize.x, herbSize.y, herbSize.z)
    const herbMaterial = new THREE.MeshLambertMaterial({ color: 0x66bb6a })
    this.instancedMeshManager.registerMesh('herb', herbGeometry, herbMaterial, 800)

    // Register fish mesh (using a simple sphere) - pooled to 300 visible instances
    const fishGeometry = new THREE.SphereGeometry(0.6)
    const fishMaterial = new THREE.MeshLambertMaterial({ color: 0x3aa7ff, transparent: true, opacity: 0.7 })
    this.instancedMeshManager.registerMesh('fish', fishGeometry, fishMaterial, 300)
  }

  private setupServerTerrain(): void {
    // Setup chunk save interval for persistence
    if (this.databaseSystem) {
      this.chunkSaveInterval = setInterval(() => {
        this.saveModifiedChunks()
      }, 30000) // Save every 30 seconds
    }

    // Pre-generate spawn area tiles
    this.loadInitialTiles()
  }

  private loadInitialTiles(): void {
    const startTime = performance.now()
    let tilesGenerated = 0
    let minHeight = Infinity
    let maxHeight = -Infinity

    
    // Generate initial 3x3 grid around origin
    const initialRange = 1
    for (let dx = -initialRange; dx <= initialRange; dx++) {
      for (let dz = -initialRange; dz <= initialRange; dz++) {
        const tile = this.generateTile(dx, dz)
        tilesGenerated++

        // Sample heights to check variation
        for (let i = 0; i < 10; i++) {
          const testX = tile.x * this.CONFIG.TILE_SIZE + (Math.random() - 0.5) * this.CONFIG.TILE_SIZE
          const testZ = tile.z * this.CONFIG.TILE_SIZE + (Math.random() - 0.5) * this.CONFIG.TILE_SIZE
          const height = this.getHeightAt(testX, testZ)
          minHeight = Math.min(minHeight, height)
          maxHeight = Math.max(maxHeight, height)
        }
      }
    }

    const endTime = performance.now()

    // Mark initial tiles as ready
    this._initialTilesReady = true
      }

  private generateTile(tileX: number, tileZ: number, generateContent = true): TerrainTile {
    const key = `${tileX}_${tileZ}`

    // Check if tile already exists
    if (this.terrainTiles.has(key)) {
      return this.terrainTiles.get(key)!
    }

    // Create geometry for this tile
    const geometry = this.createTileGeometry(tileX, tileZ)

    // Create material with vertex colors
    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      wireframe: false,
      metalness: 0.1,
      roughness: 0.9,
    })

    // Create mesh
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(tileX * this.CONFIG.TILE_SIZE, 0, tileZ * this.CONFIG.TILE_SIZE)
    mesh.name = `Terrain_${key}`

    // Add userData for click-to-move detection and other systems
    mesh.userData = {
      type: 'terrain',
      walkable: true,
      clickable: true,
      biome: this.getBiomeAt(tileX, tileZ),
      tileKey: key,
      tileX: tileX,
      tileZ: tileZ,
    }

    // Generate collision only on server to avoid client-side heavy work
    const collision: PMeshHandle | null = null
    const isServer = this.world.network?.isServer || false
    if (isServer) {
      const collisionKey = `${tileX}_${tileZ}`
      if (!this.pendingCollisionSet.has(collisionKey)) {
        this.pendingCollisionSet.add(collisionKey)
        this.pendingCollisionKeys.push(collisionKey)
      }
    }

    // Create tile object
    const tile: TerrainTile = {
      key,
      x: tileX,
      z: tileZ,
      mesh,
      collision: collision || null,
      biome: this.getBiomeAt(tileX, tileZ) as TerrainTile['biome'],
      resources: [],
      roads: [],
      generated: true,
      lastActiveTime: new Date(),
      playerCount: 0,
      needsSave: true,
      waterMeshes: [],
      heightData: [],
      chunkSeed: 0,
      heightMap: new Float32Array(0),
      collider: null,
      lastUpdate: Date.now(),
    }

    // Add simple physics plane for the terrain tile (for raycasting)
    // Create on both client and server for click-to-move raycasting
      const physics = this.world.physics
      const PHYSX = getPhysX()

      // Create a simple plane at the average height of the terrain
      // This is sufficient for click-to-move raycasting
      const positionAttribute = geometry.attributes.position
      const vertices = positionAttribute.array as Float32Array

      // Calculate average height and bounds
      let minY = Infinity
      let maxY = -Infinity
      let avgY = 0
      const vertexCount = positionAttribute.count

      for (let i = 0; i < vertexCount; i++) {
        const y = vertices[i * 3 + 1] // Y is at index 1 in each vertex
        avgY += y
        minY = Math.min(minY, y)
        maxY = Math.max(maxY, y)
      }
      avgY /= vertexCount

      // Create a box shape that covers the terrain tile
      // Use a thicker box to ensure proper collision
      const heightRange = maxY - minY
      const boxThickness = Math.max(5, heightRange * 0.5) // At least 5 units thick or half the height range
      const halfExtents = {
        x: this.CONFIG.TILE_SIZE / 2, // Half width
        y: boxThickness / 2, // Half thickness of the collision box
        z: this.CONFIG.TILE_SIZE / 2 // Half depth
      }
      const boxGeometry = new PHYSX!.PxBoxGeometry(halfExtents.x, halfExtents.y, halfExtents.z)

      // Create material and shape
      const physicsMaterial = physics.physics.createMaterial(0.5, 0.5, 0.1)
      const shape = physics.physics.createShape(boxGeometry, physicsMaterial, true)

      // Set the terrain to the 'terrain' layer
      const terrainLayer = Layers.terrain
      if (terrainLayer) {
        // For filter data:
        // word0 = what group this shape belongs to (terrain.group)
        // word1 = what groups can query/hit this shape (0xFFFFFFFF allows all)
        // This allows raycasts with any layer mask to hit terrain
        const filterData = new PHYSX!.PxFilterData(terrainLayer.group, 0xFFFFFFFF, 0, 0)
        shape.setQueryFilterData(filterData)
        
        // For simulation, use the terrain's actual collision mask
        const simFilterData = new PHYSX!.PxFilterData(terrainLayer.group, terrainLayer.mask, 0, 0)
        shape.setSimulationFilterData(simFilterData)
      }

      // Create actor at tile position with average height
      const transform = new PHYSX!.PxTransform(
        new PHYSX!.PxVec3(
          mesh.position.x + this.CONFIG.TILE_SIZE / 2, // Center of tile
          avgY, // Average terrain height
          mesh.position.z + this.CONFIG.TILE_SIZE / 2 // Center of tile
        ),
        new PHYSX!.PxQuat(0, 0, 0, 1)
      )
      const actor = physics.physics.createRigidStatic(transform)
      actor.attachShape(shape)

      const handle: PhysicsHandle = {
        tag: `terrain_${tile.key}`,
        contactedHandles: new Set<PhysicsHandle>(),
        triggeredHandles: new Set<PhysicsHandle>(),
      }
      tile.collider = physics.addActor(actor, handle)

    // Add to scene if client-side
    if (this.terrainContainer) {
      this.terrainContainer.add(mesh)
    }

    if (generateContent) {
      // Generate resources for this tile
      this.generateTileResources(tile)

      // Generate visual features (roads, lakes)
      this.generateVisualFeatures(tile)

      // Add water meshes for low areas
      this.generateWaterMeshes(tile)

      // Add visible resource meshes (simple proxies)
      if (tile.resources.length > 0 && tile.mesh && this.world.network?.isClient) {
        for (const resource of tile.resources) {
          if (resource.instanceId != null) continue

          const worldPosition = new THREE.Vector3(
            tile.x * this.CONFIG.TILE_SIZE + resource.position.x,
            resource.position.y,
            tile.z * this.CONFIG.TILE_SIZE + resource.position.z
          )

          const instanceId = this.instancedMeshManager.addInstance(resource.type, resource.id, worldPosition)

          if (instanceId !== null) {
            resource.instanceId = instanceId
            resource.meshType = resource.type

            // Emit resource created event for InteractionSystem registration
            // For instanced resources, we pass the instanceId instead of a mesh
            this.world.emit('resource:mesh:created', {
              mesh: undefined, // No individual mesh for instanced resources
              instanceId: instanceId,
              resourceId: resource.id,
              resourceType: resource.type,
              worldPosition: {
                x: worldPosition.x,
                y: worldPosition.y,
                z: worldPosition.z,
              },
            })
          }
        }
      }
    }

    // Emit typed event for other systems (resources, AI nav, etc.)
      const originX = tile.x * this.CONFIG.TILE_SIZE
      const originZ = tile.z * this.CONFIG.TILE_SIZE
      const resourcesPayload = tile.resources.map(r => {
        const pos = { x: originX + r.position.x, y: r.position.y, z: originZ + r.position.z }
        return { id: r.id, type: r.type, position: pos }
      })
      const genericBiome = this.mapBiomeToGeneric(tile.biome as string)
      this.world.emit(EventType.TERRAIN_TILE_GENERATED, {
        tileId: `${tileX},${tileZ}`,
        position: { x: originX, z: originZ },
        biome: genericBiome,
        tileX,
        tileZ,
        resources: resourcesPayload,
      })

      // Also emit resource spawn points for ResourceSystem
      if (tile.resources.length > 0) {
        this.world.emit(EventType.RESOURCE_SPAWN_POINTS_REGISTERED, {
          spawnPoints: tile.resources.map(r => {
            const worldPos = { x: originX + r.position.x, y: r.position.y, z: originZ + r.position.z }
            return {
              id: r.id,
              type: r.type,
              subType: r.type === 'tree' ? 'normal_tree' : r.type,
              position: worldPos,
            }
          }),
        })
      }

    // Store tile
    this.terrainTiles.set(key, tile)
    this.activeChunks.add(key)

    return tile
  }

  private createTileGeometry(tileX: number, tileZ: number): THREE.PlaneGeometry {
    const geometry = new THREE.PlaneGeometry(
      this.CONFIG.TILE_SIZE,
      this.CONFIG.TILE_SIZE,
      this.CONFIG.TILE_RESOLUTION - 1,
      this.CONFIG.TILE_RESOLUTION - 1
    )

    // Rotate to be horizontal
    geometry.rotateX(-Math.PI / 2)

    const positions = geometry.attributes.position
    const colors = new Float32Array(positions.count * 3)
    const heightData: number[] = []

    // Default biome fallback for coloring
    const defaultBiomeData = this.BIOMES['plains'] || { color: 0x7fb069, name: 'Plains' }

    // No longer using road segments - paths are generated with noise

    // Generate heightmap and vertex colors
    for (let i = 0; i < positions.count; i++) {
      const localX = positions.getX(i)
      const localZ = positions.getZ(i)

      // Safeguard against NaN position values
      if (isNaN(localX) || isNaN(localZ)) {
        positions.setY(i, 10)
        heightData.push(10)
        continue
      }

      // Ensure edge vertices align exactly between tiles
      // Snap edge vertices to exact tile boundaries to prevent seams
      let x = localX + tileX * this.CONFIG.TILE_SIZE
      let z = localZ + tileZ * this.CONFIG.TILE_SIZE

      // Snap to grid at tile boundaries for seamless edges
      const epsilon = 0.001
      const tileMinX = tileX * this.CONFIG.TILE_SIZE
      const tileMaxX = (tileX + 1) * this.CONFIG.TILE_SIZE
      const tileMinZ = tileZ * this.CONFIG.TILE_SIZE
      const tileMaxZ = (tileZ + 1) * this.CONFIG.TILE_SIZE

      if (Math.abs(x - tileMinX) < epsilon) x = tileMinX
      if (Math.abs(x - tileMaxX) < epsilon) x = tileMaxX
      if (Math.abs(z - tileMinZ) < epsilon) z = tileMinZ
      if (Math.abs(z - tileMaxZ) < epsilon) z = tileMaxZ

      // Generate height using our improved noise function
      let height = this.getHeightAt(x, z)

      // Final NaN check for height
      if (isNaN(height)) {
        height = 10
      }

      positions.setY(i, height)
      heightData.push(height)

      // Get biome influences for smooth color blending
      const biomeInfluences = this.getBiomeInfluencesAtPosition(x, z)
      const normalizedHeight = height / 80 // Max height is 80

      // Blend biome colors based on influences
      const color = new THREE.Color(0, 0, 0)

      for (const influence of biomeInfluences) {
        const biomeData = this.BIOMES[influence.type] || defaultBiomeData
        const biomeColor = new THREE.Color(biomeData.color)

        // Weight the color contribution
        color.r += biomeColor.r * influence.weight
        color.g += biomeColor.g * influence.weight
        color.b += biomeColor.b * influence.weight
      }

      // Boost saturation for more vibrant final color
      const hsl = { h: 0, s: 0, l: 0 }
      color.getHSL(hsl)
      hsl.s = Math.min(1.0, hsl.s * 1.5) // 50% saturation boost
      color.setHSL(hsl.h, hsl.s, hsl.l)

      // Apply height-based environmental effects
      // Snow on high peaks
      if (normalizedHeight > 0.7) {
        const snowColor = new THREE.Color(0xfafcff)
        const snowFactor = Math.pow((normalizedHeight - 0.7) / 0.3, 1.5)
        color.lerp(snowColor, snowFactor * 0.85)
      }
      // Rock exposure on slopes
      else if (normalizedHeight > 0.55) {
        const rockColor = new THREE.Color(0x8a8583)
        const rockFactor = (normalizedHeight - 0.55) / 0.45
        color.lerp(rockColor, rockFactor * 0.2)
      }
      // Water tinting for low areas
      else if (normalizedHeight < 0.18) {
        const waterColor = new THREE.Color(0x406090) // Brighter, more saturated water tint
        const depth = Math.max(0, 0.18 - normalizedHeight)
        color.lerp(waterColor, Math.min(0.7, depth * 3.5))
      }

      // Smooth lighting gradient based on height
      const brightness = 0.8 + normalizedHeight * 0.3
      color.multiplyScalar(brightness)

      // Add organic variation using smooth noise
      const noiseScale = 0.008
      const colorNoise = this.noise.simplex2D(x * noiseScale, z * noiseScale)
      const colorVariation = 1.0 + colorNoise * 0.08
      color.multiplyScalar(colorVariation)

      // Apply road-like patterns using noise (no actual road segments)
      // Create organic path-like patterns
      const roadNoiseScale = 0.002
      const roadPattern1 = this.noise.simplex2D(x * roadNoiseScale, z * roadNoiseScale * 0.5)
      const roadPattern2 = this.noise.simplex2D(x * roadNoiseScale * 0.5, z * roadNoiseScale)

      // Create path-like patterns that connect areas
      const pathInfluence =
        Math.max(
          0,
          Math.pow(Math.max(0, 1.0 - Math.abs(roadPattern1) * 4), 3) +
            Math.pow(Math.max(0, 1.0 - Math.abs(roadPattern2) * 4), 3)
        ) * 0.5

      if (pathInfluence > 0.1 && normalizedHeight < 0.5) {
        // Only on lower terrain
        const pathColor = new THREE.Color(0x8a7050) // Natural dirt path color
        // Add some variation to the path color
        const pathVariation = 0.9 + this.noise.simplex2D(x * 0.01, z * 0.01) * 0.2
        pathColor.multiplyScalar(pathVariation)
        color.lerp(pathColor, pathInfluence * 0.6)
      }

      // Convert to sRGB to ensure colors pop on standard displays
      color.convertLinearToSRGB()

      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.computeVertexNormals()

    // Store height data for persistence
    this.storeHeightData(tileX, tileZ, heightData)

    return geometry
  }

  getHeightAt(worldX: number, worldZ: number): number {
    // Ensure noise generator is initialized even if init()/start() haven't run yet
    if (!this.noise) {
      this.noise = new NoiseGenerator(this.computeSeedFromWorldId())
      if (!this.biomeCenters || this.biomeCenters.length === 0) {
        this.initializeBiomeCenters()
      }
    }

    // Throw if coordinates are invalid
    if (!isFinite(worldX) || !isFinite(worldZ)) {
      throw new Error(`[TerrainSystem.getHeightAt] Invalid coordinates: worldX=${worldX}, worldZ=${worldZ}`)
    }

    // Multi-layered noise for realistic terrain
    // Layer 1: Continental shelf - very large scale features
    const continentScale = 0.0008
    const continentNoise = this.noise.fractal2D(worldX * continentScale, worldZ * continentScale, 5, 0.7, 2.0)

    // Layer 2: Mountain ridges - creates dramatic peaks and valleys
    const ridgeScale = 0.003
    const ridgeNoise = this.noise.ridgeNoise2D(worldX * ridgeScale, worldZ * ridgeScale)

    // Layer 3: Hills and valleys - medium scale variation
    const hillScale = 0.012
    const hillNoise = this.noise.fractal2D(worldX * hillScale, worldZ * hillScale, 4, 0.5, 2.2)

    // Layer 4: Erosion - smooths valleys and creates river beds
    const erosionScale = 0.005
    const erosionNoise = this.noise.erosionNoise2D(worldX * erosionScale, worldZ * erosionScale, 3)

    // Layer 5: Fine detail - small bumps and texture
    const detailScale = 0.04
    const detailNoise = this.noise.fractal2D(worldX * detailScale, worldZ * detailScale, 2, 0.3, 2.5)

    // Combine layers with carefully tuned weights
    let height = 0

    // Base continental elevation (40% weight)
    height += continentNoise * 0.4

    // Add mountain ridges with squared effect for sharper peaks (30% weight)
    const ridgeContribution = ridgeNoise * Math.abs(ridgeNoise)
    height += ridgeContribution * 0.3

    // Add rolling hills (20% weight)
    height += hillNoise * 0.2

    // Apply erosion to create valleys (10% weight, subtractive)
    height += erosionNoise * 0.1

    // Add fine detail (5% weight)
    height += detailNoise * 0.05

    // Normalize to [0, 1] range
    height = (height + 1) * 0.5
    height = Math.max(0, Math.min(1, height))

    // Apply power curve to create more dramatic elevation changes
    // Lower values = more valleys, higher values = more peaks
    height = Math.pow(height, 1.4)

    // Create ocean depressions
    const oceanScale = 0.0015
    const oceanMask = this.noise.simplex2D(worldX * oceanScale, worldZ * oceanScale)

    // If in ocean zone, depress the terrain
    if (oceanMask < -0.3) {
      const oceanDepth = (-0.3 - oceanMask) * 2 // How deep into ocean
      height *= Math.max(0.1, 1 - oceanDepth)
    }

    // Scale to actual world height
    const MAX_HEIGHT = 80 // Maximum terrain height in meters
    const finalHeight = height * MAX_HEIGHT

    if (!isFinite(finalHeight)) {
      throw new Error(
        `[TerrainSystem.getHeightAt] Calculated invalid height: ${finalHeight} at worldX=${worldX}, worldZ=${worldZ}`
      )
    }

    return finalHeight
  }

  /**
   * Compute the terrain surface normal at a world position.
   * Uses central differences on the scalar height field h(x, z).
   * Returns a normalized THREE.Vector3 where y is the up component.
   */
  getNormalAt(worldX: number, worldZ: number): THREE.Vector3 {
    // Use a small sampling distance relative to tile resolution
    const sampleDistance = 0.5

    // Sample heights around the point with central differences
    const hL = this.getHeightAt(worldX - sampleDistance, worldZ)
    const hR = this.getHeightAt(worldX + sampleDistance, worldZ)
    const hD = this.getHeightAt(worldX, worldZ - sampleDistance)
    const hU = this.getHeightAt(worldX, worldZ + sampleDistance)

    // Partial derivatives: dh/dx and dh/dz
    const dhdx = (hR - hL) / (2 * sampleDistance)
    const dhdz = (hU - hD) / (2 * sampleDistance)

    // For a heightfield y = h(x, z), a surface normal can be constructed as (-dhdx, 1, -dhdz)
    const normal = this._tempVec3.set(-dhdx, 1, -dhdz)
    normal.normalize()
    return normal
  }

  private generateNoise(x: number, z: number): number {
    // Safeguard against NaN inputs
    if (isNaN(x) || isNaN(z)) {
      return 0
    }

    const sin1 = Math.sin(x * 2.1 + z * 1.7)
    const cos1 = Math.cos(x * 1.3 - z * 2.4)
    const sin2 = Math.sin(x * 3.7 - z * 4.1)
    const cos2 = Math.cos(x * 5.2 + z * 3.8)

    const result = (sin1 * cos1 + sin2 * cos2 * 0.5) * 0.5

    // Safeguard against NaN results
    if (isNaN(result)) {
      return 0
    }

    return result
  }

  private getBiomeAt(tileX: number, tileZ: number): string {
    // Get world coordinates for center of tile
    const worldX = tileX * this.CONFIG.TILE_SIZE + this.CONFIG.TILE_SIZE / 2
    const worldZ = tileZ * this.CONFIG.TILE_SIZE + this.CONFIG.TILE_SIZE / 2

    // Check if near starter towns first (safe zones)
    const towns = [
      { x: 0, z: 0, name: 'Brookhaven' },
      { x: 10, z: 0, name: 'Eastport' },
      { x: -10, z: 0, name: 'Westfall' },
      { x: 0, z: 10, name: 'Northridge' },
      { x: 0, z: -10, name: 'Southmere' },
    ]

    for (const town of towns) {
      const distance = Math.sqrt((tileX - town.x) ** 2 + (tileZ - town.z) ** 2)
      if (distance < 3) return 'starter_towns'
    }

    return this.getBiomeAtWorldPosition(worldX, worldZ)
  }

  private getBiomeInfluencesAtPosition(worldX: number, worldZ: number): Array<{ type: string; weight: number }> {
    // Get height for biome weighting
    const height = this.getHeightAt(worldX, worldZ)
    const normalizedHeight = height / 80

    const biomeInfluences: Array<{ type: string; weight: number }> = []

    // Calculate influence from each biome center
    for (const center of this.biomeCenters) {
      const distance = Math.sqrt((worldX - center.x) ** 2 + (worldZ - center.z) ** 2)

      // Use smoother falloff for more organic blending
      if (distance < center.influence * 3) {
        // Use a smoother gaussian falloff
        const normalizedDistance = distance / center.influence
        const weight = Math.exp(-normalizedDistance * normalizedDistance * 0.5)

        // Adjust weight based on height appropriateness for the biome
        let heightMultiplier = 1.0

        if (center.type === 'lakes' && normalizedHeight < 0.2) {
          heightMultiplier = 1.8
        } else if (center.type === 'northern_reaches' && normalizedHeight > 0.6) {
          heightMultiplier = 1.8
        } else if (center.type === 'darkwood_forest' && normalizedHeight > 0.3 && normalizedHeight < 0.7) {
          heightMultiplier = 1.4
        } else if (center.type === 'plains' && normalizedHeight > 0.2 && normalizedHeight < 0.4) {
          heightMultiplier = 1.4
        }

        if (weight > 0.001) {
          biomeInfluences.push({
            type: center.type,
            weight: weight * heightMultiplier,
          })
        }
      }
    }

    // Normalize weights
    const totalWeight = biomeInfluences.reduce((sum, b) => sum + b.weight, 0)
    if (totalWeight > 0) {
      for (const influence of biomeInfluences) {
        influence.weight /= totalWeight
      }
    } else {
      // Fallback to height-based biome
      const fallbackBiome =
        normalizedHeight < 0.15
          ? 'lakes'
          : normalizedHeight < 0.35
            ? 'plains'
            : normalizedHeight < 0.6
              ? 'darkwood_forest'
              : 'northern_reaches'
      biomeInfluences.push({ type: fallbackBiome, weight: 1.0 })
    }

    return biomeInfluences
  }

  private getBiomeAtWorldPosition(worldX: number, worldZ: number): string {
    const influences = this.getBiomeInfluencesAtPosition(worldX, worldZ);
    return influences.length > 0 ? influences[0].type : 'plains';
  }

  private getBiomeNoise(x: number, z: number): number {
    // Simple noise function for biome determination
    return (
      Math.sin(x * 2.1 + z * 1.7) * Math.cos(x * 1.3 - z * 2.4) * 0.5 +
      Math.sin(x * 4.2 + z * 3.8) * Math.cos(x * 2.7 - z * 4.1) * 0.3 +
      Math.sin(x * 8.1 - z * 6.2) * Math.cos(x * 5.9 + z * 7.3) * 0.2
    )
  }

  // Map internal biome keys to generic TerrainTileData biome set
  private mapBiomeToGeneric(
    internal: string
  ): 'forest' | 'plains' | 'desert' | 'mountains' | 'swamp' | 'tundra' | 'jungle' {
    switch (internal) {
      case 'mistwood_valley':
      case 'darkwood_forest':
        return 'forest'
      case 'plains':
      case 'starter_towns':
        return 'plains'
      case 'northern_reaches':
        return 'tundra'
      case 'blasted_lands':
      case 'goblin_wastes':
        return 'desert'
      case 'lakes':
        return 'swamp'
      default:
        return 'plains'
    }
  }

  private generateTileResources(tile: TerrainTile): void {
    const biomeData = this.BIOMES[tile.biome]

    this.generateTreesForTile(tile, biomeData)
    this.generateOtherResourcesForTile(tile, biomeData)
    // Roads are now generated using noise patterns instead of segments
  }

  private generateTreesForTile(tile: TerrainTile, biomeData: BiomeData): void {
    // Trees generation based on biome type
    if (!biomeData.resources.includes('tree')) return

    let treeDensity = this.CONFIG.RESOURCE_DENSITY

    // Adjust density based on biome
    const biomeName = tile.biome as string
    switch (biomeName) {
      case 'mistwood_valley':
      case 'darkwood_forest':
        treeDensity = this.CONFIG.TREE_DENSITY // Higher density in forests
        break
      case 'plains':
      case 'starter_towns':
        treeDensity = this.CONFIG.RESOURCE_DENSITY * 0.5 // Lower density in open areas
        break
      case 'northern_reaches':
      case 'blasted_lands':
        treeDensity = this.CONFIG.RESOURCE_DENSITY * 0.2 // Very few trees in harsh areas
        break
    }

    const treeCount = Math.floor((this.CONFIG.TILE_SIZE / 10) ** 2 * treeDensity)

    for (let i = 0; i < treeCount; i++) {
      const worldX = tile.x * this.CONFIG.TILE_SIZE + (Math.random() - 0.5) * this.CONFIG.TILE_SIZE
      const worldZ = tile.z * this.CONFIG.TILE_SIZE + (Math.random() - 0.5) * this.CONFIG.TILE_SIZE

      // Check if position is walkable (don't place trees in water or on steep slopes)
      const walkableCheck = this.isPositionWalkable(worldX, worldZ)
      if (!walkableCheck.walkable) continue

      const height = this.getHeightAt(worldX, worldZ)
      const position = this._tempVec3.set(
        worldX - tile.x * this.CONFIG.TILE_SIZE,
        height,
        worldZ - tile.z * this.CONFIG.TILE_SIZE
      )

      const tree: ResourceNode = {
        id: `${tile.key}_tree_${i}`,
        type: 'tree',
        position,
        mesh: null,
        health: 100,
        maxHealth: 100,
        respawnTime: 300000, // 5 minutes
        harvestable: true,
        requiredLevel: 1,
      }

      tile.resources.push(tree)
    }
  }

  private generateOtherResourcesForTile(tile: TerrainTile, biomeData: BiomeData): void {
    // Generate other resources (ore, herbs, fishing spots, etc.)
    const otherResources = biomeData.resources.filter(r => r !== 'tree')

    for (const resourceType of otherResources) {
      let resourceCount = 0

      // Determine count based on resource type and biome
      switch (resourceType) {
        case 'fish':
          resourceCount = (tile.biome as string) === 'lakes' ? 3 : 0
          break
        case 'ore':
        case 'rare_ore':
          resourceCount = Math.random() < 0.3 ? 1 : 0
          break
        case 'herb':
          resourceCount = Math.floor(Math.random() * 3)
          break
        case 'rock':
          resourceCount = Math.floor(Math.random() * 2)
          break
        case 'gem':
          resourceCount = Math.random() < 0.1 ? 1 : 0 // Rare
          break
      }

      for (let i = 0; i < resourceCount; i++) {
        const worldX = tile.x * this.CONFIG.TILE_SIZE + (Math.random() - 0.5) * this.CONFIG.TILE_SIZE
        const worldZ = tile.z * this.CONFIG.TILE_SIZE + (Math.random() - 0.5) * this.CONFIG.TILE_SIZE

        // For fishing spots, place near water
        if (resourceType === 'fish') {
          const height = this.getHeightAt(worldX, worldZ)
          if (height >= biomeData.waterLevel) continue // Only place fish in water
        }

        const height = this.getHeightAt(worldX, worldZ)
        const position = this._tempVec3.set(
          worldX - tile.x * this.CONFIG.TILE_SIZE,
          height,
          worldZ - tile.z * this.CONFIG.TILE_SIZE
        )

        const resource: ResourceNode = {
          id: `${tile.key}_${resourceType}_${i}`,
          type: resourceType as ResourceNode['type'],
          position,
          mesh: null,
          health: 100,
          maxHealth: 100,
          respawnTime: 300000, // 5 minutes
          harvestable: true,
          requiredLevel: 1,
        }

        tile.resources.push(resource)
      }
    }
  }

  // DEPRECATED: Roads are now generated using noise patterns instead of segments
  private generateRoadsForTile(_tile: TerrainTile): void {
    // No longer generating road segments - using noise-based paths instead
  }

  /**
   * Calculate road influence for vertex coloring
   */
  private calculateRoadVertexInfluence(tileX: number, tileZ: number): Map<string, number> {
    const roadMap = new Map<string, number>()

    // Generate temporary tile to get road data
    const tempTile: TerrainTile = {
      key: `temp_${tileX}_${tileZ}`,
      x: tileX,
      z: tileZ,
      mesh: null as unknown as THREE.Mesh,
      biome: this.getBiomeAt(tileX, tileZ) as TerrainTile['biome'],
      resources: [],
      roads: [],
      generated: false,
      playerCount: 0,
      needsSave: false,
      collision: null,
      waterMeshes: [],
      heightData: [],
      lastActiveTime: new Date(),
      chunkSeed: 0,
      heightMap: new Float32Array(0),
      collider: null,
      lastUpdate: Date.now(),
    }

    // Roads are now generated using noise patterns

    // Calculate influence for each vertex position
    const resolution = this.CONFIG.TILE_RESOLUTION
    const step = this.CONFIG.TILE_SIZE / (resolution - 1)

    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const localX = (i - (resolution - 1) / 2) * step
        const localZ = (j - (resolution - 1) / 2) * step

        let maxInfluence = 0

        // Check distance to each road segment
        for (const road of tempTile.roads) {
          const distanceToRoad = this.distanceToLineSegment(
            new THREE.Vector2(localX, localZ),
            road.start instanceof THREE.Vector2 ? road.start : new THREE.Vector2(road.start.x, road.start.z),
            road.end instanceof THREE.Vector2 ? road.end : new THREE.Vector2(road.end.x, road.end.z)
          )

          // Calculate influence based on distance (closer = more influence)
          const halfWidth = road.width * 0.5
          if (distanceToRoad <= halfWidth) {
            const influence = 1 - distanceToRoad / halfWidth
            maxInfluence = Math.max(maxInfluence, influence)
          }
        }

        if (maxInfluence > 0) {
          roadMap.set(`${localX.toFixed(1)},${localZ.toFixed(1)}`, maxInfluence)
        }
      }
    }

    return roadMap
  }

  /**
   * Calculate distance from point to line segment
   */
  private distanceToLineSegment(point: THREE.Vector2, lineStart: THREE.Vector2, lineEnd: THREE.Vector2): number {
    const lineLengthSquared = lineStart.distanceToSquared(lineEnd)

    if (lineLengthSquared === 0) {
      return point.distanceTo(lineStart)
    }

    const t = Math.max(
      0,
      Math.min(1, this._tempVec2.copy(point).sub(lineStart).dot(this._tempVec2_2.copy(lineEnd).sub(lineStart)) / lineLengthSquared)
    )

    const projection = this._tempVec2.copy(lineStart).add(this._tempVec2_2.copy(lineEnd).sub(lineStart).multiplyScalar(t))

    return point.distanceTo(projection)
  }

  /**
   * Store height data for persistence and collision generation
   */
  private storeHeightData(tileX: number, tileZ: number, heightData: number[]): void {
    const key = `${tileX}_${tileZ}`
    const tile = this.terrainTiles.get(key)

    if (tile) {
      tile.heightData = heightData
      tile.needsSave = true
    }
  }

  private saveModifiedChunks(): void {
    // Assume database system exists - this method is only called on server
    const chunksToSave = Array.from(this.terrainTiles.values()).filter(tile => tile.needsSave)

    for (const tile of chunksToSave) {
        const chunkData: WorldChunk = {
          chunkX: tile.x,
          chunkZ: tile.z,
          biome: tile.biome || 'grassland',
          heightData: tile.heightData || [],
          chunkSeed: tile.chunkSeed || 0,
          lastActiveTime: tile.lastActiveTime || new Date(),
          lastActivity: tile.lastActiveTime || new Date(),
        }

        if (this.databaseSystem) {
          this.databaseSystem.saveWorldChunk(chunkData)
        }
        tile.needsSave = false
    }

    if (chunksToSave.length > 0) {
      // Chunks successfully saved to database
    }
  }

  update(_deltaTime: number): void {
    // Process queued tile generations within a small per-frame budget
    this.processTileGenerationQueue()

    // Process queued collision generation on the server
    if (this.world.network?.isServer) {
      this.processCollisionGenerationQueue()
    }

    // Update instance visibility on client based on player position
    if (this.world.network?.isClient && this.instancedMeshManager) {
      this.instancedMeshManager.updateAllInstanceVisibility()

      // Log pooling stats occasionally for debugging
      if (Math.random() < 0.002) {
        // Log approximately once every 500 frames at 60fps
        const stats = this.instancedMeshManager.getPoolingStats()
              }
    }
  }

  private checkPlayerMovement(): void {
    // Get player positions and update loaded tiles accordingly
    const players = this.world.getPlayers() || []

    for (const player of players) {
      if (player.node.position) {
        // Validate position values
        const x = player.node.position.x
        const z = player.node.position.z

        const tileX = Math.floor(x / this.CONFIG.TILE_SIZE)
        const tileZ = Math.floor(z / this.CONFIG.TILE_SIZE)

        // Check if player moved to a new tile
        if (tileX !== this.lastPlayerTile.x || tileZ !== this.lastPlayerTile.z) {
          this.updateTilesAroundPlayer(tileX, tileZ)
          this.lastPlayerTile = { x: tileX, z: tileZ }
        }
      }
    }
  }

  private updateTilesAroundPlayer(centerX: number, centerZ: number): void {
    const requiredTiles = new Set<string>()

    // Generate list of required tiles (3x3 around player)
    for (let dx = -this.CONFIG.VIEW_DISTANCE; dx <= this.CONFIG.VIEW_DISTANCE; dx++) {
      for (let dz = -this.CONFIG.VIEW_DISTANCE; dz <= this.CONFIG.VIEW_DISTANCE; dz++) {
        const tileX = centerX + dx
        const tileZ = centerZ + dz
        requiredTiles.add(`${tileX}_${tileZ}`)
      }
    }

    // Unload tiles that are no longer needed
    for (const [key, tile] of this.terrainTiles) {
      if (!requiredTiles.has(key)) {
        this.unloadTile(tile)
      }
    }

    // Load new tiles that are needed
    for (const key of requiredTiles) {
      if (!this.terrainTiles.has(key)) {
        const [tileX, tileZ] = key.split('_').map(Number)
        this.generateTile(tileX, tileZ)
      }
    }
  }

  private unloadTile(tile: TerrainTile): void {
    // Clean up road meshes
    for (const road of tile.roads) {
      if (road.mesh && road.mesh.parent) {
        road.mesh.parent.remove(road.mesh)
        road.mesh.geometry.dispose()
        if (road.mesh.material instanceof THREE.Material) {
          road.mesh.material.dispose()
        }
        road.mesh = null
      }
    }

    // Remove instanced meshes for this tile
    if (this.instancedMeshManager) {
      for (const resource of tile.resources) {
        if (resource.instanceId != null && resource.meshType) {
          this.instancedMeshManager.removeInstance(resource.meshType, resource.instanceId)
        }
      }
    }

    // Clean up water meshes
    if (tile.waterMeshes) {
      for (const waterMesh of tile.waterMeshes) {
        if (waterMesh.parent) {
          waterMesh.parent.remove(waterMesh)
          waterMesh.geometry.dispose()
          if (waterMesh.material instanceof THREE.Material) {
            waterMesh.material.dispose()
          }
        }
      }
      tile.waterMeshes = []
    }

    // Remove main tile mesh from scene
    if (this.terrainContainer && tile.mesh.parent) {
      this.terrainContainer.remove(tile.mesh)
      tile.mesh.geometry.dispose()
      if (tile.mesh.material instanceof THREE.Material) {
        tile.mesh.material.dispose()
      }
    }

    // Remove collision
    if (tile.collision) {
      tile.collision.release()
    }

    // Save if needed
    if (tile.needsSave && this.databaseSystem) {
      // Save tile data before unloading
      // This would be implemented when we have the database schema
    }

    // Remove from maps
    this.terrainTiles.delete(tile.key)
    this.activeChunks.delete(tile.key)
    try {
      this.world.emit('terrain:tile:unloaded', { tileId: `${tile.x},${tile.z}` })
    } catch (_e) {}
  }

  // ===== TERRAIN MOVEMENT CONSTRAINTS (GDD Requirement) =====

  /**
   * Check if a position is walkable based on terrain constraints
   * Implements GDD rules: "Water bodies are impassable" and "Steep mountain slopes block movement"
   */
  isPositionWalkable(worldX: number, worldZ: number): { walkable: boolean; reason?: string } {
    const tileX = Math.floor(worldX / this.CONFIG.TILE_SIZE)
    const tileZ = Math.floor(worldZ / this.CONFIG.TILE_SIZE)
    const biome = this.getBiomeAt(tileX, tileZ)
    const biomeData = this.BIOMES[biome]

    // Get height at position
    const height = this.getHeightAt(worldX, worldZ)

    // Check if underwater (water impassable rule)
    if (height < biomeData.waterLevel) {
      return { walkable: false, reason: 'Water bodies are impassable' }
    }

    // Check slope constraints
    const slope = this.calculateSlope(worldX, worldZ)
    if (slope > biomeData.maxSlope) {
      return { walkable: false, reason: 'Steep mountain slopes block movement' }
    }

    // Special case for lakes biome - always impassable
    if (biome === 'lakes') {
      return { walkable: false, reason: 'Lake water is impassable' }
    }

    return { walkable: true }
  }

  /**
   * Calculate slope at a given world position
   */
  private calculateSlope(worldX: number, worldZ: number): number {
    const checkDistance = this.CONFIG.SLOPE_CHECK_DISTANCE
    const centerHeight = this.getHeightAt(worldX, worldZ)

    // Sample heights in 4 directions
    const northHeight = this.getHeightAt(worldX, worldZ + checkDistance)
    const southHeight = this.getHeightAt(worldX, worldZ - checkDistance)
    const eastHeight = this.getHeightAt(worldX + checkDistance, worldZ)
    const westHeight = this.getHeightAt(worldX - checkDistance, worldZ)

    // Calculate maximum slope in any direction
    const slopes = [
      Math.abs(northHeight - centerHeight) / checkDistance,
      Math.abs(southHeight - centerHeight) / checkDistance,
      Math.abs(eastHeight - centerHeight) / checkDistance,
      Math.abs(westHeight - centerHeight) / checkDistance,
    ]

    return Math.max(...slopes)
  }

  /**
   * Find a walkable path between two points (basic pathfinding)
   */
  findWalkablePath(
    startX: number,
    startZ: number,
    endX: number,
    endZ: number
  ): { path: Array<{ x: number; z: number }>; blocked: boolean } {
    // Simple line-of-sight check first
    const steps = 20
    const dx = (endX - startX) / steps
    const dz = (endZ - startZ) / steps

    const path: Array<{ x: number; z: number }> = []

    for (let i = 0; i <= steps; i++) {
      const x = startX + dx * i
      const z = startZ + dz * i

      const walkableCheck = this.isPositionWalkable(x, z)
      if (!walkableCheck.walkable) {
        // Path is blocked, would need A* pathfinding for complex routing
        return { path: [], blocked: true }
      }

      path.push({ x, z })
    }

    return { path, blocked: false }
  }

  /**
   * Get terrain info at world position (for movement system integration)
   */
  getTerrainInfoAt(
    worldX: number,
    worldZ: number
  ): {
    height: number
    biome: string
    walkable: boolean
    slope: number
    underwater: boolean
  } {
    const height = this.getHeightAt(worldX, worldZ)
    const tileX = Math.floor(worldX / this.CONFIG.TILE_SIZE)
    const tileZ = Math.floor(worldZ / this.CONFIG.TILE_SIZE)
    const biome = this.getBiomeAt(tileX, tileZ)
    const biomeData = this.BIOMES[biome]
    const slope = this.calculateSlope(worldX, worldZ)
    const walkableCheck = this.isPositionWalkable(worldX, worldZ)

    return {
      height,
      biome,
      walkable: walkableCheck.walkable,
      slope,
      underwater: height < biomeData.waterLevel,
    }
  }

  // ===== TERRAIN-BASED MOB SPAWNING (GDD Integration) =====

  /**
   * Generate visual features (road meshes, lake meshes) for a tile
   */
  private generateVisualFeatures(tile: TerrainTile): void {
    // Roads are rendered as noise-based color paths; no mesh generation

    // Generate lake meshes for water bodies
    this.generateLakeMeshes(tile)
  }

  /**
   * Generate visual road meshes for better visibility
   */
  private generateRoadMeshes(_tile: TerrainTile): void {}

  /**
   * Generate water meshes for low areas
   */
  private generateWaterMeshes(tile: TerrainTile): void {
    // Sample tile to find water areas
    const waterLevel = 12 // Water appears below 12m elevation
    const sampleStep = 20 // Sample every 20m
    const waterAreas: Array<{ x: number; z: number; depth: number }> = []

    for (let x = -this.CONFIG.TILE_SIZE / 2; x < this.CONFIG.TILE_SIZE / 2; x += sampleStep) {
      for (let z = -this.CONFIG.TILE_SIZE / 2; z < this.CONFIG.TILE_SIZE / 2; z += sampleStep) {
        const worldX = tile.x * this.CONFIG.TILE_SIZE + x
        const worldZ = tile.z * this.CONFIG.TILE_SIZE + z
        const height = this.getHeightAt(worldX, worldZ)

        if (height < waterLevel) {
          waterAreas.push({
            x: x,
            z: z,
            depth: waterLevel - height,
          })
        }
      }
    }

    // Create water plane if we found water
    if (waterAreas.length > 5) {
      // At least 5 water samples
      const waterGeometry = new THREE.PlaneGeometry(this.CONFIG.TILE_SIZE, this.CONFIG.TILE_SIZE)
      waterGeometry.rotateX(-Math.PI / 2)

      const waterMaterial = new THREE.MeshPhongMaterial({
        color: 0x1e3a5f,
        transparent: true,
        opacity: 0.7,
        shininess: 100,
        specular: 0x4080ff,
      })

      const waterMesh = new THREE.Mesh(waterGeometry, waterMaterial)
      waterMesh.position.y = waterLevel
      waterMesh.name = `Water_${tile.key}`
      waterMesh.userData = {
        type: 'water',
        walkable: false,
        clickable: false,
      }

      if (tile.mesh) {
        tile.mesh.add(waterMesh)
        tile.waterMeshes.push(waterMesh)
      }
    }
  }

  /**
   * Generate visual lake meshes for water bodies
   */
  private generateLakeMeshes(tile: TerrainTile): void {
    const biomeData = this.BIOMES[tile.biome]
    if (!biomeData) return

    // Only generate lake meshes for water biomes or areas below water level
    if ((tile.biome as string) === 'lakes' || biomeData.waterLevel > 0) {
      // Sample the tile to find water areas
      const waterAreas = this.findWaterAreas(tile)

      for (const waterArea of waterAreas) {
        const waterGeometry = new THREE.PlaneGeometry(waterArea.width, waterArea.depth)

        // Create water material with transparency and animation
        const waterMaterial = new THREE.MeshLambertMaterial({
          color: 0x1e6ba8, // Blue water color
          transparent: true,
          opacity: 0.7,
          side: THREE.DoubleSide,
        })

        const waterMesh = new THREE.Mesh(waterGeometry, waterMaterial)
        waterMesh.position.set(
          waterArea.centerX,
          biomeData.waterLevel + 0.01, // At water level
          waterArea.centerZ
        )
        waterMesh.rotation.x = -Math.PI / 2 // Lay flat

        // Add userData for interaction detection (water is NOT walkable)
        waterMesh.userData = {
          type: 'terrain',
          walkable: false, // Water is impassable per GDD
          clickable: true,
          subType: 'water',
          tileKey: tile.key,
          biome: tile.biome,
        }

        // Add to terrain container
        if (tile.mesh) {
          tile.mesh.add(waterMesh)
        }

        // Store reference for potential updates
        if (!tile.waterMeshes) tile.waterMeshes = []
        tile.waterMeshes.push(waterMesh)
      }
    }
  }

  /**
   * Find water areas within a tile that need visual representation
   */
  private findWaterAreas(tile: TerrainTile): Array<{ centerX: number; centerZ: number; width: number; depth: number }> {
    const waterAreas: Array<{ centerX: number; centerZ: number; width: number; depth: number }> = []
    const biomeData = this.BIOMES[tile.biome]
    if (!biomeData) return waterAreas

    // For lakes biome, create a large water area covering most of the tile
    if ((tile.biome as string) === 'lakes') {
      waterAreas.push({
        centerX: 0,
        centerZ: 0,
        width: this.CONFIG.TILE_SIZE * 0.8,
        depth: this.CONFIG.TILE_SIZE * 0.8,
      })
    } else {
      // For other biomes, sample the heightmap to find areas below water level
      const sampleSize = 10 // Sample every 10 meters
      const samples: Array<{ x: number; z: number; underwater: boolean }> = []

      for (let x = -this.CONFIG.TILE_SIZE / 2; x < this.CONFIG.TILE_SIZE / 2; x += sampleSize) {
        for (let z = -this.CONFIG.TILE_SIZE / 2; z < this.CONFIG.TILE_SIZE / 2; z += sampleSize) {
          const worldX = tile.x * this.CONFIG.TILE_SIZE + x
          const worldZ = tile.z * this.CONFIG.TILE_SIZE + z
          const height = this.getHeightAt(worldX, worldZ)

          samples.push({
            x,
            z,
            underwater: height < biomeData.waterLevel,
          })
        }
      }

      // Group contiguous underwater areas (simplified approach)
      const underwaterSamples = samples.filter(s => s.underwater)
      if (underwaterSamples.length > 0) {
        // Create one water area covering the underwater region
        const minX = Math.min(...underwaterSamples.map(s => s.x))
        const maxX = Math.max(...underwaterSamples.map(s => s.x))
        const minZ = Math.min(...underwaterSamples.map(s => s.z))
        const maxZ = Math.max(...underwaterSamples.map(s => s.z))

        waterAreas.push({
          centerX: (minX + maxX) / 2,
          centerZ: (minZ + maxZ) / 2,
          width: maxX - minX + sampleSize,
          depth: maxZ - minZ + sampleSize,
        })
      }
    }

    return waterAreas
  }

  /**
   * Get valid mob spawn positions in a tile based on biome and terrain constraints
   */
  getMobSpawnPositionsForTile(
    tileX: number,
    tileZ: number,
    maxSpawns: number = 10
  ): Array<{
    position: { x: number; y: number; z: number }
    mobTypes: string[]
    biome: string
    difficulty: number
  }> {
    const biome = this.getBiomeAt(tileX, tileZ)
    const biomeData = this.BIOMES[biome]

    // Don't spawn mobs in safe zones
    if (biomeData.difficulty === 0 || biomeData.mobTypes.length === 0) {
      return []
    }

    const spawnPositions: Array<{
      position: { x: number; y: number; z: number }
      mobTypes: string[]
      biome: string
      difficulty: number
    }> = []

    // Try to find valid spawn positions
    let attempts = 0
    const maxAttempts = maxSpawns * 3 // Allow some failures

    while (spawnPositions.length < maxSpawns && attempts < maxAttempts) {
      attempts++

      // Random position within tile
      const worldX = tileX * this.CONFIG.TILE_SIZE + (Math.random() - 0.5) * this.CONFIG.TILE_SIZE * 0.8
      const worldZ = tileZ * this.CONFIG.TILE_SIZE + (Math.random() - 0.5) * this.CONFIG.TILE_SIZE * 0.8

      // Check if position is suitable for mob spawning
      const terrainInfo = this.getTerrainInfoAt(worldX, worldZ)

      if (!terrainInfo.walkable || terrainInfo.underwater) {
        continue // Skip unwalkable positions
      }

      // Check distance from roads (don't spawn too close to roads)
      if (this.isPositionNearRoad(worldX, worldZ, 8)) {
        continue // Skip positions near roads
      }

      // Check distance from starter towns
      if (this.isPositionNearTown(worldX, worldZ, this.CONFIG.TOWN_RADIUS)) {
        continue // Skip positions near safe towns
      }

      spawnPositions.push({
        position: {
          x: worldX,
          y: terrainInfo.height,
          z: worldZ,
        },
        mobTypes: [...biomeData.mobTypes],
        biome: biome,
        difficulty: biomeData.difficulty,
      })
    }

    return spawnPositions
  }

  /**
   * Check if position is near a road
   */
  private isPositionNearRoad(worldX: number, worldZ: number, minDistance: number): boolean {
    const tileX = Math.floor(worldX / this.CONFIG.TILE_SIZE)
    const tileZ = Math.floor(worldZ / this.CONFIG.TILE_SIZE)

    // Check current tile and adjacent tiles for roads
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const checkTileX = tileX + dx
        const checkTileZ = tileZ + dz
        const tileKey = `${checkTileX}_${checkTileZ}`
        const tile = this.terrainTiles.get(tileKey)

        if (tile && tile.roads.length > 0) {
          for (const road of tile.roads) {
            const localX = worldX - checkTileX * this.CONFIG.TILE_SIZE
            const localZ = worldZ - checkTileZ * this.CONFIG.TILE_SIZE

            const distanceToRoad = this.distanceToLineSegment(
              new THREE.Vector2(localX, localZ),
              road.start instanceof THREE.Vector2 ? road.start : new THREE.Vector2(road.start.x, road.start.z),
              road.end instanceof THREE.Vector2 ? road.end : new THREE.Vector2(road.end.x, road.end.z)
            )

            if (distanceToRoad < minDistance) {
              return true
            }
          }
        }
      }
    }

    return false
  }

  /**
   * Check if position is near a starter town
   */
  private isPositionNearTown(worldX: number, worldZ: number, minDistance: number): boolean {
    const towns = [
      { x: 0, z: 0 },
      { x: 10 * this.CONFIG.TILE_SIZE, z: 0 },
      { x: -10 * this.CONFIG.TILE_SIZE, z: 0 },
      { x: 0, z: 10 * this.CONFIG.TILE_SIZE },
      { x: 0, z: -10 * this.CONFIG.TILE_SIZE },
    ]

    for (const town of towns) {
      const distance = Math.sqrt((worldX - town.x) ** 2 + (worldZ - town.z) ** 2)
      if (distance < minDistance) {
        return true
      }
    }

    return false
  }

  /**
   * Get all mob types available in a specific biome
   */
  getBiomeMobTypes(biome: string): string[] {
    const biomeData = this.BIOMES[biome]
    return biomeData ? [...biomeData.mobTypes] : []
  }

  /**
   * Get biome difficulty level for mob spawning
   */
  getBiomeDifficulty(biome: string): number {
    const biomeData = this.BIOMES[biome]
    return biomeData ? biomeData.difficulty : 0
  }

  /**
   * Get all loaded tiles with their biome and mob spawn data
   */
  getLoadedTilesWithSpawnData(): Array<{
    tileX: number
    tileZ: number
    biome: string
    difficulty: number
    mobTypes: string[]
    spawnPositions: Array<{ x: number; y: number; z: number }>
  }> {
    const tilesData: Array<{
      tileX: number
      tileZ: number
      biome: string
      difficulty: number
      mobTypes: string[]
      spawnPositions: Array<{ x: number; y: number; z: number }>
    }> = []

    for (const [key, tile] of this.terrainTiles.entries()) {
      const biomeData = this.BIOMES[tile.biome]

      if (biomeData.difficulty > 0 && biomeData.mobTypes.length > 0) {
        const spawnPositions = this.getMobSpawnPositionsForTile(tile.x, tile.z, 5)

        tilesData.push({
          tileX: tile.x,
          tileZ: tile.z,
          biome: tile.biome,
          difficulty: biomeData.difficulty,
          mobTypes: [...biomeData.mobTypes],
          spawnPositions: spawnPositions.map(spawn => spawn.position),
        })
      }
    }

    return tilesData
  }

  destroy(): void {
    // Perform final serialization before shutdown
    this.performImmediateSerialization()

    // Dispose instanced mesh manager
    if (this.instancedMeshManager) {
      this.instancedMeshManager.dispose()
    }

    // Clear save interval
    if (this.chunkSaveInterval) {
      clearInterval(this.chunkSaveInterval)
    }
    if (this.terrainUpdateIntervalId) {
      clearInterval(this.terrainUpdateIntervalId)
    }
    if (this.serializationIntervalId) {
      clearInterval(this.serializationIntervalId)
    }
    if (this.boundingBoxIntervalId) {
      clearInterval(this.boundingBoxIntervalId)
    }

    // Save all modified chunks before shutdown
    this.saveModifiedChunks()

    // Unload all tiles
    for (const tile of this.terrainTiles.values()) {
      this.unloadTile(tile)
    }

    // Remove terrain container
    if (this.terrainContainer && this.terrainContainer.parent) {
      this.terrainContainer.parent.remove(this.terrainContainer)
    }

    // Clear tracking data
    this.playerChunks.clear()
    this.simulatedChunks.clear()
    this.chunkPlayerCounts.clear()
    this.terrainBoundingBoxes.clear()
    this.pendingSerializationData.clear()
  }

  // Methods for chunk persistence (used by tests)
  markChunkActive(chunkX: number, chunkZ: number): void {
    const key = `${chunkX}_${chunkZ}`

    // Add to simulated chunks if not already there
    this.simulatedChunks.add(key)

    // Update chunk player count
    const currentCount = this.chunkPlayerCounts.get(key) || 0
    this.chunkPlayerCounts.set(key, currentCount + 1)
  }

  markChunkInactive(chunkX: number, chunkZ: number): void {
    const key = `${chunkX}_${chunkZ}`

    // Decrease chunk player count
    const currentCount = this.chunkPlayerCounts.get(key) || 0
    if (currentCount > 1) {
      this.chunkPlayerCounts.set(key, currentCount - 1)
    } else {
      // No more active references - remove from simulation
      this.chunkPlayerCounts.delete(key)
      this.simulatedChunks.delete(key)
    }
  }

  getActiveChunks(): Array<{ x: number; z: number }> {
    // Return currently loaded terrain tiles as "active chunks"
    const activeChunks: Array<{ x: number; z: number }> = []
    for (const [key, _tile] of this.terrainTiles.entries()) {
      // FIX: Use '_' separator, not ','
      const [x, z] = key.split('_').map(Number)
      activeChunks.push({ x, z })
    }
    return activeChunks
  }

  async saveAllActiveChunks(): Promise<void> {
    // In a real implementation, this would persist chunk data
    // For now, just save modified chunks
    this.saveModifiedChunks()
  }

  // ===== TEST INTEGRATION METHODS (expected by test-terrain.mjs) =====

  /**
   * Get comprehensive terrain statistics for testing
   */
  getTerrainStats(): {
    tileSize: string
    worldSize: string
    totalArea: string
    maxLoadedTiles: number
    tilesLoaded: number
    currentlyLoaded: string[]
    biomeCount: number
    chunkSize: number
    worldBounds: {
      min: { x: number; z: number }
      max: { x: number; z: number }
    }
    activeBiomes: string[]
    totalRoads: number
  } {
    const activeChunks = Array.from(this.terrainTiles.keys())
    return {
      tileSize: '100x100m',
      worldSize: '100x100',
      totalArea: '10km x 10km',
      maxLoadedTiles: 9,
      tilesLoaded: this.terrainTiles.size,
      currentlyLoaded: activeChunks,
      biomeCount: Object.keys(this.BIOMES).length,
      chunkSize: this.CONFIG.TILE_SIZE,
      worldBounds: {
        min: { x: -this.CONFIG.WORLD_SIZE / 2, z: -this.CONFIG.WORLD_SIZE / 2 },
        max: { x: this.CONFIG.WORLD_SIZE / 2, z: this.CONFIG.WORLD_SIZE / 2 },
      },
      activeBiomes: Array.from(new Set(Array.from(this.terrainTiles.values()).map(t => t.biome))),
      totalRoads: Array.from(this.terrainTiles.values()).reduce((sum, t) => sum + t.roads.length, 0),
    }
  }

  /**
   * Get biome name at world position (wrapper for test compatibility)
   */
  getBiomeAtPosition(x: number, z: number): string {
    const tileX = Math.floor(x / this.CONFIG.TILE_SIZE)
    const tileZ = Math.floor(z / this.CONFIG.TILE_SIZE)
    const biome = this.getBiomeAt(tileX, tileZ)
    return biome
  }

  /**
   * Get height at world position (wrapper for test compatibility)
   */
  getHeightAtPosition(x: number, z: number): number {
    return this.getHeightAt(x, z)
  }

  // ===== MMOCHUNK LOADING AND SIMULATION SYSTEM =====

  /**
   * Initialize chunk loading system with 9 core + ring strategy
   */
  private initializeChunkLoadingSystem(): void {
    // Balanced load radius to reduce generation spikes when moving
    this.coreChunkRange = 2 // 5x5 core grid
    this.ringChunkRange = 3 // Preload ring up to ~7x7

    // Initialize tracking maps
    this.playerChunks.clear()
    this.simulatedChunks.clear()
    this.chunkPlayerCounts.clear()
  }

  /**
   * Initialize 15-minute serialization system
   */
  private initializeSerializationSystem(): void {
    this.lastSerializationTime = Date.now()
    this.serializationInterval = 15 * 60 * 1000 // 15 minutes
    this.worldStateVersion = 1
    this.pendingSerializationData.clear()
  }

  /**
   * Initialize bounding box verification system
   */
  private initializeBoundingBoxSystem(): void {
    // Set world bounds based on 100x100 tile grid
    this.worldBounds = {
      minX: -50 * this.CONFIG.TILE_SIZE,
      maxX: 50 * this.CONFIG.TILE_SIZE,
      minZ: -50 * this.CONFIG.TILE_SIZE,
      maxZ: 50 * this.CONFIG.TILE_SIZE,
      minY: -50,
      maxY: 100,
    }

    this.terrainBoundingBoxes.clear()
  }

  /**
   * Player-based terrain update with 9 core + ring strategy
   */
  private updatePlayerBasedTerrain(): void {
    if (this.isGenerating) return

    // Get all players
    const players = this.world.getPlayers() || []

    // Clear previous player chunk tracking
    this.playerChunks.clear()
    this.chunkPlayerCounts.clear()

    // Track which tiles are needed based on 9 core + ring strategy
    const neededTiles = new Set<string>()
    const simulationTiles = new Set<string>()

    for (const player of players) {
      const playerPos = player.node.position
      if (!playerPos) continue

      const playerId =
        (player as { playerId?: string; id?: string }).playerId ||
        (player as { playerId?: string; id?: string }).id ||
        'unknown'

      // Validate position values
      const x = playerPos.x
      const z = playerPos.z

      // Calculate tile position
      const tileX = Math.floor(x / this.CONFIG.TILE_SIZE)
      const tileZ = Math.floor(z / this.CONFIG.TILE_SIZE)

      // 9 core chunks (5x5 grid) - these get full simulation
      const coreChunks = new Set<string>()
      for (let dx = -this.coreChunkRange; dx <= this.coreChunkRange; dx++) {
        for (let dz = -this.coreChunkRange; dz <= this.coreChunkRange; dz++) {
          const tx = tileX + dx
          const tz = tileZ + dz
          const key = `${tx}_${tz}`
          coreChunks.add(key)
          neededTiles.add(key)
          simulationTiles.add(key)
        }
      }

      // Ring chunks around core - these are loaded but not simulated
      for (let dx = -this.ringChunkRange; dx <= this.ringChunkRange; dx++) {
        for (let dz = -this.ringChunkRange; dz <= this.ringChunkRange; dz++) {
          // Skip core chunks
          if (Math.abs(dx) <= this.coreChunkRange && Math.abs(dz) <= this.coreChunkRange) {
            continue
          }

          const tx = tileX + dx
          const tz = tileZ + dz
          const key = `${tx}_${tz}`
          neededTiles.add(key)
        }
      }

      // Terrain-only chunks for the horizon
      for (let dx = -this.terrainOnlyChunkRange; dx <= this.terrainOnlyChunkRange; dx++) {
        for (let dz = -this.terrainOnlyChunkRange; dz <= this.terrainOnlyChunkRange; dz++) {
          if (Math.abs(dx) <= this.ringChunkRange && Math.abs(dz) <= this.ringChunkRange) {
            continue
          }

          const tx = tileX + dx
          const tz = tileZ + dz
          const key = `${tx}_${tz}`
          neededTiles.add(key)
        }
      }

      // Track player chunks for shared world simulation
      this.playerChunks.set(playerId, coreChunks)

      // Count players per chunk for shared simulation
      for (const chunkKey of coreChunks) {
        const currentCount = this.chunkPlayerCounts.get(chunkKey) || 0
        this.chunkPlayerCounts.set(chunkKey, currentCount + 1)
      }
    }

    // Update simulated chunks - only chunks with players get simulation
    this.simulatedChunks.clear()
    for (const chunkKey of simulationTiles) {
      if (this.chunkPlayerCounts.get(chunkKey)! > 0) {
        this.simulatedChunks.add(chunkKey)
      }
    }

    // Approximate each player's center from their core chunk set
    const playerCenters: Array<{ x: number; z: number }> = []
    for (const player of players) {
      const playerPos = player.node.position
      if (playerPos) {
        const tileX = Math.floor(playerPos.x / this.CONFIG.TILE_SIZE)
        const tileZ = Math.floor(playerPos.z / this.CONFIG.TILE_SIZE)
        playerCenters.push({ x: tileX, z: tileZ })
      }
    }

    // Queue missing tiles for smooth generation
    for (const tileKey of neededTiles) {
      if (!this.terrainTiles.has(tileKey)) {
        const [x, z] = tileKey.split('_').map(Number)
        let generateContent = true

        if (playerCenters.length > 0) {
          let minChebyshev = Infinity
          for (const c of playerCenters) {
            const d = Math.max(Math.abs(x - c.x), Math.abs(z - c.z))
            if (d < minChebyshev) minChebyshev = d
          }
          if (minChebyshev > this.ringChunkRange) {
            generateContent = false
          }
        }

        this.enqueueTileForGeneration(x, z, generateContent)
      }
    }

    // Remove tiles that are no longer needed, with hysteresis padding
    // Approximate each player's center from their core chunk set
    for (const [tileKey, tile] of this.terrainTiles) {
      if (!neededTiles.has(tileKey)) {
        let minChebyshev = Infinity
        for (const c of playerCenters) {
          const d = Math.max(Math.abs(tile.x - c.x), Math.abs(tile.z - c.z))
          if (d < minChebyshev) minChebyshev = d
        }
        if (minChebyshev > this.terrainOnlyChunkRange + this.unloadPadding) {
          this.unloadTile(tile)
        }
      }
    }

    // Log simulation status every 10 updates
    if (Math.random() < 0.1) {
      const _totalPlayers = players.length
      const _simulatedChunkCount = this.simulatedChunks.size
      const _loadedChunkCount = this.terrainTiles.size

      // Simulation status tracked for debugging

      // Log shared world status
      const sharedChunks = Array.from(this.chunkPlayerCounts.entries())
        .filter(([_, count]) => count > 1)
        .map(([key, count]) => `${key}(${count})`)
        .join(', ')

      if (sharedChunks) {
        // Multiple players sharing chunks - enhanced simulation active
      }
    }
  }

  /**
   * Perform periodic serialization every 15 minutes
   */
  private performPeriodicSerialization(): void {
    const now = Date.now()

    if (now - this.lastSerializationTime >= this.serializationInterval) {
      this.performImmediateSerialization()
      this.lastSerializationTime = now
    }
  }

  /**
   * Perform immediate serialization of all world state
   */
  private performImmediateSerialization(): void {
    const startTime = Date.now()
    let _serializedChunks = 0

      // Serialize all active chunks
      for (const [key, tile] of this.terrainTiles) {
        const serializationData = {
          key: key,
          tileX: tile.x,
          tileZ: tile.z,
          biome: tile.biome,
          heightData: tile.heightData,
          resourceStates: tile.resources.map(r => ({
            id: r.id,
            type: r.type,
            position: [r.position.x, r.position.y, r.position.z] as [number, number, number],
          })),
          roadData: tile.roads.map(r => {
            // Roads use {x, z} format based on generateRoadsForTile implementation
            const startZ = (r.start as { x: number; z: number }).z
            const endZ = (r.end as { x: number; z: number }).z
            return {
              start: [r.start.x, startZ] as [number, number],
              end: [r.end.x, endZ] as [number, number],
              width: r.width,
            }
          }),
          playerCount: this.chunkPlayerCounts.get(key) || 0,
          lastActiveTime: tile.lastActiveTime,
          isSimulated: this.simulatedChunks.has(key),
          worldStateVersion: this.worldStateVersion,
          timestamp: Date.now(),
        }

        // Store for database persistence with proper tuple types
        const typedSerializationData = {
          ...serializationData,
          resourceStates: serializationData.resourceStates.map(rs => ({
            ...rs,
            position: rs.position as [number, number, number],
          })),
          roadData: serializationData.roadData.map(rd => ({
            ...rd,
            start: rd.start as [number, number],
            end: rd.end as [number, number],
          })),
        }
        this.pendingSerializationData.set(key, typedSerializationData)

            const chunkData: WorldChunk = {
              chunkX: tile.x,
              chunkZ: tile.z,
              biome: tile.biome || 'grassland',
              heightData: tile.heightData || [],
              chunkSeed: tile.chunkSeed || 0,
              lastActiveTime: tile.lastActiveTime || new Date(),
              lastActivity: tile.lastActiveTime || new Date(),
            }

            this.databaseSystem.saveWorldChunk(chunkData)
            _serializedChunks++
      }

      // Increment world state version
      this.worldStateVersion++

      const _elapsed = Date.now() - startTime
  }

  /**
   * Verify terrain bounding boxes for size validation
   */
  private verifyTerrainBoundingBoxes(): void {
    let _validBoxes = 0
    let _invalidBoxes = 0
    const oversizedTiles: string[] = []

    for (const [key, tile] of this.terrainTiles) {
      // Calculate bounding box for this tile
      const box = this._tempBox3;

      if (tile.mesh && tile.mesh.geometry) {
        box.setFromObject(tile.mesh)

        // Verify tile is within expected size bounds
        const tempVector = this._tempVec3;
        const size = box.getSize(tempVector)
        const expectedSize = this.CONFIG.TILE_SIZE

        if (size.x > expectedSize * 1.1 || size.z > expectedSize * 1.1) {
          _invalidBoxes++
          oversizedTiles.push(key)
        } else {
          _validBoxes++
        }

        // Store bounding box for future reference
        this.terrainBoundingBoxes.set(key, box.clone())

        // Verify tile is within world bounds
        if (
          box.min.x < this.worldBounds.minX ||
          box.max.x > this.worldBounds.maxX ||
          box.min.z < this.worldBounds.minZ ||
          box.max.z > this.worldBounds.maxZ
        ) {
          // Tile exceeds world bounds - tracked but no logging
        }
      }
    }

    // Verification completed - results available via getChunkSimulationStatus()
  }

  /**
   * Get chunk simulation status for debugging
   */
  getChunkSimulationStatus(): {
    totalChunks: number
    simulatedChunks: number
    playerChunks: Map<string, Set<string>>
    chunkPlayerCounts: Map<string, number>
    lastSerializationTime: number
    nextSerializationIn: number
    worldStateVersion: number
  } {
    return {
      totalChunks: this.terrainTiles.size,
      simulatedChunks: this.simulatedChunks.size,
      playerChunks: new Map(this.playerChunks),
      chunkPlayerCounts: new Map(this.chunkPlayerCounts),
      lastSerializationTime: this.lastSerializationTime,
      nextSerializationIn: this.serializationInterval - (Date.now() - this.lastSerializationTime),
      worldStateVersion: this.worldStateVersion,
    }
  }

  /**
   * Check if a chunk is being simulated
   */
  isChunkSimulated(chunkX: number, chunkZ: number): boolean {
    const key = `${chunkX}_${chunkZ}`
    return this.simulatedChunks.has(key)
  }

  /**
   * Get players in a specific chunk
   */
  getPlayersInChunk(chunkX: number, chunkZ: number): string[] {
    const key = `${chunkX}_${chunkZ}`
    const playersInChunk: string[] = []

    for (const [playerId, chunks] of this.playerChunks) {
      if (chunks.has(key)) {
        playersInChunk.push(playerId)
      }
    }

    return playersInChunk
  }

  /**
   * Force immediate serialization (for testing/admin commands)
   */
  forceSerialization(): void {
    this.performImmediateSerialization()
  }

  public getTiles(): Map<string, TerrainTile> {
    return this.terrainTiles
  }

  /**
   * Checks if the physics mesh for a specific world coordinate is ready.
   * @param worldX The world X coordinate.
   * @param worldZ The world Z coordinate.
   * @returns True if the physics mesh for the containing tile exists.
   */
  public isPhysicsReadyAt(worldX: number, worldZ: number): boolean {
    const tileX = Math.floor(worldX / this.CONFIG.TILE_SIZE)
    const tileZ = Math.floor(worldZ / this.CONFIG.TILE_SIZE)
    const key = `${tileX}_${tileZ}`

    const tile = this.terrainTiles.get(key)
    return !!(tile && tile.collision as PMeshHandle | null)
  }

  /**
   * Check if terrain system is ready for players to spawn
   */
  public isReady(): boolean {
    return this._initialTilesReady && this.noise !== undefined
  }

  public getTileSize(): number {
    return this.CONFIG.TILE_SIZE
  }
}
