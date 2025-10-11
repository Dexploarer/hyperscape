import { World } from './World'

import { ClientActions } from './systems/ClientActions'
import { ClientAudio } from './systems/ClientAudio'
import { ClientCameraSystem } from './systems/ClientCameraSystem'
import { ClientEnvironment } from './systems/ClientEnvironment'
import { ClientGraphics } from './systems/ClientGraphics'
import { ClientInput } from './systems/ClientInput'
import { ClientLiveKit } from './systems/ClientLiveKit'
import { ClientLoader } from './systems/ClientLoader'
import { ClientNetwork } from './systems/ClientNetwork'
import { ClientRuntime } from './systems/ClientRuntime'
import { ClientInterface } from './systems/ClientInterface'
import { Stage } from './systems/Stage'
// import { Nametags } from './systems/Nametags'
// import { Particles } from './systems/Particles'
// import { Wind } from './systems/Wind'
// import { XR } from './systems/XR'

import THREE from './extras/three'
import { HeightmapPathfinding } from './systems/HeightmapPathfinding'
// Test systems removed - consolidated into MovementValidationSystem

// Import unified terrain system
import { TerrainSystem } from './systems/TerrainSystem'
import { Physics } from './systems/Physics'

// Import RPG systems loader
import { registerSystems } from './systems/SystemLoader'
// ClientMovementFix removed - integrated into core movement systems
// No ClientDiagnostics system - basic console logging is sufficient
// No client input system - using InteractionSystem for click-to-move only
// Expose spawning utilities for browser tests
import { CircularSpawnArea } from './managers/spawning/CircularSpawnArea'

// Multiplayer movement systems
import { EntityInterpolationSystem } from './systems/EntityInterpolationSystem'

import type { StageSystem } from './types/system-interfaces'
import { LODs } from './systems/LODs'
import { Nametags } from './systems/Nametags'
import { Particles } from './systems/Particles'
import { Wind } from './systems/Wind'
import { XR } from './systems/XR'
import { TerrainValidationSystem } from './systems/TerrainValidationSystem'


// Window extension for browser testing
interface WindowWithWorld extends Window {
  world?: World
  THREE?: typeof THREE
}

export function createClientWorld() {
  const world = new World()
  
  // Expose constructors for browser tests immediately so tests can access without waiting
  if (typeof window !== 'undefined') {
    const anyWin = window as unknown as { Hyperscape?: Record<string, unknown>; world?: World };
    anyWin.Hyperscape = anyWin.Hyperscape || {};
    anyWin.Hyperscape.CircularSpawnArea = CircularSpawnArea;
    
    // Expose world for debugging
    anyWin.world = world;
  }
  
  // Register core client systems
  world.register('client-runtime', ClientRuntime);
  world.register('stage', Stage);
  world.register('livekit', ClientLiveKit);
  world.register('network', ClientNetwork);
  world.register('loader', ClientLoader);
  world.register('graphics', ClientGraphics);
  world.register('environment', ClientEnvironment);
  world.register('audio', ClientAudio);
  world.register('controls', ClientInput);
  world.register('actions', ClientActions);
  world.register('client-interface', ClientInterface);
  // Core physics (creates environment ground plane and layer masks)
  world.register('physics', Physics);
  
  // Register unified core systems
  world.register('client-camera-system', ClientCameraSystem);
  
  // Register simple ground for testing (comment out when using full terrain)
  // world.register('simple-ground', SimpleGroundSystem);
  world.register('terrain', TerrainSystem);
  
  // Register heightmap-based pathfinding (only activates with terrain)
  world.register('heightmap-pathfinding', HeightmapPathfinding);
  
  // NO interpolation system - server is authoritative for movement
  
  // Register comprehensive movement test system only when explicitly enabled
  const shouldEnableMovementTest =
    (typeof window !== 'undefined' && (window as unknown as { __ENABLE_MOVEMENT_TEST__?: boolean }).__ENABLE_MOVEMENT_TEST__ === true)
  
  if (shouldEnableMovementTest) {
    // Movement test consolidated into MovementValidationSystem (registered in SystemLoader)
  }
  
  // Commented out systems can be uncommented when implemented
  world.register('lods', LODs)
  world.register('nametags', Nametags)
  world.register('particles', Particles)
  world.register('wind', Wind)
  world.register('xr', XR)
  // Defer validation registration until after RPG systems are registered

  // Setup THREE.js access after world initialization
  const setupStageWithTHREE = () => {
    const stageSystem = world.stage as StageSystem;
    if (stageSystem && stageSystem.scene) {
      // Assign THREE to the stage system for compatibility
      stageSystem.THREE = THREE;
    }
  };
  
  // Setup THREE.js access after world initialization
  setTimeout(setupStageWithTHREE, 200);
  

  
  // Create a promise that resolves when RPG systems are loaded
  const systemsLoadedPromise = (async () => {
    try {
      console.log('[Client World] Registering RPG game systems...');
      await registerSystems(world);
      console.log('[Client World] RPG game systems registered successfully');
      
  // No client diagnostics - basic console logging is sufficient

  // NO interpolation system - server is authoritative for movement
  // Client just applies server positions directly
      
      console.log('[Client World] Client helper systems registered');
      // Expose selected constructors for browser-based tests (static import ensures availability)
      const anyWin = window as unknown as { Hyperscape?: Record<string, unknown> };
      anyWin.Hyperscape = anyWin.Hyperscape || {};
      anyWin.Hyperscape.CircularSpawnArea = CircularSpawnArea;
      
      // Update world object in browser window after systems are loaded
      if (typeof window !== 'undefined') {
        const windowWithWorld = window as WindowWithWorld;
        windowWithWorld.world = world;
        
        // Also expose Three.js if available from stage system
        const stageSystem = world.stage as StageSystem;
        if (stageSystem && stageSystem.THREE) {
          windowWithWorld.THREE = stageSystem.THREE;
        }
      }

      // DISABLED: TerrainValidationSystem runs validation too early before entities sync
      // It crashes the client when mobs haven't arrived from server yet
      // To re-enable, delay validation until after client receives snapshot
      // console.log('[Client World] Registering terrain validation system...');
      // world.register('terrain-validation', TerrainValidationSystem);
      // console.log('[Client World] Terrain validation system registered');
    } catch (error) {
      console.error('[Client World] Failed to register RPG game systems:', error);
      if (error instanceof Error) {
        console.error('[Client World] Error stack:', error.stack);
      }
      
      // Still expose world object even if systems fail
      if (typeof window !== 'undefined') {
        const windowWithWorld = window as WindowWithWorld;
        windowWithWorld.world = world;
      }
    }
  })();
  
  // Store the promise on the world instance so it can be awaited
  (world as World & { systemsLoadedPromise: Promise<void> }).systemsLoadedPromise = systemsLoadedPromise;

  
  return world;
}
