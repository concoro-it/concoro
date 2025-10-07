/**
 * Simple in-memory cache for API responses
 * In production, this should be replaced with Redis or similar
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 1000; // Maximum number of entries

  set<T>(key: string, data: T, ttlSeconds: number = 300): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Generate cache key from parameters
  generateKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key] || ''}`)
      .join('|');
    
    return `${prefix}:${sortedParams}`;
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    let expired = 0;
    let active = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        expired++;
      } else {
        active++;
      }
    }

    return {
      total: this.cache.size,
      active,
      expired,
      maxSize: this.maxSize,
    };
  }
}

// Global cache instance
export const cache = new MemoryCache();

// Cache decorator for functions
export function cached<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyPrefix: string,
  ttlSeconds: number = 300
): T {
  return (async (...args: Parameters<T>) => {
    const cacheKey = cache.generateKey(keyPrefix, { args: JSON.stringify(args) });
    
    // Try to get from cache first
    const cached = cache.get<ReturnType<T>>(cacheKey);
    if (cached) {
      return cached;
    }

    // Execute function and cache result
    const result = await fn(...args);
    cache.set(cacheKey, result, ttlSeconds);
    
    return result;
  }) as T;
}

// Cache utilities for API responses
export const apiCache = {
  // Cache concorsi data
  setConcorsi: (params: Record<string, any>, data: any, ttl: number = 300) => {
    const key = cache.generateKey('concorsi', params);
    cache.set(key, data, ttl);
  },

  getConcorsi: (params: Record<string, any>) => {
    const key = cache.generateKey('concorsi', params);
    return cache.get(key);
  },

  // Cache concorso details
  setConcorso: (id: string, data: any, ttl: number = 600) => {
    const key = cache.generateKey('concorso', { id });
    cache.set(key, data, ttl);
  },

  getConcorso: (id: string) => {
    const key = cache.generateKey('concorso', { id });
    return cache.get(key);
  },

  // Cache filters
  setFilters: (data: any, ttl: number = 1800) => {
    cache.set('filters', data, ttl);
  },

  getFilters: () => {
    return cache.get('filters');
  },

  // Clear all cache
  clear: () => {
    cache.clear();
  },

  // Get cache stats
  getStats: () => {
    return cache.getStats();
  },
};
