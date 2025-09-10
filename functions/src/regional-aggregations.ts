/**
 * Firebase Cloud Functions for pre-computing regional aggregations
 * This runs automatically when concorsi are added/updated
 */

import { onDocumentWritten, onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

// Initialize Firebase Admin
initializeApp()
const db = getFirestore()

interface RegionalStats {
  totalConcorsi: number
  openConcorsi: number
  topEnti: { [ente: string]: number }
  topSettori: { [settore: string]: number }
  lastUpdated: FirebaseFirestore.Timestamp
}

/**
 * Updates regional aggregations when a concorso is created/updated/deleted
 */
export const updateRegionalAggregations = onDocumentWritten('concorsi/{docId}', async (event) => {
  const beforeData = event.data?.before?.data()
  const afterData = event.data?.after?.data()
  
  console.log('🔄 Updating regional aggregations...')
  
  // Extract regions from both old and new data
  const oldRegions = beforeData?.regione || []
  const newRegions = afterData?.regione || []
  
  // Get all affected regions
  const allRegions = new Set([...oldRegions, ...newRegions])
  
  // Update aggregations for each affected region
  const updatePromises = Array.from(allRegions).map(async (region) => {
    if (typeof region === 'string') {
      await updateRegionStats(region)
    }
  })
  
  await Promise.all(updatePromises)
  console.log('✅ Regional aggregations updated')
})

/**
 * Updates statistics for a specific region
 */
async function updateRegionStats(regionName: string) {
  const regionRef = db.collection('regional_stats').doc(regionName.toLowerCase())
  
  try {
    // Query all concorsi for this region
    const concorsiSnapshot = await db.collection('concorsi')
      .where('regione', 'array-contains', regionName.toLowerCase())
      .get()
    
    const stats: RegionalStats = {
      totalConcorsi: 0,
      openConcorsi: 0,
      topEnti: {},
      topSettori: {},
      lastUpdated: new Date() as any
    }
    
    // Calculate aggregations
    concorsiSnapshot.docs.forEach(doc => {
      const data = doc.data()
      
      stats.totalConcorsi++
      
      // Count open concorsi
      if (data.stato_normalized === 'open' || data.Stato?.toLowerCase() === 'open') {
        stats.openConcorsi++
      }
      
      // Count by ente
      if (data.Ente) {
        stats.topEnti[data.Ente] = (stats.topEnti[data.Ente] || 0) + 1
      }
      
      // Count by settore
      if (data.settore_professionale) {
        stats.topSettori[data.settore_professionale] = (stats.topSettori[data.settore_professionale] || 0) + 1
      }
    })
    
    // Save aggregated stats
    await regionRef.set(stats)
    console.log(`📊 Updated stats for ${regionName}: ${stats.totalConcorsi} total, ${stats.openConcorsi} open`)
    
  } catch (error) {
    console.error(`❌ Error updating stats for ${regionName}:`, error)
  }
}

/**
 * Initialize all regional stats (run manually)
 */
export const initializeRegionalStats = async () => {
  console.log('🚀 Initializing all regional stats...')
  
  // Get all unique regions
  const concorsiSnapshot = await db.collection('concorsi').get()
  const allRegions = new Set<string>()
  
  concorsiSnapshot.docs.forEach(doc => {
    const regions = doc.data().regione || []
    regions.forEach((region: string) => allRegions.add(region))
  })
  
  // Update stats for each region
  const updatePromises = Array.from(allRegions).map(region => updateRegionStats(region))
  await Promise.all(updatePromises)
  
  console.log(`✅ Initialized stats for ${allRegions.size} regions`)
}
