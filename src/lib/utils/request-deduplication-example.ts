/**
 * Example Usage of Request Deduplication
 * 
 * This file demonstrates how to use the request deduplication utility
 * in various scenarios, particularly for Firestore queries in Next.js App Router.
 */

import { deduplicateAsync } from './request-deduplication'
import { getConcorsiByEnte } from '@/lib/services/deduplicated-concorsi-api'

/**
 * Example 1: Basic usage with a simple async function
 */
export async function exampleBasicUsage() {
  const fetchUserData = async (userId: string) => {
    console.log(`Fetching user data for: ${userId}`)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    return { id: userId, name: `User ${userId}` }
  }

  // Multiple concurrent calls for the same user
  const promises = [
    deduplicateAsync(`user:${123}`, () => fetchUserData('123')),
    deduplicateAsync(`user:${123}`, () => fetchUserData('123')),
    deduplicateAsync(`user:${123}`, () => fetchUserData('123')),
  ]

  const results = await Promise.all(promises)
  console.log('All results are the same:', results.every(r => r.id === '123'))
  // Only one actual API call was made, but all promises resolve with the same result
}

/**
 * Example 2: Firestore query deduplication (the main use case)
 */
export async function exampleFirestoreDeduplication() {
  const ente = 'Comune di Gaiarine'
  
  // These would normally trigger separate Firestore queries
  // But with deduplication, only one query is executed
  const promises = [
    getConcorsiByEnte(ente, { Stato: 'OPEN', limit: 50 }),
    getConcorsiByEnte(ente, { Stato: 'OPEN', limit: 50 }),
    getConcorsiByEnte(ente, { Stato: 'OPEN', limit: 50 }),
  ]

  const results = await Promise.all(promises)
  console.log(`Fetched ${results[0].concorsi.length} concorsi for ${ente}`)
  // All results are identical, but only one Firestore query was executed
}

/**
 * Example 3: React Server Component scenario
 * 
 * This simulates what happens when RSC hydration triggers multiple requests
 */
export async function exampleRSCScenario() {
  console.log('🔄 Simulating RSC hydration scenario...')
  
  const ente = 'Comune di Gaiarine'
  const startTime = Date.now()
  
  // Simulate SSR request
  console.log('📄 SSR Request starting...')
  const ssrPromise = getConcorsiByEnte(ente, { Stato: 'OPEN', limit: 50 })
  
  // Simulate RSC hydration request (happens shortly after SSR)
  setTimeout(async () => {
    console.log('⚛️ RSC Request starting...')
    const rscPromise = getConcorsiByEnte(ente, { Stato: 'OPEN', limit: 50 })
    
    const [ssrResult, rscResult] = await Promise.all([ssrPromise, rscPromise])
    const endTime = Date.now()
    
    console.log(`✅ Both requests completed in ${endTime - startTime}ms`)
    console.log(`📊 SSR got ${ssrResult.concorsi.length} concorsi`)
    console.log(`📊 RSC got ${rscResult.concorsi.length} concorsi`)
    console.log(`🔄 Results are identical: ${JSON.stringify(ssrResult) === JSON.stringify(rscResult)}`)
  }, 100) // Small delay to simulate RSC timing
  
  return ssrPromise
}

/**
 * Example 4: Error handling
 */
export async function exampleErrorHandling() {
  const failingQuery = async (id: string) => {
    console.log(`Attempting to fetch ${id}...`)
    await new Promise(resolve => setTimeout(resolve, 500))
    throw new Error(`Failed to fetch ${id}`)
  }

  try {
    // Multiple concurrent calls that will fail
    const promises = [
      deduplicateAsync('failing-query', () => failingQuery('test')),
      deduplicateAsync('failing-query', () => failingQuery('test')),
    ]

    await Promise.all(promises)
  } catch (error) {
    console.log('❌ All requests failed with the same error:', error.message)
    // Only one actual query was executed, but all promises rejected with the same error
  }
}

/**
 * Example 5: Different parameters should not be deduplicated
 */
export async function exampleDifferentParameters() {
  const ente1 = 'Comune di Gaiarine'
  const ente2 = 'Comune di Roma'
  
  // These should NOT be deduplicated because they're different enti
  const promises = [
    getConcorsiByEnte(ente1, { Stato: 'OPEN', limit: 50 }),
    getConcorsiByEnte(ente2, { Stato: 'OPEN', limit: 50 }),
  ]

  const results = await Promise.all(promises)
  console.log(`Fetched ${results[0].concorsi.length} concorsi for ${ente1}`)
  console.log(`Fetched ${results[1].concorsi.length} concorsi for ${ente2}`)
  // Two separate Firestore queries were executed
}

/**
 * Run all examples (for testing purposes)
 */
export async function runAllExamples() {
  console.log('🚀 Running all deduplication examples...\n')
  
  try {
    console.log('1. Basic Usage:')
    await exampleBasicUsage()
    console.log('✅ Basic usage completed\n')
    
    console.log('2. Firestore Deduplication:')
    await exampleFirestoreDeduplication()
    console.log('✅ Firestore deduplication completed\n')
    
    console.log('3. RSC Scenario:')
    await exampleRSCScenario()
    console.log('✅ RSC scenario completed\n')
    
    console.log('4. Error Handling:')
    await exampleErrorHandling()
    console.log('✅ Error handling completed\n')
    
    console.log('5. Different Parameters:')
    await exampleDifferentParameters()
    console.log('✅ Different parameters completed\n')
    
    console.log('🎉 All examples completed successfully!')
  } catch (error) {
    console.error('❌ Example failed:', error)
  }
}

// Uncomment to run examples in development
// runAllExamples().catch(console.error)
