'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global application error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full text-center">
            <div className="mb-8">
              <div className="flex justify-center mb-4">
                <AlertTriangle className="w-16 h-16 text-red-500" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Errore critico dell'applicazione
              </h1>
              <p className="text-gray-600 mb-8">
                Si è verificato un errore critico che ha impedito il caricamento dell'applicazione.
              </p>
            </div>

            <div className="space-y-4">
              <Button onClick={reset} className="w-full">
                Riprova
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/'}
                className="w-full flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Torna alla Home
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
                <h3 className="font-semibold text-red-800 mb-2">Dettagli errore (dev only):</h3>
                <pre className="text-xs text-red-700 overflow-auto">
                  {error.message}
                  {error.digest && `\nDigest: ${error.digest}`}
                  {error.stack && `\n\nStack:\n${error.stack}`}
                </pre>
              </div>
            )}
          </div>
        </div>
      </body>
    </html>
  );
} 