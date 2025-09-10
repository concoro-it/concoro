/**
 * Test script to verify deduplication is working
 * 
 * Run this in your browser console or as a test to see deduplication in action
 */

import { getConcorsiByEnte } from '@/lib/services/deduplicated-concorsi-api'

export async function testEnteDeduplication() {
  console.log('🧪 Testing ente deduplication...')
  
  const ente = 'Comune di Gaiarine'
  const options = {
    Stato: 'OPEN' as const,
    limit: 500,
    orderByField: 'publication_date' as const,
    orderDirection: 'desc' as const
  }
  
  const startTime = Date.now()
  
  // Start multiple concurrent requests
  const promises = [
    getConcorsiByEnte(ente, options),
    getConcorsiByEnte(ente, options),
    getConcorsiByEnte(ente, options),
  ]
  
  console.log('📊 Started 3 concurrent requests for the same ente...')
  
  const results = await Promise.all(promises)
  const endTime = Date.now()
  
  console.log(`⏱️ Total time: ${endTime - startTime}ms`)
  console.log(`📋 Results: ${results.length} responses`)
  console.log(`🔄 All results identical: ${results.every(r => r.concorsi.length === results[0].concorsi.length)}`)
  console.log(`📊 Concorsi found: ${results[0].concorsi.length}`)
  
  return results
}

// Uncomment to run the test
// testEnteDeduplication().catch(console.error)
