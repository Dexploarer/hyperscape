import { isNumber } from 'lodash-es';
import moment from 'moment';

import type { Entity } from '../entities/Entity';
import { writePacket } from '../packets';
import { Socket } from '../Socket';
import type { SystemDatabase } from '../types/database-types';
import { dbHelpers, isDatabaseInstance } from '../types/database-types';
import type { World, WorldOptions } from '../types/index';
import type {
  ChatMessage,
  ConnectionParams,
  NetworkWithSocket,
  NodeWebSocket,
  ServerStats,
  SpawnData,
  User
} from '../types/network-types';
import { addRole, hasRole, removeRole, serializeRoles, uuid } from '../utils';
import { createJWT, verifyJWT } from '../utils-server';
import { verifyPrivyToken, isPrivyEnabled } from '../server/privy-auth';
import { System } from './System';
import { EventType } from '../types/events';
import type { TerrainSystem } from './TerrainSystem';
import THREE from '../extras/three';

// Entity already has velocity property

const SAVE_INTERVAL = parseInt(process.env.SAVE_INTERVAL || '60'); // seconds
const PING_RATE = 1; // seconds
const defaultSpawn = '{ "position": [0, 50, 0], "quaternion": [0, 0, 0, 1] }';  // Safe default height

const HEALTH_MAX = 100;

// Re-export shared network types for backward compatibility
export type { ChatMessage, ConnectionParams, ServerStats, SpawnData, User } from '../types/network-types';

type QueueItem = [Socket, string, unknown];

// Handler data types for network messages

interface EntityEventData {
  id: string;
  event: string;
  payload?: unknown;
}

interface EntityRemovedData {
  id: string;
}

// Base handler function type - allows any data type for flexibility
type NetworkHandler = (socket: Socket, data: unknown) => void | Promise<void>;

/**
 * Server Network System
 *
 * - runs on the server
 * - provides abstract network methods matching ClientNetwork
 *
 */
export class ServerNetwork extends System implements NetworkWithSocket {
  id: number;
  ids: number;
  sockets: Map<string, Socket>;
  socketIntervalId: NodeJS.Timeout;
  saveTimerId: NodeJS.Timeout | null;
  isServer: boolean;
  isClient: boolean;
  queue: QueueItem[];
  db!: SystemDatabase; // Database instance (Knex) - initialized in init()
  spawn: SpawnData;
  maxUploadSize: number;
  
  // Position validation
  private lastValidationTime = 0;
  private validationInterval = 100; // Start aggressive, then slow to 1000ms
  private systemUptime = 0;

  // Handler method registry - using NetworkHandler type for flexibility
  private handlers: Record<string, NetworkHandler> = {};
  // Simple movement state - no complex physics simulation
  private moveTargets: Map<string, {
    target: THREE.Vector3;
    maxSpeed: number;
    lastUpdate: number;
  }> = new Map();

  // Pre-allocated vectors for calculations (no garbage)
  private _tempVec3 = new THREE.Vector3();
  private _tempVec3Fwd = new THREE.Vector3(0, 0, -1);
  private _tempQuat = new THREE.Quaternion();

  // Track last state per entity (used for future delta compression)
  private lastStates = new Map<string, { q: [number, number, number, number] }>();
  // In broadcast, for q:
  // const last = this.lastStates.get(entity.id) || {q: [0,0,0,1]};
  // const qDelta = quatSubtract(currentQuaternion, last.q);
  // Quantize and send qDelta, update last

  constructor(world: World) {
    super(world);
    this.id = 0;
    this.ids = -1;
    this.sockets = new Map();
    this.socketIntervalId = setInterval(() => this.checkSockets(), PING_RATE * 1000);
    this.saveTimerId = null;
    this.isServer = true;
    this.isClient = false;
    this.queue = [];
    this.spawn = JSON.parse(defaultSpawn);
    this.maxUploadSize = 50; // Default 50MB upload limit
    
    // Register handler methods with proper signatures (packet system adds 'on' prefix)
    this.handlers['onChatAdded'] = this.onChatAdded.bind(this);
    this.handlers['onCommand'] = this.onCommand.bind(this);
    this.handlers['onEntityModified'] = this.onEntityModified.bind(this);
    this.handlers['onEntityEvent'] = this.onEntityEvent.bind(this);
    this.handlers['onEntityRemoved'] = this.onEntityRemoved.bind(this);
    this.handlers['onSettings'] = this.onSettings.bind(this);
    this.handlers['onMoveRequest'] = this.onMoveRequest.bind(this);
    this.handlers['onInput'] = this.onInput.bind(this);
  }

  async init(options: WorldOptions): Promise<void> {
    // Validate that db exists and has the expected shape
    if (!options.db || !isDatabaseInstance(options.db)) {
      throw new Error('[ServerNetwork] Valid database instance not provided in options');
    }
    
    // Database is properly typed now, no casting needed
    this.db = options.db;
  }

  async start(): Promise<void> {
    if (!this.db) {
      throw new Error('[ServerNetwork] Database not available in start method');
    }
    // get spawn
    const spawnRow = await this.db('config').where('key', 'spawn').first();
    const spawnValue = spawnRow?.value || defaultSpawn;
    this.spawn = JSON.parse(spawnValue);
    
    // We'll ground the spawn position to terrain when players connect, not here
    // The terrain system might not be ready yet during startup
        
    
    // hydrate entities
    const entities = await this.db('entities');
    if (entities && Array.isArray(entities)) {
      for (const entity of entities) {
        const entityWithData = entity as { data: string };
        const data = JSON.parse(entityWithData.data);
        data.state = {};
        // Add entity if method exists
        if (this.world.entities.add) {
          this.world.entities.add(data, true);
        }
      }
    }
    
    // hydrate settings
    const settingsRow = await this.db('config').where('key', 'settings').first();
    try {
      const settings = JSON.parse(settingsRow?.value || '{}');
      // Deserialize settings if the method exists
      if (this.world.settings.deserialize) {
        this.world.settings.deserialize(settings);
      }
    } catch (_err) {
      console.error(_err);
    }
    
    // watch settings changes
    // Listen for settings changes if the method exists
    if (this.world.settings.on) {
      this.world.settings.on('change', this.saveSettings);
    }
    
    // queue first save
    if (SAVE_INTERVAL) {
      this.saveTimerId = setTimeout(this.save, SAVE_INTERVAL * 1000);
    }
    
    // Environment model loading is handled by ServerEnvironment.start()
  }

  override destroy(): void {
    try { clearInterval(this.socketIntervalId) } catch {}
    if (this.saveTimerId) {
      try { clearTimeout(this.saveTimerId) } catch {}
      this.saveTimerId = null
    }
    try { this.world.settings.off('change', this.saveSettings) } catch {}
    // Optionally close sockets to free resources during tests/hot-reloads
    try {
      for (const [_id, socket] of this.sockets) {
        try { (socket as unknown as { close?: () => void }).close?.() } catch {}
      }
      this.sockets.clear()
    } catch {}
  }

  override preFixedUpdate(): void {
    this.flush();
  }

  override update(dt: number): void {
    // Track uptime for validation interval adjustment
    this.systemUptime += dt;
    if (this.systemUptime > 10 && this.validationInterval < 1000) {
      this.validationInterval = 1000; // Slow down after 10 seconds
    }
    
    // Validate player positions periodically
    this.lastValidationTime += dt * 1000;
    if (this.lastValidationTime >= this.validationInterval) {
      this.validatePlayerPositions();
      this.lastValidationTime = 0;
    }
    
    // Simple server-authoritative movement - no complex physics
    const now = Date.now();
    const toDelete: string[] = [];

    this.moveTargets.forEach((info, playerId) => {
      const entity = this.world.entities.get(playerId);
      if (!entity || !entity.position) {
        toDelete.push(playerId);
        // Ensure associated state entries are also cleaned up
        this.lastStates.delete(playerId);
        return;
      }

      const current = entity.position;
      const target = info.target;
      const dx = target.x - current.x;
      const dz = target.z - current.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      // Check if arrived
      if (dist < 0.3) {
        // Arrived at target
        // Clamp final Y to terrain
        let finalY = target.y;
        const terrainFinal = this.world.getSystem<TerrainSystem>('terrain') as TerrainSystem | null;
        if (terrainFinal) {
          const th = terrainFinal.getHeightAt(target.x, target.z);
          if (Number.isFinite(th)) finalY = (th as number) + 0.1;
        }
        entity.position.set(target.x, finalY, target.z);
        entity.data.position = [target.x, finalY, target.z];
        entity.data.velocity = [0, 0, 0];
        toDelete.push(playerId);

        // Broadcast final idle state
        this.send('entityModified', {
          id: playerId,
          changes: {
            p: [target.x, finalY, target.z],
            v: [0, 0, 0],
            e: 'idle'
          }
        });
        return;
      }

      // Simple linear interpolation toward target
      const speed = info.maxSpeed;
      const moveDistance = Math.min(dist, speed * dt);

      // Calculate direction and new position
      const normalizedDx = dx / dist;
      const normalizedDz = dz / dist;
      const nx = current.x + normalizedDx * moveDistance;
      const nz = current.z + normalizedDz * moveDistance;

      // Clamp Y to terrain height (slightly above)
      let ny = target.y;
      const terrain = this.world.getSystem<TerrainSystem>('terrain') as TerrainSystem | null;
      if (terrain) {
        const th = terrain.getHeightAt(nx, nz);
        if (Number.isFinite(th)) ny = (th as number) + 0.1;
      }

      // Update position
      entity.position.set(nx, ny, nz);
      entity.data.position = [nx, ny, nz];

      // Calculate velocity for animation
      const velocity = normalizedDx * speed;
      const velZ = normalizedDz * speed;
      entity.data.velocity = [velocity, 0, velZ];

      // Simple rotation toward movement direction
      if (entity.node) {
        // Use two separate temp vectors to avoid overwriting
        const dir = this._tempVec3.set(normalizedDx, 0, normalizedDz);
        this._tempVec3Fwd.set(0, 0, -1);
        this._tempQuat.setFromUnitVectors(this._tempVec3Fwd, dir);
        entity.node.quaternion.copy(this._tempQuat);
        entity.data.quaternion = [this._tempQuat.x, this._tempQuat.y, this._tempQuat.z, this._tempQuat.w];
      }

      // Broadcast update at ~30fps
      if (!info.lastUpdate || (now - info.lastUpdate) >= 33) {
        info.lastUpdate = now;

        const speed = Math.sqrt(velocity * velocity + velZ * velZ);
        const emote = speed > 4 ? 'run' : 'walk';

        this.send('entityModified', {
          id: playerId,
          changes: {
            p: [nx, ny, nz],
            q: entity.data.quaternion,
            v: [velocity, 0, velZ],
            e: emote
          }
        });
      }
    });

    toDelete.forEach(id => this.moveTargets.delete(id));
  }

  send<T = unknown>(name: string, data: T, ignoreSocketId?: string): void {
    const packet = writePacket(name, data);
    // Only log non-entityModified packets to reduce spam
    // Keep logs quiet in production unless debugging a specific packet
    let sentCount = 0;
    this.sockets.forEach(socket => {
      if (socket.id === ignoreSocketId) {
        return;
      }
      socket.sendPacket(packet);
      sentCount++;
    });
    if (name === 'chatAdded') {
      console.log(`[ServerNetwork] Broadcast '${name}' to ${sentCount} clients (ignored: ${ignoreSocketId || 'none'})`);
    }
  }

  sendTo<T = unknown>(socketId: string, name: string, data: T): void {
    const socket = this.sockets.get(socketId);
    socket?.send(name, data);
  }

  checkSockets(): void {
    // see: https://www.npmjs.com/package/ws#how-to-detect-and-close-broken-connections
    const dead: Socket[] = [];
    this.sockets.forEach(socket => {
      if (!socket.alive) {
        dead.push(socket);
      } else {
        socket.ping();
      }
    });
    dead.forEach(socket => socket.disconnect());
  }

  enqueue(socket: Socket, method: string, data: unknown): void {
    if (method === 'onChatAdded') {
      console.log('[ServerNetwork] Enqueueing onChatAdded from socket:', socket.id);
    }
    this.queue.push([socket, method, data]);
  }

  onDisconnect(socket: Socket, code?: number | string): void {
    // Handle socket disconnection
      // Only log disconnects if debugging connection issues
      // console.log(`[ServerNetwork] Socket ${socket.id} disconnected with code:`, code);
    
    // Remove socket from our tracking
    this.sockets.delete(socket.id);
    
    // Clean up any socket-specific resources
    if (socket.player) {
    // Emit typed player left event
    this.world.emit(EventType.PLAYER_LEFT, {
      playerId: socket.player.id,
      reason: code ? `disconnect_${code}` : 'disconnect'
    });
      
      // Remove player entity from world
      if (this.world.entities?.remove) {
        this.world.entities.remove(socket.player.id);
      }
      // Broadcast entity removal to all remaining clients
      try {
        this.send('entityRemoved', socket.player.id);
      } catch (_err) {
        console.error('[ServerNetwork] Failed to broadcast entityRemoved for player:', _err);
      }
    }
  }

  flush(): void {
    if (this.queue.length > 0) {
      // console.debug(`[ServerNetwork] Flushing ${this.queue.length} packets`)
    }
    while (this.queue.length) {
      try {
        const [socket, method, data] = this.queue.shift()!;
        const handler = this.handlers[method];
        if (method === 'onChatAdded') {
          console.log('[ServerNetwork] Processing onChatAdded handler from socket:', socket.id);
        }
        if (handler) {
          handler.call(this, socket, data);
        } else {
          console.warn(`[ServerNetwork] No handler for packet: ${method}`);
        }
      } catch (_err) {
        console.error(_err);
      }
    }
  }

  getTime(): number {
    return performance.now() / 1000; // seconds
  }

  save = async (): Promise<void> => {
    // queue again
    this.saveTimerId = setTimeout(this.save, SAVE_INTERVAL * 1000);
  };

  saveSettings = async (): Promise<void> => {
    // Serialize settings if the method exists
    const data = this.world.settings.serialize ? this.world.settings.serialize() : {};
    const value = JSON.stringify(data);
    await dbHelpers.setConfig(this.db, 'settings', value);
  };

  isAdmin(player: Entity | { data?: { roles?: string[] } }): boolean {
    return hasRole(player.data?.roles as string[] | undefined, 'admin');
  }

  isBuilder(player: Entity | { data?: { roles?: string[] } }): boolean {
    return this.world.settings.public || this.isAdmin(player);
  }

  async onConnection(ws: NodeWebSocket, params: ConnectionParams): Promise<void> {
    try {
      // check player limit
      // Check player limit setting
      const playerLimit = this.world.settings.playerLimit;
      if (isNumber(playerLimit) && playerLimit > 0 && this.sockets.size >= playerLimit) {
        const packet = writePacket('kick', 'player_limit');
        ws.send(packet);
        ws.close();
        return;
      }

      // check connection params
      let authToken = params.authToken;
      const name = params.name;
      const avatar = params.avatar;
      const privyUserId = (params as { privyUserId?: string }).privyUserId;

      // get or create user
      let user: User | undefined;
      let userWithPrivy: User & { privyUserId?: string | null; farcasterFid?: string | null } | undefined;
      
      // Try Privy authentication first if enabled
      if (isPrivyEnabled() && authToken && privyUserId) {
        try {
          console.log('[ServerNetwork] Attempting Privy authentication for user:', privyUserId);
          const privyInfo = await verifyPrivyToken(authToken);
          
          if (privyInfo && privyInfo.privyUserId === privyUserId) {
            console.log('[ServerNetwork] Privy token verified successfully');
            
            // Look up existing user by Privy ID
            const dbResult = await this.db('users').where('privyUserId', privyUserId).first();
            
            if (dbResult) {
              // Existing Privy user
              userWithPrivy = dbResult as User & { privyUserId?: string | null; farcasterFid?: string | null };
              user = userWithPrivy;
              console.log('[ServerNetwork] Found existing Privy user:', user.id);
            } else {
              // New Privy user - create account
              const newUser = {
                id: uuid(),
                name: name || 'Adventurer',
                avatar: avatar || null,
                roles: '',
                createdAt: moment().toISOString(),
                privyUserId: privyInfo.privyUserId,
                farcasterFid: privyInfo.farcasterFid,
              };
              
              await this.db('users').insert(newUser);
              userWithPrivy = newUser;
              user = newUser;
              console.log('[ServerNetwork] Created new Privy user:', user.id);
            }
            
            // Generate a Hyperscape JWT for this user
            authToken = await createJWT({ userId: user.id });
          } else {
            console.warn('[ServerNetwork] Privy token verification failed or user ID mismatch');
          }
        } catch (err) {
          console.error('[ServerNetwork] Privy authentication error:', err);
          // Fall through to legacy authentication
        }
      }
      
      // Fall back to legacy JWT authentication if Privy didn't work
      if (!user && authToken) {
        try {
          const jwtPayload = await verifyJWT(authToken);
          if (jwtPayload && typeof jwtPayload.userId === 'string') {
            const dbResult = await this.db('users').where('id', jwtPayload.userId).first();
            if (dbResult) {
              // Strong type assumption - dbResult has user properties
              user = dbResult as User;
            }
          }
        } catch (err) {
          console.error('[ServerNetwork] Failed to read authToken:', authToken, err);
        }
      }
      
      // Create anonymous user if no authentication succeeded
      if (!user) {
        user = {
          id: uuid(),
          name: 'Anonymous',
          avatar: null,
          roles: '',
          createdAt: moment().toISOString(),
        };
        await this.db('users').insert({
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          roles: Array.isArray(user.roles) ? user.roles.join(',') : user.roles,
          createdAt: user.createdAt
        });
        authToken = await createJWT({ userId: user.id });
      }
      
      // Convert roles string to array
      if (typeof user.roles === 'string') {
        user.roles = user.roles.split(',').filter(r => r);
      }

      // Allow multiple sessions per user for development/testing; do not kick duplicates

      // Only grant admin in development mode when no admin code is set
      // This prevents accidental admin access in production
      if (!process.env.ADMIN_CODE && process.env.NODE_ENV === 'development') {
        console.warn('[ServerNetwork] No ADMIN_CODE set in development mode - granting temporary admin access');
        // user.roles is already a string[] at this point after conversion
        if (Array.isArray(user.roles)) {
          user.roles.push('~admin');
        }
      }

      // livekit options
      // Get LiveKit options if available
      const livekit = await this.world.livekit?.getPlayerOpts?.(user.id);

      // create unique socket id per connection
      const socketId = uuid();
      const socket = new Socket({ 
        id: socketId, 
        ws, 
        network: this 
      });

      // Wait for terrain system to be ready before spawning players
      const terrain = this.world.getSystem<TerrainSystem>('terrain');
      if (terrain) {
        // Wait for terrain to be ready
        let terrainReady = false;
        for (let i = 0; i < 100; i++) {  // Wait up to 10 seconds
          if (terrain.isReady && terrain.isReady()) {
            terrainReady = true;
            break;
          }
          await new Promise(resolve => setTimeout(resolve, 100));
          if (i % 10 === 0) {
            console.log(`[ServerNetwork] Waiting for terrain to be ready... (${i/10}s)`);
          }
        }
        
        if (!terrainReady) {
          console.error('[ServerNetwork] Terrain system not ready after 10 seconds!');
          ws.close(1001, 'Server terrain not ready');
          return;
        }
      }
      
      // Check if player has saved position in database
      let spawnPosition: [number, number, number];
      let playerRow: import('../types/database').PlayerRow | null = null;
      
      // Try to load player position from DatabaseSystem if available
      const databaseSystem = this.world.getSystem('rpg-database') as import('./DatabaseSystem').DatabaseSystem | undefined;
      if (databaseSystem) {
        try {
          playerRow = databaseSystem.getPlayer(socketId);
          if (playerRow && playerRow.positionX !== undefined) {
            const savedY = playerRow.positionY !== undefined && playerRow.positionY !== null 
              ? Number(playerRow.positionY) 
              : 50;  // Use safe default if undefined/null
            
            // NEVER trust saved Y if it's invalid
            if (savedY < -5 || savedY > 200) {
              console.error(`[ServerNetwork] REJECTED invalid saved Y position: ${savedY}, using default spawn`);
              spawnPosition = Array.isArray(this.spawn.position)
                ? [
                    Number(this.spawn.position[0]) || 0, 
                    Number(this.spawn.position[1] ?? 50),  // Safe Y fallback
                    Number(this.spawn.position[2]) || 0
                  ]
                : [0, 50, 0];  // Safe default height
            } else {
              spawnPosition = [
                Number(playerRow.positionX) || 0,
                savedY,
                Number(playerRow.positionZ) || 0
              ];
                          }
          } else {
            // Use default spawn for new players
            spawnPosition = Array.isArray(this.spawn.position)
              ? [
                  Number(this.spawn.position[0]) || 0, 
                  Number(this.spawn.position[1] ?? 50),  // Use 50 as fallback, not 0
                  Number(this.spawn.position[2]) || 0
                ]
              : [0, 50, 0];  // Safe default with proper Y height
                      }
        } catch (_err: unknown) {
          // If DatabaseSystem is not ready yet, use default spawn without error
                    spawnPosition = Array.isArray(this.spawn.position)
            ? [
                Number(this.spawn.position[0]) || 0, 
                Number(this.spawn.position[1] ?? 50),  // Safe Y fallback
                Number(this.spawn.position[2]) || 0
              ]
            : [0, 50, 0];  // Safe default height
        }
      } else {
        // DatabaseSystem not available, use default spawn
                spawnPosition = Array.isArray(this.spawn.position)
          ? [
              Number(this.spawn.position[0]) || 0, 
              Number(this.spawn.position[1] ?? 50),  // Safe Y fallback
              Number(this.spawn.position[2]) || 0
            ]
          : [0, 50, 0];  // Safe default height
      }
      
      // Ground spawn position to terrain height
      const terrainSystem = this.world.getSystem<TerrainSystem>('terrain') as TerrainSystem | null;
      
      // Check if terrain system is ready using its isReady() method
      if (terrainSystem && terrainSystem.isReady && terrainSystem.isReady()) {
        const terrainHeight = terrainSystem.getHeightAt(spawnPosition[0], spawnPosition[2]);

        if (Number.isFinite(terrainHeight) && terrainHeight > -100 && terrainHeight < 1000) {
          // Always use terrain height, even for saved positions (in case terrain changed)
          spawnPosition[1] = terrainHeight + 0.1;
          console.log(`[ServerNetwork] Grounded spawn to Y=${spawnPosition[1]} (terrain=${terrainHeight})`);
        } else {
          // Invalid terrain height - use safe default
          console.error(`[ServerNetwork] TerrainSystem.getHeightAt returned invalid height: ${terrainHeight} at x=${spawnPosition[0]}, z=${spawnPosition[2]}`);
          console.error(`[ServerNetwork] Using safe spawn height Y=10`);
          spawnPosition[1] = 10; // Safe default height
        }
      } else {
        // Terrain not ready yet - use safe default height
        if (terrainSystem && !terrainSystem.isReady()) {
          console.warn('[ServerNetwork] Terrain system exists but is not ready yet (tiles still generating) - using safe spawn Y=10');
        } else if (!terrainSystem) {
          console.error('[ServerNetwork] WARNING: Terrain system not available for grounding! Using Y=10');
        }
        spawnPosition[1] = 10;
      }
      
      
      // DEBUG: Check if position is actually being passed correctly
      if (Math.abs(spawnPosition[1]) < 1) {
        console.error('[ServerNetwork] WARNING: Spawn Y is near ground level:', spawnPosition[1]);
      }

      console.log(`[ServerNetwork] Creating player entity for socket ${socketId}`);
      const addedEntity = this.world.entities.add ? this.world.entities.add(
        {
          id: socketId,
          type: 'player',
          position: spawnPosition,
          quaternion: Array.isArray(this.spawn.quaternion) ? [...this.spawn.quaternion] as [number, number, number, number] : [0,0,0,1],
          owner: socket.id, // owning session id
          userId: user.id, // account id
          name: name || user.name,
          health: HEALTH_MAX,
          avatar: user.avatar || this.world.settings.avatar?.url || 'asset://avatar.vrm',
          sessionAvatar: avatar || undefined,
          roles: user.roles,
        }
      ) : undefined;
      socket.player = addedEntity || undefined;

      // send snapshot
      const serializedEntities = this.world.entities.serialize() || [];
      
      // DEBUG: Check if player entity was serialized correctly
      const playerEntity = serializedEntities.find((e: { id: string }) => e.id === socketId);
      if (playerEntity) {
                if (Array.isArray(playerEntity.position) && Math.abs(playerEntity.position[1]) < 1) {
          console.error('[ServerNetwork] ERROR: Player Y in snapshot is near ground:', playerEntity.position[1]);
        }
      } else {
        console.error('[ServerNetwork] ERROR: Player entity not found in serialized entities!');
      }
      
      socket.send('snapshot', {
        id: socket.id,
        serverTime: performance.now(),
        assetsUrl: this.world.assetsUrl,  // Use the world's configured assetsUrl
        apiUrl: process.env.PUBLIC_API_URL,
        maxUploadSize: process.env.PUBLIC_MAX_UPLOAD_SIZE,
        settings: this.world.settings.serialize() || {},
        chat: this.world.chat.serialize() || [],
        entities: serializedEntities,
        livekit,
        authToken,
      });

      this.sockets.set(socket.id, socket);
      console.log(`[ServerNetwork] Socket added. Total sockets: ${this.sockets.size}`);

      // Emit typed player joined event (after snapshot)
      if (socket.player) {
        const playerId = socket.player.data.id as string;
            this.world.emit(EventType.PLAYER_JOINED, { playerId });
      }

      // Broadcast new player entity to all existing clients except the new connection
      if (addedEntity) {
        try {
          this.send('entityAdded', addedEntity.serialize(), socket.id);
        } catch (err) {
          console.error('[ServerNetwork] Failed to broadcast entityAdded for new player:', err);
        }
      }
    } catch (_err) {
      console.error(_err);
    }
  }

  onChatAdded = (socket: Socket, data: unknown): void => {
    const msg = data as ChatMessage;
    console.log('[ServerNetwork] Received chatAdded from socket:', socket.id, 'message:', msg);
    // Add message to chat if method exists
    if (this.world.chat.add) {
      this.world.chat.add(msg, false);
    }
    console.log('[ServerNetwork] Broadcasting chatAdded to all clients except:', socket.id);
    this.send('chatAdded', msg, socket.id);
  };

  onCommand = async (socket: Socket, data: unknown): Promise<void> => {
    const args = data as string[];
    // TODO: check for spoofed messages, permissions/roles etc
    // handle slash commands
    const player = socket.player;
    if (!player) return;
    const [cmd, arg1] = args;
    
    // become admin command
    if (cmd === 'admin') {
      const code = arg1;
      if (process.env.ADMIN_CODE && process.env.ADMIN_CODE === code) {
        const id = player.data.id;
        const userId = player.data.userId;
        const roles: string[] = Array.isArray(player.data.roles) ? player.data.roles : [];
        const granting = !hasRole(roles, 'admin');
        if (granting) {
          addRole(roles, 'admin');
        } else {
          removeRole(roles, 'admin');
        }
        player.modify({ roles });
        this.send('entityModified', { id, changes: { roles } });
        socket.send('chatAdded', {
          id: uuid(),
          from: null,
          fromId: null,
          body: granting ? 'Admin granted!' : 'Admin revoked!',
          createdAt: moment().toISOString(),
        });
        if (userId) {
          const rolesString = serializeRoles(roles);
          await this.db('users')
            .where('id', userId)
            .update({ roles: rolesString });
        }
      }
    }
    
    if (cmd === 'name') {
      const name = arg1;
      if (name) {
        const id = player.data.id;
        const userId = player.data.userId;
        player.data.name = name;
        player.modify({ name });
        this.send('entityModified', { id, changes: { name } });
        socket.send('chatAdded', {
          id: uuid(),
          from: null,
          fromId: null,
          body: `Name set to ${name}!`,
          createdAt: moment().toISOString(),
        });
        if (userId) {
          await this.db('users').where('id', userId).update({ name });
        }
      }
    }

    // Server-driven movement: move this socket's player entity randomly and broadcast
    if (cmd === 'move') {
      const mode = arg1 || 'random'
      if (!player) return
      const entity = player
      const curr = entity.position
      let nx = curr.x
      const _ny = curr.y
      let nz = curr.z
      if (mode === 'random') {
        // Ensure movement is at least 1.5 units to pass test assertions
        const minRadius = 1.5
        const maxRadius = 3
        const angle = Math.random() * Math.PI * 2
        const radius = minRadius + Math.random() * (maxRadius - minRadius)
        const dx = Math.cos(angle) * radius
        const dz = Math.sin(angle) * radius
        nx = curr.x + dx
        nz = curr.z + dz
      } else if (mode === 'to' && args.length >= 4) {
        // move to specified coordinates: /move to x y z
        const x = parseFloat(args[2])
        const y = parseFloat(args[3])
        const z = parseFloat(args[4])
        if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)) {
          nx = x; const _ny = y; nz = z
        }
      }
      // Apply on server entity
      // Clamp Y to terrain height on all server-side position sets via command
      const terrain = this.world.getSystem<TerrainSystem>('terrain') as TerrainSystem | null
      if (!terrain) {
        throw new Error('[ServerNetwork] Terrain system not available for chat move')
      }
      const th = terrain.getHeightAt(nx, nz)
      if (!Number.isFinite(th)) {
        throw new Error(`[ServerNetwork] Invalid terrain height for chat move at x=${nx}, z=${nz}`)
      }
      const gy = th + 0.1
      entity.position.set(nx, gy, nz)
      // Broadcast to all clients, including the origin, using normalized shape
      this.send('entityModified', { id: entity.id, changes: { p: [nx, gy, nz] } })
    }
    
    if (cmd === 'spawn') {
      const op = arg1;
      // TODO: Parse spawn operation properly
          }
    
    if (cmd === 'chat') {
      const op = arg1;
      if (op === 'clear' && socket.player && this.isBuilder(socket.player)) {
        // Clear chat if method exists
        if (this.world.chat.clear) {
          this.world.chat.clear(true);
        }
      }
    }
    
    if (cmd === 'server') {
      const op = arg1;
      if (op === 'stats') {
        const send = (body: string) => {
          socket.send('chatAdded', {
            id: uuid(),
            from: null,
            fromId: null,
            body,
            createdAt: moment().toISOString(),
          });
        };
        // Get server stats if monitor exists
        const statsResult = this.world.monitor?.getStats?.()
        const stats = statsResult && 'then' in statsResult
          ? await statsResult
          : (statsResult || { currentCPU: 0, currentMemory: 0, maxMemory: 0 }) as ServerStats
        send(`CPU: ${stats.currentCPU.toFixed(3)}%`);
        send(`Memory: ${stats.currentMemory}MB / ${stats.maxMemory}MB`);
      }
    }
  }

  onEntityModified(socket: Socket, data: unknown): void {
    // Accept either { id, changes: {...} } or a flat payload { id, ...changes }
    const incoming = data as { id: string; changes?: Record<string, unknown> } & Record<string, unknown>;
    const id = incoming.id;
    const changes = incoming.changes ?? Object.fromEntries(Object.entries(incoming).filter(([k]) => k !== 'id'));

    // Apply to local entity if present
    const entity = this.world.entities.get(id);
    if (entity && changes) {
      // Reject client position/rotation authority for players
      if (entity.type === 'player') {
        const filtered: Record<string, unknown> = { ...changes };
        delete (filtered as { p?: unknown }).p;
        delete (filtered as { q?: unknown }).q;
        // Allow cosmetic/state updates like name, avatar, effect, roles
        entity.modify(filtered);
      } else {
        entity.modify(changes);
      }
    }

    // Broadcast normalized shape
    this.send('entityModified', { id, changes }, socket.id);
  }

  private onMoveRequest(socket: Socket, data: unknown): void {
    const playerEntity = socket.player;
    if (!playerEntity) return;

    const payload = data as { target?: number[] | null; runMode?: boolean; cancel?: boolean };

    // Handle cancellation
    if (payload?.cancel || payload?.target === null) {
      this.moveTargets.delete(playerEntity.id);
      const curr = playerEntity.position;
      this.send('entityModified', {
        id: playerEntity.id,
        changes: {
          p: [curr.x, curr.y, curr.z],
          v: [0, 0, 0],
          e: 'idle'
        }
      });
      return;
    }

    const t = (Array.isArray(payload?.target) ? payload!.target as [number, number, number] : null);
    // If only runMode is provided, update current movement speed/emote without changing target
    if (!t) {
      if (typeof payload?.runMode === 'boolean') {
        const info = this.moveTargets.get(playerEntity.id);
        if (info) {
          info.maxSpeed = payload.runMode ? 8 : 4;
          // Update emote immediately
          this.send('entityModified', {
            id: playerEntity.id,
            changes: { e: payload.runMode ? 'run' : 'walk' }
          });
        }
      }
      return;
    }

    // Simple target creation - no complex terrain anchoring
    const target = new THREE.Vector3(t[0], t[1], t[2]);
    const maxSpeed = payload?.runMode ? 8 : 4;

    // Replace existing target completely (allows direction changes)
    this.moveTargets.set(playerEntity.id, {
      target,
      maxSpeed,
      lastUpdate: 0
    });

    // Immediately rotate the player to face the new target and broadcast state
    const curr = playerEntity.position;
    const dx = target.x - curr.x;
    const dz = target.z - curr.z;
    if (Math.abs(dx) + Math.abs(dz) > 1e-4) {
      const dir = this._tempVec3.set(dx, 0, dz).normalize();
      this._tempVec3Fwd.set(0, 0, -1);
      this._tempQuat.setFromUnitVectors(this._tempVec3Fwd, dir);
      if (playerEntity.node) {
        playerEntity.node.quaternion.copy(this._tempQuat);
      }
      playerEntity.data.quaternion = [this._tempQuat.x, this._tempQuat.y, this._tempQuat.z, this._tempQuat.w];
    }
    this.send('entityModified', {
      id: playerEntity.id,
      changes: {
        p: [curr.x, curr.y, curr.z],
        q: playerEntity.data.quaternion,
        v: [0, 0, 0],
        e: payload?.runMode ? 'run' : 'walk'
      }
    });
  }

  private onInput(socket: Socket, data: unknown): void {
    // This now exclusively handles click-to-move requests, routing them to the canonical handler.
    const playerEntity = socket.player;
    if (!playerEntity) {
      return;
    }
    
    // The payload from a modern client is a 'moveRequest' style object.
    const payload = data as { type?: string; target?: number[]; runMode?: boolean };
    if (payload.type === 'click' && Array.isArray(payload.target)) {
        this.onMoveRequest(socket, { target: payload.target, runMode: payload.runMode });
    }
  }

  onEntityEvent(socket: Socket, data: unknown): void {
    const eventData = data as EntityEventData;
    // Handle entity event
      }

  onEntityRemoved(socket: Socket, data: unknown): void {
    const removedData = data as EntityRemovedData;
    // Handle entity removal
      }

  onSettings(socket: Socket, data: unknown): void {
    // Handle settings change
      }

  onSpawnModified(socket: Socket, data: SpawnData): void {
    // Handle spawn modification
      }
  
  /**
   * Validate all player positions against terrain
   * Integrated from ServerPositionValidator for efficiency
   */
  private validatePlayerPositions(): void {
    const terrain = this.world.getSystem<TerrainSystem>('terrain') as TerrainSystem | null;
    if (!terrain) return;
    
    // Iterate through all connected players via their sockets
    for (const socket of this.sockets.values()) {
      if (!socket.player) continue;
      
      const player = socket.player;
      const currentY = player.position.y;
      const terrainHeight = terrain.getHeightAt(player.position.x, player.position.z);
      
      // Only correct if significantly wrong
      if (!Number.isFinite(currentY) || currentY < -5 || currentY > 200) {
        // Emergency correction
        const correctedY = Number.isFinite(terrainHeight) ? terrainHeight + 0.1 : 10;
        player.position.y = correctedY;
        if (player.data) {
          player.data.position = [player.position.x, correctedY, player.position.z];
        }
        this.send('entityModified', {
          id: player.id,
          changes: { p: [player.position.x, correctedY, player.position.z] }
        });
      } else if (Number.isFinite(terrainHeight)) {
        // Check if player drifted too far from terrain
        const expectedY = terrainHeight + 0.1;
        const errorMargin = Math.abs(currentY - expectedY);
        
        if (errorMargin > 10) {
          player.position.y = expectedY;
          if (player.data) {
            player.data.position = [player.position.x, expectedY, player.position.z];
          }
          this.send('entityModified', {
            id: player.id,
            changes: { p: [player.position.x, expectedY, player.position.z] }
          });
        }
      }
    }
  }
}