/**
 * Multi-level caching system for API performance optimization
 * Supports memory cache, KV store, and request deduplication
 */

import { kv } from '@vercel/kv'
import { deduplicateAsync, generateCacheKey } from './request-deduplication'

interface CacheOptions {
  ttl?: number
  useMemoryCache?: boolean
  useKvCache?: boolean
  skipCache?: boolean
}

interface CachedItem<T> {
  data: T
  timestamp: number
  ttl: number
}

class PerformanceCache {
  private memoryCache = new Map<string, CachedItem<any>>()
  private readonly defaultTtl = 5 * 60 * 1000 // 5 minutes
  private readonly maxMemoryItems = 1000
  
  /**
   * Get data from cache (memory first, then KV)
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      // Try memory cache first (fastest)
      const memoryItem = this.memoryCache.get(key)
      if (memoryItem && Date.now() - memoryItem.timestamp < memoryItem.ttl) {
        console.log(`🎯 Memory cache HIT: ${key}`)
        return memoryItem.data as T
      }
      
      // Try KV cache (slower but persistent)
      if (process.env.KV_URL) {
        const kvData = await kv.get<CachedItem<T>>(key)
        if (kvData && Date.now() - kvData.timestamp < kvData.ttl) {
          console.log(`🎯 KV cache HIT: ${key}`)
          // Store in memory cache for faster future access
          this.setMemoryCache(key, kvData.data, kvData.ttl - (Date.now() - kvData.timestamp))
          return kvData.data
        }
      }
      
      console.log(`❌ Cache MISS: ${key}`)
      return null
      
    } catch (error) {
      console.error(`Cache get error for ${key}:`, error)
      return null
    }
  }
  
  /**
   * Set data in cache (both memory and KV)
   */
  async set<T>(key: string, data: T, ttl: number = this.defaultTtl): Promise<void> {
    try {
      const item: CachedItem<T> = {
        data,
        timestamp: Date.now(),
        ttl
      }
      
      // Set in memory cache
      this.setMemoryCache(key, data, ttl)
      
      // Set in KV cache (async, don't wait)
      if (process.env.KV_URL) {
        kv.set(key, item, { ex: Math.floor(ttl / 1000) }).catch(error => {
          console.error(`KV cache set error for ${key}:`, error)
        })
      }
      
      console.log(`💾 Cached data: ${key} (TTL: ${ttl}ms)`)
      
    } catch (error) {
      console.error(`Cache set error for ${key}:`, error)
    }
  }
  
  /**
   * Set data in memory cache with size management
   */
  private setMemoryCache<T>(key: string, data: T, ttl: number): void {
    // Clean expired items if we're at capacity
    if (this.memoryCache.size >= this.maxMemoryItems) {
      this.cleanExpiredMemoryItems()
      
      // If still at capacity, remove oldest items
      if (this.memoryCache.size >= this.maxMemoryItems) {
        const keys = Array.from(this.memoryCache.keys())
        const oldestKeys = keys.slice(0, Math.floor(this.maxMemoryItems * 0.1))
        oldestKeys.forEach(k => this.memoryCache.delete(k))
        console.log(`🧹 Removed ${oldestKeys.length} old cache items`)
      }
    }
    
    this.memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }
  
  /**
   * Clean expired items from memory cache
   */
  private cleanExpiredMemoryItems(): void {
    const now = Date.now()
    let cleanedCount = 0
    
    for (const [key, item] of this.memoryCache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.memoryCache.delete(key)
        cleanedCount++
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned ${cleanedCount} expired memory cache items`)
    }
  }
  
  /**
   * Delete from cache
   */
  async delete(key: string): Promise<void> {
    try {
      this.memoryCache.delete(key)
      
      if (process.env.KV_URL) {
        await kv.del(key)
      }
      
      console.log(`🗑️ Deleted cache: ${key}`)
      
    } catch (error) {
      console.error(`Cache delete error for ${key}:`, error)
    }
  }
  
  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      this.memoryCache.clear()
      
      if (process.env.KV_URL) {
        // Note: KV doesn't have a clear all method, so we'd need to track keys
        console.log('KV cache clear not implemented (requires key tracking)')
      }
      
      console.log('🧹 Cleared all cache')
      
    } catch (error) {
      console.error('Cache clear error:', error)
    }
  }
  
  /**
   * Get cache stats
   */
  getStats(): {
    memoryItems: number
    memoryKeys: string[]
    oldestTimestamp?: number
    newestTimestamp?: number
  } {
    const items = Array.from(this.memoryCache.values())
    const timestamps = items.map(item => item.timestamp)
    
    return {
      memoryItems: this.memoryCache.size,
      memoryKeys: Array.from(this.memoryCache.keys()),
      oldestTimestamp: timestamps.length > 0 ? Math.min(...timestamps) : undefined,
      newestTimestamp: timestamps.length > 0 ? Math.max(...timestamps) : undefined
    }
  }
}

// Singleton instance
export const performanceCache = new PerformanceCache()

/**
 * Cached async operation with deduplication
 */
export async function cachedOperation<T>(
  key: string,
  operation: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const {
    ttl = 5 * 60 * 1000, // 5 minutes default
    useMemoryCache = true,
    useKvCache = true,
    skipCache = false
  } = options
  
  // Skip cache if requested
  if (skipCache) {
    console.log(`⏭️ Skipping cache for: ${key}`)
    return operation()
  }
  
  // Try to get from cache first
  const cached = await performanceCache.get<T>(key)
  if (cached !== null) {
    return cached
  }
  
  // Use deduplication to prevent concurrent identical requests
  return deduplicateAsync(key, async () => {
    const startTime = performance.now()
    console.log(`🔄 Cache miss, executing operation: ${key}`)
    
    try {
      const result = await operation()
      
      // Cache the result
      await performanceCache.set(key, result, ttl)
      
      const endTime = performance.now()
      console.log(`✅ Operation completed and cached: ${key} (${(endTime - startTime).toFixed(0)}ms)`)
      
      return result
      
    } catch (error) {
      console.error(`❌ Operation failed: ${key}`, error)
      throw error
    }
  }, ttl)
}

/**
 * Generate cache key for concorsi queries
 */
export function generateConcorsiCacheKey(
  prefix: string,
  filters: Record<string, any>
): string {
  // Sort and stringify filters for consistent keys
  const sortedFilters = Object.keys(filters)
    .sort()
    .reduce((acc, key) => {
      const value = filters[key]
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          acc[key] = value.length > 0 ? value.sort().join(',') : undefined
        } else {
          acc[key] = String(value)
        }
      }
      return acc
    }, {} as Record<string, any>)
  
  return generateCacheKey(prefix, sortedFilters)
}

/**
 * Cache TTL constants for different types of data
 */
export const CACHE_TTL = {
  CONCORSI_LIST: 2 * 60 * 1000,      // 2 minutes - frequently changing
  CONCORSO_DETAIL: 5 * 60 * 1000,    // 5 minutes - less frequent changes
  FILTER_OPTIONS: 10 * 60 * 1000,    // 10 minutes - rarely changes
  REGIONAL_DATA: 15 * 60 * 1000,     // 15 minutes - stable data
  STATIC_DATA: 60 * 60 * 1000,       // 1 hour - very stable data
} as const
