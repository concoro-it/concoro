/**
 * Test suite for request deduplication utility
 * 
 * This demonstrates how the deduplication works and can be used for testing
 * in development environments.
 */

import { deduplicateAsync, clearDeduplicationCache, getDeduplicationStats } from '../request-deduplication'

// Mock async function that simulates a slow database query
const mockSlowQuery = async (id: string, delay: number = 1000): Promise<string> => {
  console.log(`🔍 Mock query started for ID: ${id}`)
  await new Promise(resolve => setTimeout(resolve, delay))
  console.log(`✅ Mock query completed for ID: ${id}`)
  return `result-${id}`
}

describe('Request Deduplication', () => {
  beforeEach(() => {
    clearDeduplicationCache()
  })

  it('should deduplicate concurrent requests for the same key', async () => {
    const startTime = Date.now()
    
    // Start multiple concurrent requests for the same key
    const promises = [
      deduplicateAsync('test-key-1', () => mockSlowQuery('test-key-1', 500)),
      deduplicateAsync('test-key-1', () => mockSlowQuery('test-key-1', 500)),
      deduplicateAsync('test-key-1', () => mockSlowQuery('test-key-1', 500)),
    ]
    
    const results = await Promise.all(promises)
    const endTime = Date.now()
    
    // All results should be the same
    expect(results).toEqual(['result-test-key-1', 'result-test-key-1', 'result-test-key-1'])
    
    // Should take approximately 500ms, not 1500ms (3 * 500ms)
    expect(endTime - startTime).toBeLessThan(1000)
    
    // Cache should be empty after completion
    const stats = getDeduplicationStats()
    expect(stats.inProgressRequests).toBe(0)
  })

  it('should not deduplicate requests for different keys', async () => {
    const startTime = Date.now()
    
    // Start requests for different keys
    const promises = [
      deduplicateAsync('key-1', () => mockSlowQuery('key-1', 300)),
      deduplicateAsync('key-2', () => mockSlowQuery('key-2', 300)),
      deduplicateAsync('key-3', () => mockSlowQuery('key-3', 300)),
    ]
    
    const results = await Promise.all(promises)
    const endTime = Date.now()
    
    // All results should be different
    expect(results).toEqual(['result-key-1', 'result-key-2', 'result-key-3'])
    
    // Should take approximately 300ms (all run in parallel)
    expect(endTime - startTime).toBeLessThan(500)
  })

  it('should handle errors correctly and clean up', async () => {
    const failingQuery = async (id: string): Promise<string> => {
      console.log(`❌ Mock failing query for ID: ${id}`)
      await new Promise(resolve => setTimeout(resolve, 100))
      throw new Error(`Failed to fetch ${id}`)
    }
    
    // Start multiple concurrent requests that will fail
    const promises = [
      deduplicateAsync('failing-key', () => failingQuery('failing-key')),
      deduplicateAsync('failing-key', () => failingQuery('failing-key')),
    ]
    
    // All should throw the same error
    await expect(Promise.all(promises)).rejects.toThrow('Failed to fetch failing-key')
    
    // Cache should be empty after error
    const stats = getDeduplicationStats()
    expect(stats.inProgressRequests).toBe(0)
  })

  it('should provide correct statistics', async () => {
    // Initially empty
    let stats = getDeduplicationStats()
    expect(stats.inProgressRequests).toBe(0)
    expect(stats.keys).toEqual([])
    
    // Start a request
    const promise = deduplicateAsync('stats-test', () => mockSlowQuery('stats-test', 1000))
    
    // Should show 1 in-progress request
    stats = getDeduplicationStats()
    expect(stats.inProgressRequests).toBe(1)
    expect(stats.keys).toEqual(['stats-test'])
    
    // Wait for completion
    await promise
    
    // Should be empty again
    stats = getDeduplicationStats()
    expect(stats.inProgressRequests).toBe(0)
    expect(stats.keys).toEqual([])
  })
})

/**
 * Example usage for manual testing in development
 */
export async function testDeduplicationManually() {
  console.log('🧪 Starting manual deduplication test...')
  
  clearDeduplicationCache()
  
  const startTime = Date.now()
  
  // Simulate the RSC scenario with multiple concurrent requests
  const enteRequests = [
    deduplicateAsync('ente:Comune di Gaiarine', () => mockSlowQuery('Comune di Gaiarine', 2000)),
    deduplicateAsync('ente:Comune di Gaiarine', () => mockSlowQuery('Comune di Gaiarine', 2000)),
    deduplicateAsync('ente:Comune di Gaiarine', () => mockSlowQuery('Comune di Gaiarine', 2000)),
  ]
  
  console.log('📊 Stats before completion:', getDeduplicationStats())
  
  const results = await Promise.all(enteRequests)
  const endTime = Date.now()
  
  console.log('📊 Stats after completion:', getDeduplicationStats())
  console.log(`⏱️ Total time: ${endTime - startTime}ms (should be ~2000ms, not 6000ms)`)
  console.log('📋 Results:', results)
  
  return results
}

// Uncomment to run manual test
// testDeduplicationManually().catch(console.error)
