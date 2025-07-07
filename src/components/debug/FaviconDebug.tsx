import React, { useState, useEffect } from 'react';
import { FaviconImage } from '@/components/common/FaviconImage';
import { ensureFaviconExists } from '@/lib/services/faviconCache';
import { Button } from '@/components/ui/button';

export function FaviconDebug() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const testFaviconCaching = async () => {
    setIsProcessing(true);
    setLogs([]);
    
    const testCases = [
      { enteName: 'Comune di Milano', paLink: 'https://www.comune.milano.it/concorsi' },
      { enteName: 'Regione Lombardia', paLink: 'https://www.regione.lombardia.it' },
      { enteName: 'Università Bocconi', paLink: 'https://www.unibocconi.it' }
    ];

    for (const testCase of testCases) {
      addLog(`🎯 Testing: ${testCase.enteName}`);
      
      try {
        const startTime = Date.now();
        
        // First call - will fetch and cache
        addLog(`📥 Fetching favicon for ${testCase.enteName}...`);
        const result = await ensureFaviconExists(testCase.enteName, testCase.paLink);
        const duration = Date.now() - startTime;
        
        if (result.includes('firebasestorage')) {
          addLog(`✅ SUCCESS: Cached to Firebase Storage (${duration}ms)`);
          addLog(`🔗 URL: ${result.substring(0, 50)}...`);
        } else if (result === '/placeholder_icon.png') {
          addLog(`⚠️  FALLBACK: Using placeholder (${duration}ms)`);
        } else {
          addLog(`❓ UNKNOWN: ${result} (${duration}ms)`);
        }
        
        // Second call - should be instant from cache
        const startTime2 = Date.now();
        const result2 = await ensureFaviconExists(testCase.enteName, testCase.paLink);
        const duration2 = Date.now() - startTime2;
        
        if (result === result2) {
          addLog(`💾 CACHE HIT: Instant load (${duration2}ms) - ${Math.round(duration/duration2)}x faster!`);
        } else {
          addLog(`❌ CACHE MISS: Results don't match`);
        }
        
        addLog(`---`);
        
      } catch (error) {
        addLog(`❌ ERROR: ${error}`);
      }
    }
    
    setIsProcessing(false);
    addLog(`🎉 Testing complete! Check Firebase Console for cached favicons.`);
  };

  return (
    <div className="p-6 border border-gray-300 rounded-lg bg-gray-50 max-w-4xl">
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-2">🔍 Favicon Caching Debug Panel</h2>
        <p className="text-sm text-gray-600 mb-4">
          This panel shows the favicon caching process in real-time. Click "Test Caching" to see how favicons are downloaded, uploaded to Firebase Storage, and cached for future use.
        </p>
        
        <Button 
          onClick={testFaviconCaching} 
          disabled={isProcessing}
          className="mb-4"
        >
          {isProcessing ? 'Testing...' : 'Test Favicon Caching'}
        </Button>
      </div>

      {/* Live Preview */}
      <div className="mb-6">
        <h3 className="font-semibold mb-3">Live Preview (uses cached favicons):</h3>
        <div className="flex gap-4 items-center flex-wrap">
          <div className="flex items-center gap-2 p-2 bg-white rounded border">
            <FaviconImage 
              enteName="Comune di Milano"
              paLink="https://www.comune.milano.it/concorsi"
              size={20}
            />
            <span className="text-sm">Comune di Milano</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-white rounded border">
            <FaviconImage 
              enteName="Regione Lombardia"
              paLink="https://www.regione.lombardia.it"
              size={20}
            />
            <span className="text-sm">Regione Lombardia</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-white rounded border">
            <FaviconImage 
              enteName="Università Bocconi"
              paLink="https://www.unibocconi.it"
              size={20}
            />
            <span className="text-sm">Università Bocconi</span>
          </div>
        </div>
      </div>

      {/* Debug Logs */}
      <div>
        <h3 className="font-semibold mb-2">Debug Logs:</h3>
        <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-64 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-gray-500">Click "Test Caching" to see logs...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded text-sm">
        <strong>💡 How to verify the caching:</strong>
        <ol className="list-decimal list-inside mt-2 space-y-1">
          <li>Open Firebase Console → Storage → favicons/ folder</li>
          <li>Open Firebase Console → Firestore → favicons collection</li>
          <li>Open browser Network tab and refresh - you'll see Firebase URLs instead of external APIs</li>
        </ol>
      </div>
    </div>
  );
} 