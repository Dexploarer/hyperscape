/**
 * Database Client and Migration Manager
 * 
 * This module handles PostgreSQL database initialization using Drizzle ORM.
 * It provides a singleton pattern for database connections to prevent connection pool exhaustion.
 * 
 * **Key Features**:
 * - Singleton connection pool to prevent connection leaks
 * - Automatic migration runner that finds migrations in multiple possible locations
 * - Connection testing before returning database instance
 * - Graceful error handling for existing tables
 * 
 * **Architecture**:
 * - Uses node-postgres (pg) for connection pooling
 * - Wraps pg with Drizzle ORM for type-safe queries
 * - Runs migrations from /src/db/migrations/ on startup
 * - Searches multiple paths to support both development and production builds
 * 
 * **Migration System**:
 * The migration system searches for the `meta/_journal.json` file in these locations (in order):
 * 1. process.cwd()/src/db/migrations (development from server package)
 * 2. process.cwd()/packages/server/src/db/migrations (development from workspace root)
 * 3. __dirname/migrations (production build)
 * 4. __dirname/db/migrations (alternative build structure)
 * 5. __dirname/../src/db/migrations (alternative build structure)
 * 
 * **Connection Pooling**:
 * - Max 20 connections per pool
 * - 30 second idle timeout
 * - 5 second connection timeout
 * 
 * **Usage**:
 * ```typescript
 * const { db, pool } = await initializeDatabase(connectionString);
 * const users = await db.select().from(schema.users);
 * await pool.end(); // Cleanup on shutdown
 * ```
 * 
 * **Referenced by**: index.ts (server startup), DatabaseSystem.ts (database operations)
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import * as schema from './schema';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const { Pool } = pg;

// Get directory path for migrations
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Singleton instances - only one database connection per server process
 * This prevents connection pool exhaustion from multiple initialization attempts
 */
let dbInstance: ReturnType<typeof drizzle> | undefined;
let poolInstance: pg.Pool | undefined;

/**
 * Initialize the database and run migrations
 * 
 * This is the main entry point for database setup. It creates a connection pool,
 * initializes Drizzle ORM, and runs all pending migrations.
 * 
 * The function is idempotent - calling it multiple times returns the cached instance.
 * 
 * @param connectionString - PostgreSQL connection URL (postgresql://user:pass@host:port/database)
 * @returns Object with db (Drizzle instance) and pool (pg.Pool) for direct access
 * @throws Error if connection fails or migrations encounter unexpected errors
 */
export async function initializeDatabase(connectionString: string) {
  // Return cached instance if already initialized (singleton pattern)
  if (dbInstance) {
    console.log('[DB] Database already initialized');
    return { db: dbInstance, pool: poolInstance! };
  }

  console.log('[DB] Initializing PostgreSQL with Drizzle...');
  
  const pool = new Pool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  // Test connection
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    console.log('[DB] ✅ PostgreSQL connection established');
    client.release();
  } catch (error) {
    console.error('[DB] ❌ Failed to connect to PostgreSQL:', error);
    throw error;
  }

  // Create Drizzle instance
  const db = drizzle(pool, { schema });
  
  // Run migrations
  try {
    console.log('[DB] Running migrations...');
    
    // When bundled by esbuild, we need to find migrations relative to process.cwd()
    // Try multiple possible locations
    const possiblePaths = [
      // Development: from server package root
      path.join(process.cwd(), 'src/db/migrations'),
      // Development: from workspace root
      path.join(process.cwd(), 'packages/server/src/db/migrations'),
      path.join(__dirname, 'migrations'),
      path.join(__dirname, 'db/migrations'),
      path.join(__dirname, '../src/db/migrations'),
    ];
    
    let migrationsFolder: string | null = null;
    for (const testPath of possiblePaths) {
      const journalPath = path.join(testPath, 'meta/_journal.json');
      if (fs.existsSync(journalPath)) {
        migrationsFolder = testPath;
        break;
      }
    }
    
    if (!migrationsFolder) {
      throw new Error(
        `Could not find migrations folder. Searched:\n${possiblePaths.map(p => `  - ${p}`).join('\n')}\n` +
        `Current working directory: ${process.cwd()}\n` +
        `__dirname: ${__dirname}`
      );
    }
    
    console.log('[DB] Migrations folder:', migrationsFolder);
    await migrate(db, { migrationsFolder });
    console.log('[DB] ✅ Migrations completed');
  } catch (error) {
    // If tables already exist (42P07), that's fine - the database is already set up
    const hasCode = error && typeof error === 'object' && 'cause' in error && 
                    error.cause && typeof error.cause === 'object' && 'code' in error.cause;
    const hasMessage = error && typeof error === 'object' && 'message' in error;
    const isExistsError = (hasCode && error.cause.code === '42P07') || 
                          (hasMessage && typeof error.message === 'string' && error.message.includes('already exists'));
    
    if (isExistsError) {
      console.log('[DB] ✅ Database tables already exist, skipping migration');
    } else {
      console.error('[DB] ❌ Migration failed:', error);
      throw error;
    }
  }

  dbInstance = db;
  poolInstance = pool;
  
  return { db, pool };
}

/**
 * Get the cached Drizzle database instance
 * 
 * Use this to access the database from anywhere in the application after initialization.
 * Throws an error if called before initializeDatabase().
 * 
 * @returns The Drizzle database instance
 * @throws Error if database hasn't been initialized yet
 */
export function getDatabase() {
  if (!dbInstance) {
    throw new Error('[DB] Database not initialized. Call initializeDatabase() first.');
  }
  return dbInstance;
}

/**
 * Get the cached PostgreSQL connection pool
 * 
 * Use this for low-level database operations that need direct pool access.
 * Most operations should use the Drizzle instance from getDatabase() instead.
 * 
 * @returns The PostgreSQL connection pool
 * @throws Error if pool hasn't been initialized yet
 */
export function getPool() {
  if (!poolInstance) {
    throw new Error('[DB] Pool not initialized. Call initializeDatabase() first.');
  }
  return poolInstance;
}

/**
 * Close the database connection and clean up resources
 * 
 * This should be called during graceful server shutdown to:
 * - Close all active connections in the pool
 * - Release database resources
 * - Allow the process to exit cleanly
 * 
 * After calling this, you must call initializeDatabase() again before using the database.
 * Called by the server shutdown handler in index.ts.
 */
export async function closeDatabase() {
  if (poolInstance) {
    await poolInstance.end();
    console.log('[DB] Database connection closed');
    poolInstance = undefined;
    dbInstance = undefined;
  }
}

/** TypeScript type for the Drizzle database instance with schema */
export type Database = ReturnType<typeof drizzle<typeof schema>>;
