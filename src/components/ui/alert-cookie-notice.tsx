"use client";

import { useEffect } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { X, Cookie } from "lucide-react";
import Link from "next/link";
import { useCookieConsent } from "@/hooks/useCookieConsent";
import { loadGoogleAnalytics, updateConsentMode } from "@/lib/analytics";
import { NoSSR } from "@/components/NoSSR";

function CookieNoticeContent() {
  const { needsConsent, hasConsented, acceptCookies, declineCookies } = useCookieConsent();

  useEffect(() => {
    // Load analytics if user has already consented
    if (hasConsented) {
      loadAnalytics();
    }
  }, [hasConsented]);

  async function handleAccept() {
    acceptCookies();
    // Update consent mode immediately
    updateConsentMode(true);
    await loadAnalytics();
  }

  function handleDecline() {
    declineCookies();
    // Update consent mode to denied
    updateConsentMode(false);
  }

  async function loadAnalytics() {
    try {
      // Load Google Analytics with your measurement ID
      await loadGoogleAnalytics('G-NVD6N18QWW');
      
      console.log("Analytics consent granted - Google Analytics loaded with consent mode");
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  }

  // Don't render if consent has already been given or declined
  if (!needsConsent) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md md:bottom-6 md:left-6 md:right-auto md:max-w-lg">
      <Alert className="border-border pt-6 bg-background shadow-lg shadow-black/10">
        <Cookie className="h-5 w-5 text-[#0A1F44]" />
        <div className="flex items-start justify-between">
          <div className="flex-1 pr-2">
            <AlertTitle className="text-[#0A1F44] mb-2">
              Usiamo i cookie 🍪
            </AlertTitle>
            <AlertDescription className="text-gray-600 text-sm leading-relaxed mb-4">
              Utilizziamo i cookie per migliorare l'esperienza utente, analizzare il traffico e 
              mostrare contenuti personalizzati. Puoi gestire le tue preferenze o leggere la nostra{' '}
              <Link href="/privacy-policy" className="text-[#0A1F44] hover:underline font-medium">
                informativa sulla privacy
              </Link>{' '}
              e i nostri{' '}
              <Link href="/termini-di-servizio" className="text-[#0A1F44] hover:underline font-medium">
                termini di servizio
              </Link>.
            </AlertDescription>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button 
                size="sm" 
                onClick={handleAccept}
                className="bg-[#0A1F44] hover:bg-[#0A1F44]/90 text-white"
              >
                Accetta tutti
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleDecline}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Rifiuta
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={handleDecline}
                className="text-gray-500 hover:text-gray-700"
              >
                Solo necessari
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600 shrink-0"
            onClick={handleDecline}
            aria-label="Chiudi notifica"
          >
            <X size={14} strokeWidth={2} />
          </Button>
        </div>
      </Alert>
    </div>
  );
}

export function AlertCookieNotice() {
  return (
    <NoSSR fallback={null}>
      <CookieNoticeContent />
    </NoSSR>
  );
} 