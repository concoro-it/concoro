/**
 * Unified caching service for Concoro
 * Consolidates multiple caching strategies into a single, consistent interface
 * Supports both memory cache and external cache (Vercel KV) with automatic fallbacks
 */

import { kv } from '@vercel/kv';

// Cache configuration
export const CACHE_TTL = {
  CONCORSO_DETAIL: 300,     // 5 minutes - individual concorso data
  CONCORSI_LIST: 120,       // 2 minutes - lists of concorsi
  FILTER_OPTIONS: 600,      // 10 minutes - filter dropdown options
  ENTE_DATA: 300,          // 5 minutes - ente-specific data
  REGIONAL_DATA: 180,       // 3 minutes - regional queries
  FAVICON: 86400,          // 24 hours - favicon cache
  USER_PREFERENCES: 1800,   // 30 minutes - user preference data
} as const;

// Memory cache with automatic cleanup
class MemoryCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start cleanup process every 5 minutes
    this.startCleanup();
  }

  private startCleanup() {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000); // 5 minutes
  }

  private cleanup() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl * 1000) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Memory cache cleanup: removed ${cleaned} expired entries`);
    }
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl * 1000) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  set(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
  }
}

// Singleton memory cache instance
const memoryCache = new MemoryCache();

/**
 * Unified cache service with automatic fallback
 */
export class UnifiedCache {
  /**
   * Get data from cache (tries external cache first, then memory cache)
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      // Try external cache (Vercel KV) first if available
      if (process.env.VERCEL_ENV && kv) {
        const data = await kv.get(key);
        if (data !== null) {
          console.log(`📦 Cache HIT (external): ${key}`);
          return data as T;
        }
      }

      // Fallback to memory cache
      const memData = memoryCache.get<T>(key);
      if (memData !== null) {
        console.log(`📦 Cache HIT (memory): ${key}`);
        return memData;
      }

      console.log(`📦 Cache MISS: ${key}`);
      return null;
    } catch (error) {
      console.error(`❌ Cache get error for key ${key}:`, error);
      
      // Try memory cache as last resort
      return memoryCache.get<T>(key);
    }
  }

  /**
   * Set data in cache (sets in both external and memory cache)
   */
  static async set(key: string, data: any, ttl: number): Promise<void> {
    try {
      // Set in external cache if available
      if (process.env.VERCEL_ENV && kv) {
        await kv.set(key, data, { ex: ttl });
        console.log(`📦 Cache SET (external): ${key} (TTL: ${ttl}s)`);
      }

      // Always set in memory cache as backup
      memoryCache.set(key, data, ttl);
      console.log(`📦 Cache SET (memory): ${key} (TTL: ${ttl}s)`);
    } catch (error) {
      console.error(`❌ Cache set error for key ${key}:`, error);
      
      // At least try to set in memory cache
      memoryCache.set(key, data, ttl);
    }
  }

  /**
   * Delete data from cache
   */
  static async delete(key: string): Promise<void> {
    try {
      // Delete from external cache
      if (process.env.VERCEL_ENV && kv) {
        await kv.del(key);
      }

      // Delete from memory cache
      memoryCache.delete(key);
      console.log(`📦 Cache DELETE: ${key}`);
    } catch (error) {
      console.error(`❌ Cache delete error for key ${key}:`, error);
    }
  }

  /**
   * Clear all cache (use with caution)
   */
  static async clear(): Promise<void> {
    try {
      // Note: We can't easily clear all KV data, so we only clear memory cache
      memoryCache.clear();
      console.log('📦 Memory cache cleared');
    } catch (error) {
      console.error('❌ Cache clear error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  static getStats() {
    return {
      memory: memoryCache.getStats(),
      external: process.env.VERCEL_ENV ? 'Available (Vercel KV)' : 'Not available'
    };
  }
}

/**
 * Cache key generator with consistent naming
 */
export class CacheKeys {
  static concorso(id: string): string {
    return `concorso:${id}`;
  }

  static concorsiList(params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${JSON.stringify(params[key])}`)
      .join('|');
    return `concorsi-list:${Buffer.from(sortedParams).toString('base64')}`;
  }

  static filterOptions(filterType: string, additionalParams?: Record<string, any>): string {
    const params = additionalParams ? JSON.stringify(additionalParams) : '';
    return `filter-options:${filterType}:${params}`;
  }

  static enteData(enteName: string): string {
    return `ente:${encodeURIComponent(enteName)}`;
  }

  static regionalData(region: string, params?: Record<string, any>): string {
    const paramStr = params ? JSON.stringify(params) : '';
    return `regional:${region}:${paramStr}`;
  }

  static favicon(enteName: string): string {
    return `favicon:${encodeURIComponent(enteName)}`;
  }

  static userPreferences(userId: string): string {
    return `user-prefs:${userId}`;
  }
}

/**
 * Cached operation wrapper with automatic key generation and error handling
 */
export async function cachedOperation<T>(
  key: string,
  operation: () => Promise<T>,
  options: {
    ttl?: number;
    skipCache?: boolean;
    fallbackOnError?: boolean;
  } = {}
): Promise<T> {
  const { 
    ttl = CACHE_TTL.CONCORSI_LIST, 
    skipCache = false, 
    fallbackOnError = true 
  } = options;

  // Skip cache if requested
  if (skipCache) {
    return await operation();
  }

  try {
    // Try to get from cache first
    const cached = await UnifiedCache.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Execute operation
    const result = await operation();
    
    // Cache the result
    await UnifiedCache.set(key, result, ttl);
    
    return result;
  } catch (error) {
    console.error(`❌ Cached operation error for key ${key}:`, error);
    
    if (fallbackOnError) {
      // Try to get stale data from cache as fallback
      try {
        const staleData = await UnifiedCache.get<T>(key);
        if (staleData !== null) {
          console.log(`📦 Using stale cache data for key ${key}`);
          return staleData;
        }
      } catch (cacheError) {
        console.error('❌ Failed to get stale cache data:', cacheError);
      }
    }
    
    throw error;
  }
}

// Export memory cache for direct access if needed (for testing)
export { memoryCache };

// Cleanup function for graceful shutdown
export function destroyCache() {
  memoryCache.destroy();
}

