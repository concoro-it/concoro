'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="w-16 h-16 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Qualcosa è andato storto
          </h1>
          <p className="text-gray-600 mb-8">
            Si è verificato un errore imprevisto. Puoi provare a ricaricare la pagina o tornare alla home.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={reset}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Riprova
            </Button>
            
            <Button variant="outline" asChild className="flex items-center gap-2">
              <Link href="/">
                <Home className="w-4 h-4" />
                Torna alla Home
              </Link>
            </Button>
          </div>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
            <h3 className="font-semibold text-red-800 mb-2">Dettagli errore (dev only):</h3>
            <pre className="text-xs text-red-700 overflow-auto">
              {error.message}
              {error.digest && `\nDigest: ${error.digest}`}
            </pre>
          </div>
        )}

        <div className="mt-12 text-sm text-gray-500">
          <p>
            Se il problema persiste, 
            <Link href="/contatti" className="text-brand hover:underline ml-1">
              contattaci
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 