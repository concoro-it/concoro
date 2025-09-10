/**
 * Test script to demonstrate location query deduplication
 * 
 * This script simulates the React Strict Mode scenario where
 * the same location query is triggered multiple times simultaneously.
 */

import { getLocationConcorsi } from '@/lib/services/location-queries'
import { getDeduplicationStats } from '@/lib/utils/request-deduplication'

/**
 * Test location query deduplication
 */
export async function testLocationDeduplication() {
  console.log('🧪 Testing location query deduplication...')
  
  const location = 'veneto'
  const options = {
    location,
    Stato: 'OPEN' as const,
    limit: 500
  }
  
  const startTime = Date.now()
  
  // Simulate React Strict Mode: trigger the same query multiple times
  console.log('📄 Starting multiple concurrent requests for the same location...')
  
  const promises = [
    getLocationConcorsi(options),
    getLocationConcorsi(options),
    getLocationConcorsi(options)
  ]
  
  // Check deduplication stats before waiting
  const statsBefore = getDeduplicationStats()
  console.log(`📊 Deduplication stats before completion:`, statsBefore)
  
  try {
    const results = await Promise.all(promises)
    const endTime = Date.now()
    
    console.log(`✅ All requests completed in ${endTime - startTime}ms`)
    
    // Verify all results are identical
    const firstResult = results[0]
    const allIdentical = results.every(result => 
      JSON.stringify(result) === JSON.stringify(firstResult)
    )
    
    console.log(`📊 Results are identical: ${allIdentical}`)
    console.log(`📊 Each result has ${firstResult.concorsi.length} concorsi`)
    console.log(`📊 Location: ${firstResult.location}`)
    
    // Check final deduplication stats
    const statsAfter = getDeduplicationStats()
    console.log(`📊 Deduplication stats after completion:`, statsAfter)
    
    return {
      success: true,
      duration: endTime - startTime,
      resultsIdentical: allIdentical,
      concorsiCount: firstResult.concorsi.length,
      statsBefore,
      statsAfter
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Test with different location parameters to ensure cache keys work correctly
 */
export async function testLocationDeduplicationWithDifferentParams() {
  console.log('🧪 Testing location query deduplication with different parameters...')
  
  const startTime = Date.now()
  
  // These should NOT be deduplicated (different parameters)
  const promises = [
    getLocationConcorsi({ location: 'veneto', Stato: 'OPEN', limit: 100 }),
    getLocationConcorsi({ location: 'veneto', Stato: 'OPEN', limit: 200 }),
    getLocationConcorsi({ location: 'lombardia', Stato: 'OPEN', limit: 100 })
  ]
  
  try {
    const results = await Promise.all(promises)
    const endTime = Date.now()
    
    console.log(`✅ All requests completed in ${endTime - startTime}ms`)
    
    // These should be different results
    console.log(`📊 Veneto (100): ${results[0].concorsi.length} concorsi`)
    console.log(`📊 Veneto (200): ${results[1].concorsi.length} concorsi`)
    console.log(`📊 Lombardia (100): ${results[2].concorsi.length} concorsi`)
    
    return {
      success: true,
      duration: endTime - startTime,
      results: results.map(r => ({ location: r.location, count: r.concorsi.length }))
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Example usage (uncomment to run):
// testLocationDeduplication().then(console.log)
// testLocationDeduplicationWithDifferentParams().then(console.log)
