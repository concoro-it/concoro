import { initializeFirebaseAdmin } from '@/lib/firebase-admin';
import { ensureFaviconExists } from '@/lib/services/faviconCache';

// Test the favicon caching system
async function testFaviconCache() {
  console.log('🧪 Testing Favicon Cache System...\n');
  
  // Test cases
  const testCases = [
    {
      enteName: 'Comune di Milano',
      paLink: 'https://www.comune.milano.it/concorsi'
    },
    {
      enteName: 'Regione Lombardia',
      paLink: 'https://www.regione.lombardia.it/bandi'
    },
    {
      enteName: 'Università Bocconi',
      paLink: 'https://www.unibocconi.it/careers'
    },
    {
      enteName: 'Test Invalid Domain',
      paLink: 'https://invalid-domain-that-does-not-exist-123456.com'
    }
  ];
  
  try {
    // Initialize Firebase Admin (for server-side testing)
    console.log('📚 Initializing Firebase...');
    await initializeFirebaseAdmin();
    console.log('✅ Firebase initialized\n');
    
    for (const testCase of testCases) {
      console.log(`🎯 Testing: ${testCase.enteName}`);
      console.log(`   URL: ${testCase.paLink}`);
      
      const startTime = Date.now();
      
      // First call - should fetch and cache
      console.log('   📥 First call (fetch & cache)...');
      const firstResult = await ensureFaviconExists(testCase.enteName, testCase.paLink);
      const firstCallTime = Date.now() - startTime;
      
      console.log(`   ✅ Result: ${firstResult}`);
      console.log(`   ⏱️  Time: ${firstCallTime}ms\n`);
      
      // Second call - should use cache
      const secondStartTime = Date.now();
      console.log('   💾 Second call (from cache)...');
      const secondResult = await ensureFaviconExists(testCase.enteName, testCase.paLink);
      const secondCallTime = Date.now() - secondStartTime;
      
      console.log(`   ✅ Result: ${secondResult}`);
      console.log(`   ⏱️  Time: ${secondCallTime}ms`);
      console.log(`   🚀 Speed improvement: ${Math.round((firstCallTime / secondCallTime) * 100) / 100}x faster\n`);
      
      // Verify results are consistent
      if (firstResult === secondResult) {
        console.log('   ✅ Cache consistency verified\n');
      } else {
        console.log('   ❌ Cache inconsistency detected!\n');
      }
    }
    
    console.log('🎉 Favicon cache system test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Export for use in other scripts or testing
export { testFaviconCache };

// Run if called directly
if (require.main === module) {
  testFaviconCache().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
} 