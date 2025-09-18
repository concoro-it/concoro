/**
 * Request deduplication utility to prevent duplicate API calls
 * and expensive Firestore queries during concurrent requests
 */

interface PendingRequest<T> {
  promise: Promise<T>
  timestamp: number
  cleanup?: NodeJS.Timeout
}

class RequestDeduplicator {
  private pendingRequests = new Map<string, PendingRequest<any>>()
  private readonly defaultTtl = 30 * 1000 // 30 seconds
  
  /**
   * Deduplicate async operations by key
   * If a request with the same key is already pending, return the existing promise
   */
  async deduplicate<T>(
    key: string, 
    operation: () => Promise<T>,
    ttl: number = this.defaultTtl
  ): Promise<T> {
    const existing = this.pendingRequests.get(key)
    
    // If we have a pending request that's not expired, return it
    if (existing && Date.now() - existing.timestamp < ttl) {
      console.log(`🔄 Deduplicating request: ${key}`)
      return existing.promise
    }
    
    // Clear any existing cleanup timer
    if (existing?.cleanup) {
      clearTimeout(existing.cleanup)
    }
    
    console.log(`🆕 Creating new request: ${key}`)
    
    // Create new request
    const promise = operation()
    const timestamp = Date.now()
    
    // Set up cleanup timer
    const cleanup = setTimeout(() => {
      this.pendingRequests.delete(key)
      console.log(`🧹 Cleaned up request: ${key}`)
    }, ttl)
    
    // Store the pending request
    this.pendingRequests.set(key, { promise, timestamp, cleanup })
    
    // Clean up on completion (success or failure)
    promise.finally(() => {
      const current = this.pendingRequests.get(key)
      if (current && current.timestamp === timestamp) {
        if (current.cleanup) {
          clearTimeout(current.cleanup)
        }
        this.pendingRequests.delete(key)
        console.log(`✅ Request completed and cleaned up: ${key}`)
      }
    })
    
    return promise
  }
  
  /**
   * Clear all pending requests (useful for testing or cleanup)
   */
  clear(): void {
    for (const [key, request] of this.pendingRequests) {
      if (request.cleanup) {
        clearTimeout(request.cleanup)
      }
    }
    this.pendingRequests.clear()
    console.log('🧹 Cleared all pending requests')
  }
  
  /**
   * Get stats about pending requests
   */
  getStats(): { totalPending: number; keys: string[] } {
    return {
      totalPending: this.pendingRequests.size,
      keys: Array.from(this.pendingRequests.keys())
    }
  }
}

// Singleton instance
export const requestDeduplicator = new RequestDeduplicator()

/**
 * Convenience function for deduplicating async operations
 */
export function deduplicateAsync<T>(
  key: string,
  operation: () => Promise<T>,
  ttl?: number
): Promise<T> {
  return requestDeduplicator.deduplicate(key, operation, ttl)
}

/**
 * Generate cache key from parameters
 */
export function generateCacheKey(prefix: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${JSON.stringify(params[key])}`)
    .join('|')
  
  return `${prefix}:${sortedParams}`
}