"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ChevronUp,
  ChevronDown,
  Sparkles,
  Check
} from "lucide-react"
import { useAuthAdapter } from "@/lib/hooks/useAuthAdapter"
import { toast } from "sonner"
import React, { useState } from "react"

interface GuestChatInterfaceProps {
  className?: string;
}

export function GuestChatInterface({ className }: GuestChatInterfaceProps) {
  const { signInWithGoogle } = useAuthAdapter();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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
    <div className={`sticky bottom-0 left-0 right-0 ${className}`} style={{
      borderTopRightRadius: 8,
      borderTopLeftRadius: 8,
      background: 'linear-gradient(to right, rgba(255, 255, 255, 0.8), #c2e9fb)',
      backdropFilter: 'blur(8px)'
    }}>
      <div className="max-w-4xl mx-auto">
        {/* Header with Chevron */}
        <div 
          className="flex justify-between items-center p-4 cursor-pointer"
          onClick={() => setIsDrawerOpen(!isDrawerOpen)}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium">Genio ti aiuta a fare chiarezza</h3>
              <Badge className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 h-5">
                Beta
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Accedi per fare domande a Genio, il tuo assistente AI.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={(e) => {
              e.stopPropagation();
              setIsDrawerOpen(!isDrawerOpen);
            }}
          >
            {isDrawerOpen ? (
              <ChevronDown className="h-6 w-6" />
            ) : (
              <ChevronUp className="h-6 w-6" />
            )}
          </Button>
        </div>

        {/* Expandable Content */}
        <div className={`space-y-4 overflow-hidden transition-all duration-300 ease-in-out ${
          isDrawerOpen ? 'max-h-[600px] p-4' : 'max-h-0'
        }`}>

        {/* Preview of what users get */}
          <div className="rounded-lg">
            <p className="text-xs text-gray-500 mb-2">Esempi di domande che puoi fare a Genio:</p>
            <div className="flex flex-wrap gap-2">
              <div className="px-3 py-1.5 bg-white text-gray-700 text-xs rounded-full border">
                Quali sono i requisiti principali?
              </div>
              <div className="px-3 py-1.5 bg-white text-gray-700 text-xs rounded-full border">
                Quando scade il bando?
              </div>
              <div className="px-3 py-1.5 bg-white text-gray-700 text-xs rounded-full border">
                Come prepararsi per il concorso?
              </div>
            </div>
          </div>


          {/* Guest Content */}
          <div className="bg-white/90 backdrop-blur-sm border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full">
                <Sparkles className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-lg">
                  Sblocca il Potere di Genio AI
                </h4>
                <p className="text-sm text-gray-600">
                  Ottieni risposte immediate su questo concorso
                </p>
              </div>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Check className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <span>Analisi intelligente di requisiti e scadenze</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Check className="h-4 w-4 text-purple-500 flex-shrink-0" />
                <span>Risposte immediate ai tuoi dubbi</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>Consigli personalizzati per la candidatura</span>
              </div>
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
              <span>Accedi con Google per usare Genio AI</span>
            </Button>

            <p className="text-xs text-gray-400 mt-4 text-center">
              Più di 10.000 professionisti si fidano già di Concoro
            </p>
          </div>


        </div>
      </div>
    </div>
  );
}
