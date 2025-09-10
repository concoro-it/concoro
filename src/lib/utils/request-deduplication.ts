/**
 * Request Deduplication Utility
 * 
 * Prevents duplicate async requests by maintaining a Map of in-progress promises.
 * When multiple callers request the same resource simultaneously, they all wait
 * for the same Promise instead of triggering separate requests.
 * 
 * This is particularly useful for:
 * - React Server Components (RSC) hydration
 * - Expensive database queries
 * - API calls that might be triggered multiple times
 */

/**
 * Generic request deduplication function
 * 
 * @param key - Unique identifier for the request (e.g., "ente:Comune di Gaiarine")
 * @param asyncFn - The async function to execute
 * @returns Promise that resolves to the result of asyncFn
 * 
 * @example
 * ```typescript
 * const result = await deduplicateAsync(
 *   `user:${userId}`,
 *   () => fetchUserFromDatabase(userId)
 * )
 * ```
 */
export function deduplicateAsync<T>(
  key: string,
  asyncFn: () => Promise<T>
): Promise<T> {
  // Global Map to track in-progress requests
  // Using a WeakMap would be ideal but we need string keys
  if (!globalThis.__requestDeduplicationMap) {
    globalThis.__requestDeduplicationMap = new Map<string, Promise<any>>()
  }
  
  const requestMap = globalThis.__requestDeduplicationMap as Map<string, Promise<T>>
  
  // Check if there's already a request in progress for this key
  const existingRequest = requestMap.get(key)
  if (existingRequest) {
    console.log(`🔄 Request deduplication: Reusing existing request for key: ${key}`)
    console.log(`⏳ Request deduplication: Waiting for existing request to complete...`)
    return existingRequest
  }
  
  // Create new request and store it in the map
  console.log(`🆕 Request deduplication: Starting new request for key: ${key}`)
  const requestPromise = asyncFn()
    .then((result) => {
      // Success: remove from map and return result
      requestMap.delete(key)
      console.log(`✅ Request deduplication: Completed request for key: ${key}`)
      return result
    })
    .catch((error) => {
      // Error: remove from map and re-throw
      requestMap.delete(key)
      console.log(`❌ Request deduplication: Failed request for key: ${key}`)
      throw error
    })
  
  // Store the promise in the map
  requestMap.set(key, requestPromise)
  
  return requestPromise
}

/**
 * Request deduplication with automatic cleanup
 * 
 * This version automatically cleans up completed requests after a delay
 * to prevent memory leaks in long-running applications.
 * 
 * @param key - Unique identifier for the request
 * @param asyncFn - The async function to execute
 * @param cleanupDelay - How long to keep completed requests in memory (default: 5 minutes)
 * @returns Promise that resolves to the result of asyncFn
 */
export function deduplicateAsyncWithCleanup<T>(
  key: string,
  asyncFn: () => Promise<T>,
  cleanupDelay: number = 5 * 60 * 1000 // 5 minutes
): Promise<T> {
  if (!globalThis.__requestDeduplicationMap) {
    globalThis.__requestDeduplicationMap = new Map<string, Promise<any>>()
  }
  
  const requestMap = globalThis.__requestDeduplicationMap as Map<string, Promise<T>>
  
  // Check if there's already a request in progress for this key
  const existingRequest = requestMap.get(key)
  if (existingRequest) {
    console.log(`🔄 Request deduplication: Reusing existing request for key: ${key}`)
    return existingRequest
  }
  
  // Create new request and store it in the map
  console.log(`🆕 Request deduplication: Starting new request for key: ${key}`)
  const requestPromise = asyncFn()
    .then((result) => {
      // Success: schedule cleanup and return result
      setTimeout(() => {
        requestMap.delete(key)
        console.log(`🧹 Request deduplication: Cleaned up completed request for key: ${key}`)
      }, cleanupDelay)
      
      console.log(`✅ Request deduplication: Completed request for key: ${key}`)
      return result
    })
    .catch((error) => {
      // Error: remove immediately and re-throw
      requestMap.delete(key)
      console.log(`❌ Request deduplication: Failed request for key: ${key}`)
      throw error
    })
  
  // Store the promise in the map
  requestMap.set(key, requestPromise)
  
  return requestPromise
}

/**
 * Clear all in-progress requests (useful for testing or cleanup)
 */
export function clearDeduplicationCache(): void {
  if (globalThis.__requestDeduplicationMap) {
    const requestMap = globalThis.__requestDeduplicationMap as Map<string, Promise<any>>
    const size = requestMap.size
    requestMap.clear()
    console.log(`🧹 Request deduplication: Cleared ${size} in-progress requests`)
  }
}

/**
 * Get statistics about current deduplication state
 */
export function getDeduplicationStats(): { inProgressRequests: number; keys: string[] } {
  if (!globalThis.__requestDeduplicationMap) {
    return { inProgressRequests: 0, keys: [] }
  }
  
  const requestMap = globalThis.__requestDeduplicationMap as Map<string, Promise<any>>
  return {
    inProgressRequests: requestMap.size,
    keys: Array.from(requestMap.keys())
  }
}

// Type augmentation for globalThis
declare global {
  var __requestDeduplicationMap: Map<string, Promise<any>> | undefined
}
