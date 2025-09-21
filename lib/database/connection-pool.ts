/**
 * Database Connection Pool Manager
 * Implements connection pooling for optimal database performance
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Pool, PoolClient } from 'pg';

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  maxConnections: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
}

export class DatabaseConnectionPool {
  private pool: Pool;
  private supabaseClient: SupabaseClient;
  private isHealthy: boolean = true;
  private lastHealthCheck: number = 0;
  private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

  constructor(config: DatabaseConfig) {
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.username,
      password: config.password,
      max: config.maxConnections,
      idleTimeoutMillis: config.idleTimeoutMillis,
      connectionTimeoutMillis: config.connectionTimeoutMillis,
      // Connection pool optimization
      allowExitOnIdle: false,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    });

    // Initialize Supabase client for fallback
    this.supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Set up error handling
    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      this.isHealthy = false;
    });

    // Start health monitoring
    this.startHealthMonitoring();
  }

  /**
   * Get a connection from the pool with retry logic
   */
  async getConnection(): Promise<PoolClient> {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const client = await this.pool.connect();
        
        // Test the connection
        await client.query('SELECT 1');
        
        return client;
      } catch (error) {
        lastError = error as Error;
        console.warn(`Connection attempt ${attempt} failed:`, error);
        
        if (attempt < maxRetries) {
          // Exponential backoff
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }

    throw new Error(`Failed to get database connection after ${maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Execute a query with automatic connection management
   */
  async query<T = any>(text: string, params?: any[]): Promise<T[]> {
    const client = await this.getConnection();
    
    try {
      const result = await client.query(text, params);
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Execute a transaction with automatic rollback on error
   */
  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getConnection();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Health check for the connection pool
   */
  async healthCheck(): Promise<boolean> {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      
      this.isHealthy = true;
      this.lastHealthCheck = Date.now();
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      this.isHealthy = false;
      return false;
    }
  }

  /**
   * Get pool statistics
   */
  getPoolStats() {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
      isHealthy: this.isHealthy,
      lastHealthCheck: this.lastHealthCheck,
    };
  }

  /**
   * Graceful shutdown
   */
  async close(): Promise<void> {
    await this.pool.end();
  }

  private startHealthMonitoring(): void {
    setInterval(async () => {
      await this.healthCheck();
    }, this.HEALTH_CHECK_INTERVAL);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
let dbPool: DatabaseConnectionPool | null = null;

export function getDatabasePool(): DatabaseConnectionPool {
  if (!dbPool) {
    const config: DatabaseConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'eventpros',
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000'),
    };

    dbPool = new DatabaseConnectionPool(config);
  }

  return dbPool;
}

// Graceful shutdown handler
process.on('SIGINT', async () => {
  if (dbPool) {
    await dbPool.close();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  if (dbPool) {
    await dbPool.close();
  }
  process.exit(0);
});
