'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  const handleGoBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="text-6xl font-bold text-gray-200 mb-4">404</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Pagina non trovata
          </h1>
          <p className="text-gray-600 mb-8">
            La pagina che stai cercando non esiste o è stata spostata.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild className="flex items-center gap-2">
              <Link href="/">
                <Home className="w-4 h-4" />
                Torna alla Home
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="flex items-center gap-2">
              <Link href="/bandi">
                <Search className="w-4 h-4" />
                Cerca Bandi
              </Link>
            </Button>
          </div>

          <Button 
            variant="ghost" 
            onClick={handleGoBack}
            className="flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Torna indietro
          </Button>
        </div>

        <div className="mt-12 text-sm text-gray-500">
          <p>
            Se pensi che questo sia un errore, 
            <Link href="/contatti" className="text-brand hover:underline ml-1">
              contattaci
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 