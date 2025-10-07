"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Key } from "lucide-react"
import { useAuth } from "@/lib/hooks/useAuth"
import { toast } from "sonner"

interface GuestSummaryProps {
  jobTitle?: string;
}

export function GuestSummary({ jobTitle }: GuestSummaryProps) {
  const { signInWithGoogle } = useAuth();

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      toast.success("Accesso effettuato con successo!");
    } catch (error: any) {
      console.error('Google sign in error:', error);
      toast.error(error.message || "Errore durante l'accesso");
    }
  };

  return (
    <div className="rounded-lg md:p-6 relative overflow-hidden" style={{ 
      backgroundImage: 'linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)'
    }}>
      <h2 className="text-lg font-semibold mb-2">Feedback</h2>
      
      {/* Blurred content */}
      <div className="relative">
        <div 
          className="text-sm leading-relaxed mb-4 filter blur-md select-none pointer-events-none"
          style={{ filter: 'blur(3px)', padding: '1rem', borderRadius: '16px',  border: '2px solid #000000' }}
        >
          <p className="mb-2">
            Questo concorso per {jobTitle || 'la posizione ricercata'} offre un&apos;opportunità eccellente 
            per professionisti qualificati nel settore pubblico. Le responsabilità principali includono...
          </p>
          <p className="mb-2">
            I requisiti essenziali comprendono una laurea specifica, esperienza nel settore e 
            competenze tecniche avanzate. Il candidato ideale dovrebbe possedere...
          </p>
          <p>
            Il processo di selezione prevede diverse fasi inclusi test scritti, prove pratiche e 
            colloqui orali. La valutazione sarà basata su criteri specifici di merito...
          </p>
        </div>
        
        {/* Overlay with sign-in prompt */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/70 via-white/50 to-transparent flex items-center justify-center rounded-2xl border-radius-2xl">
          <Card className="p-6 max-w-sm mx-auto text-center shadow-lg border-2 rounded-2xl border-radius-2xl bg-white/95 backdrop-blur-sm ">
            <div className="flex justify-center mb-3">
              <div className="p-3 bg-blue-50 rounded-full">
                <Key className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <h3 className="font-semibold text-lg mb-2 text-gray-900">
              Feedback Riservato
            </h3>
            <p className="text-sm text-gray-600 mb-4">
            Accedi ora per vedere i dettagli e avvicinarti al concorso giusto per te.
            </p>
            <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full flex items-center gap-3"
            onClick={handleGoogleSignIn}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 256 262"
            >
              <path
                fill="#4285f4"
                d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
              />
              <path
                fill="#34a853"
                d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
              />
              <path
                fill="#fbbc05"
                d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z"
              />
              <path
                fill="#eb4335"
                d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
              />
            </svg>
            <span>Continue with Google</span>
          </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
