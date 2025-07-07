import { X } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMediaQuery } from "@/hooks/use-media-query"

export const JobAlertBanner = () => {
  const [isVisible, setIsVisible] = useState(true)
  const router = useRouter()
  const isMobile = useMediaQuery("(max-width: 768px)")

  if (!isVisible) return null

  return (
    <div className="relative rounded-lg p-8 md:p-8 p-4 md:p-8 shadow-sm" style={{ background: 'linear-gradient(to right, rgba(255, 255, 255, 0.8), rgb(194, 233, 251))' }}>
      <button
        onClick={() => setIsVisible(false)}
        className="absolute right-4 top-4 rounded-full p-1.5 hover:bg-gray-100 transition-colors"
        aria-label="Chiudi banner"
      >
        <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
      </button>

      <div className={`flex ${isMobile ? 'flex-col' : 'items-start justify-between'}`}>
        {isMobile && (
          <div className="relative h-[120px] w-full mb-6 flex justify-center">
            <Image
              src="/banner.png"
              alt="Illustrazione banner"
              width={180}
              height={120}
              className="object-contain"
            />
          </div>
        )}
        
        <div className="space-y-2">
          <p className="text-muted-foreground mobile-text-compact">Azione consigliata</p>
          <h3 className="text-2xl md:text-2xl mobile-title-medium font-semibold tracking-tight">
          Non lasciarti sfuggire nessuna occasione
          </h3>
          <p className="text-muted-foreground mobile-text-compact">
          Attiva le notifiche per ricevere subito gli ultimi concorsi che ti interessano.
          </p>
          <button 
            onClick={() => router.push('/preferenze-lavorative')}
            className="inline-flex items-center justify-center rounded-md bg-[#0A1F44] px-4 py-2 md:px-4 md:py-2 mobile-button-compact text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            Attiva notifica
          </button>
        </div>

        {!isMobile && (
          <div className="relative h-[120px] w-[180px]">
            <Image
              src="/banner.png"
              alt="Illustrazione banner"
              fill
              className="object-contain"
            />
          </div>
        )}
      </div>
    </div>
  )
} 