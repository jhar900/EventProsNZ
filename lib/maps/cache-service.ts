/**
 * Map Cache Service
 * Handles map tile caching and offline functionality
 */

export interface CacheTile {
  key: string;
  data: ArrayBuffer;
  timestamp: number;
  expiresAt: number;
}

export interface CacheStats {
  totalTiles: number;
  totalSize: number;
  oldestTile: number;
  newestTile: number;
}

class MapCacheService {
  private readonly CACHE_PREFIX = 'mapbox_tile_';
  private readonly CACHE_VERSION = '1.0';
  private readonly MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB
  private readonly TILE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

  /**
   * Check if cache is supported
   */
  isCacheSupported(): boolean {
    return typeof window !== 'undefined' && 'caches' in window;
  }

  /**
   * Get cache key for a tile
   */
  private getTileKey(z: number, x: number, y: number): string {
    return `${this.CACHE_PREFIX}${this.CACHE_VERSION}_${z}_${x}_${y}`;
  }

  /**
   * Store a map tile in cache
   */
  async cacheTile(
    z: number,
    x: number,
    y: number,
    data: ArrayBuffer
  ): Promise<void> {
    if (!this.isCacheSupported()) {
      return;
    }

    try {
      const key = this.getTileKey(z, x, y);
      const cache = await caches.open('mapbox-tiles');

      const response = new Response(data, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'max-age=604800', // 7 days
          'X-Tile-Key': key,
          'X-Tile-Timestamp': Date.now().toString(),
          'X-Tile-Expires': (Date.now() + this.TILE_EXPIRY).toString(),
        },
      });

      await cache.put(key, response);
    } catch (error) {
      console.error('Error caching tile:', error);
    }
  }

  /**
   * Retrieve a map tile from cache
   */
  async getCachedTile(
    z: number,
    x: number,
    y: number
  ): Promise<ArrayBuffer | null> {
    if (!this.isCacheSupported()) {
      return null;
    }

    try {
      const key = this.getTileKey(z, x, y);
      const cache = await caches.open('mapbox-tiles');
      const response = await cache.match(key);

      if (!response) {
        return null;
      }

      // Check if tile has expired
      const expiresHeader = response.headers.get('X-Tile-Expires');
      if (expiresHeader && parseInt(expiresHeader) < Date.now()) {
        await cache.delete(key);
        return null;
      }

      return await response.arrayBuffer();
    } catch (error) {
      console.error('Error retrieving cached tile:', error);
      return null;
    }
  }

  /**
   * Check if a tile is cached and not expired
   */
  async isTileCached(z: number, x: number, y: number): Promise<boolean> {
    if (!this.isCacheSupported()) {
      return false;
    }

    try {
      const key = this.getTileKey(z, x, y);
      const cache = await caches.open('mapbox-tiles');
      const response = await cache.match(key);

      if (!response) {
        return false;
      }

      // Check if tile has expired
      const expiresHeader = response.headers.get('X-Tile-Expires');
      if (expiresHeader && parseInt(expiresHeader) < Date.now()) {
        await cache.delete(key);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking cached tile:', error);
      return false;
    }
  }

  /**
   * Clear all cached tiles
   */
  async clearCache(): Promise<void> {
    if (!this.isCacheSupported()) {
      return;
    }

    try {
      const cache = await caches.open('mapbox-tiles');
      const keys = await cache.keys();

      for (const key of keys) {
        if (key.url.includes(this.CACHE_PREFIX)) {
          await cache.delete(key);
        }
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<CacheStats> {
    if (!this.isCacheSupported()) {
      return {
        totalTiles: 0,
        totalSize: 0,
        oldestTile: 0,
        newestTile: 0,
      };
    }

    try {
      const cache = await caches.open('mapbox-tiles');
      const keys = await cache.keys();
      const tileKeys = keys.filter(key => key.url.includes(this.CACHE_PREFIX));

      let totalSize = 0;
      let oldestTile = Date.now();
      let newestTile = 0;

      for (const key of tileKeys) {
        const response = await cache.match(key);
        if (response) {
          const timestampHeader = response.headers.get('X-Tile-Timestamp');
          if (timestampHeader) {
            const timestamp = parseInt(timestampHeader);
            oldestTile = Math.min(oldestTile, timestamp);
            newestTile = Math.max(newestTile, timestamp);
          }

          const blob = await response.blob();
          totalSize += blob.size;
        }
      }

      return {
        totalTiles: tileKeys.length,
        totalSize,
        oldestTile: oldestTile === Date.now() ? 0 : oldestTile,
        newestTile,
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return {
        totalTiles: 0,
        totalSize: 0,
        oldestTile: 0,
        newestTile: 0,
      };
    }
  }

  /**
   * Clean up expired tiles
   */
  async cleanupExpiredTiles(): Promise<number> {
    if (!this.isCacheSupported()) {
      return 0;
    }

    let cleanedCount = 0;

    try {
      const cache = await caches.open('mapbox-tiles');
      const keys = await cache.keys();
      const tileKeys = keys.filter(key => key.url.includes(this.CACHE_PREFIX));

      for (const key of tileKeys) {
        const response = await cache.match(key);
        if (response) {
          const expiresHeader = response.headers.get('X-Tile-Expires');
          if (expiresHeader && parseInt(expiresHeader) < Date.now()) {
            await cache.delete(key);
            cleanedCount++;
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning up expired tiles:', error);
    }

    return cleanedCount;
  }

  /**
   * Manage cache size by removing oldest tiles
   */
  async manageCacheSize(): Promise<void> {
    if (!this.isCacheSupported()) {
      return;
    }

    try {
      const stats = await this.getCacheStats();

      if (stats.totalSize <= this.MAX_CACHE_SIZE) {
        return;
      }

      // Get all tiles with timestamps
      const cache = await caches.open('mapbox-tiles');
      const keys = await cache.keys();
      const tileKeys = keys.filter(key => key.url.includes(this.CACHE_PREFIX));

      const tilesWithTimestamps: Array<{ key: Request; timestamp: number }> =
        [];

      for (const key of tileKeys) {
        const response = await cache.match(key);
        if (response) {
          const timestampHeader = response.headers.get('X-Tile-Timestamp');
          if (timestampHeader) {
            tilesWithTimestamps.push({
              key,
              timestamp: parseInt(timestampHeader),
            });
          }
        }
      }

      // Sort by timestamp (oldest first)
      tilesWithTimestamps.sort((a, b) => a.timestamp - b.timestamp);

      // Remove oldest tiles until we're under the size limit
      let currentSize = stats.totalSize;
      for (const tile of tilesWithTimestamps) {
        if (currentSize <= this.MAX_CACHE_SIZE) {
          break;
        }

        const response = await cache.match(tile.key);
        if (response) {
          const blob = await response.blob();
          currentSize -= blob.size;
          await cache.delete(tile.key);
        }
      }
    } catch (error) {
      console.error('Error managing cache size:', error);
    }
  }

  /**
   * Check if device is offline
   */
  isOffline(): boolean {
    return typeof navigator !== 'undefined' && !navigator.onLine;
  }

  /**
   * Listen for online/offline status changes
   */
  onConnectionChange(callback: (isOnline: boolean) => void): () => void {
    if (typeof window === 'undefined') {
      return () => {};
    }

    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }
}

export const mapCacheService = new MapCacheService();
