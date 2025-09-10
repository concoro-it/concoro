"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Sparkles, Check } from "lucide-react"
import { useAuthAdapter } from "@/lib/hooks/useAuthAdapter"
import { toast } from "sonner"

interface GuestGenioProps {
  className?: string;
}

export function GuestGenio({ className }: GuestGenioProps) {
  const { signInWithGoogle } = useAuthAdapter();

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
    <div className={`sticky top-20 rounded-lg border bg-white overflow-hidden h-[calc(100vh-6rem)] ${className}`} style={{
      background: 'linear-gradient(to right, rgba(255, 255, 255, 0.8), #c2e9fb)',
    }}>
      <div className="p-4 border-b">
        <h3 className="font-medium flex items-center gap-1">
          <Sparkles className="h-4 w-4 m-1 text-grey-800" />
          Genio AI
        </h3>
        <p className="text-sm text-muted-foreground">
          L&apos;intelligenza artificiale che rivoluziona la tua ricerca di concorsi
        </p>
      </div>
      
      <div className="p-6 flex flex-col h-[calc(100%-5rem)] justify-between items-center text-left">
      <p className="text-xs text-gray-400 mt-4">
         </p>
        <div className="mb-6 ">
          <div className="flex justify-left mt-24">

            <div className="p-4  rounded-full">
              <Sparkles className="h-8 w-8" />
            </div>

          </div>

          <h3 className="text-xl font-bold mb-3">
            Scopri Genio AI
          </h3>
          

          
          <div className="space-y-3 mb-6">
            <div className="flex items-left gap-2 text-sm text-gray-700">
              <Check className="h-4 w-4 flex-shrink-0" />
              <span>Analisi intelligente di requisiti e scadenze</span>
            </div>
            <div className="flex items-left gap-2 text-sm text-gray-700">
              <Check className="h-4 w-4 flex-shrink-0" />
              <span>Risposte immediate ai tuoi dubbi</span>
            </div>
            <div className="flex items-left gap-2 text-sm text-gray-700">
              <Check className="h-4 w-4 flex-shrink-0" />
              <span>Consigli personalizzati per la candidatura</span>
            </div>
          </div>
        </div>

        <Card className="p-6 w-full bg-white/90 backdrop-blur-sm border-2 shadow-lg">
          <div className="mb-4">
            <h4 className="font-semibold text-lg mb-2">
              Inizia Subito!
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              Unisciti a migliaia di professionisti che usano Genio AI per trovare 
              il concorso perfetto e prepararsi al meglio.
            </p>
          </div>
          
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
  );
}
