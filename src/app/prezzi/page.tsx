import { Briefcase, Sparkles, Zap, Crown, Target, Bell, BookOpen, Shield, Users, Star } from "lucide-react"
import PricingSection from "@/components/ui/pricing-section"
import { MainFooter } from "@/components/ui/main-footer"
import Link from "next/link"
import type { Metadata } from "next"
import { CTASection } from "@/components/ui/cta-section"

export const metadata: Metadata = {
  title: "Prezzi e Piani | Concoro - Scegli il piano perfetto per te",
  description: "Scopri i piani di Concoro: dal piano gratuito a quello premium con AI personalizzata. Trova il piano perfetto per la tua ricerca di lavoro nel settore pubblico.",
  keywords: ["prezzi", "piani", "abbonamento", "concorsi pubblici", "Concoro", "premium", "gratis"],
  openGraph: {
    title: "Prezzi e Piani | Concoro",
    description: "Scegli il piano perfetto per la tua ricerca di lavoro nel settore pubblico. Dal piano gratuito al premium con AI.",
    type: "website",
  },
}

const concoroTiers = [
  {
    name: "Base",
    price: {
      monthly: 0,
      yearly: 0,
    },
    description: "Inizia gratuitamente con l'accesso ai concorsi pubblici aggiornati quotidianamente",
    icon: <Briefcase className="w-6 h-6" />,
    features: [
      {
        name: "Database concorsi aggiornato",
        description: "Accesso a tutti i bandi pubblici raccolti da fonti ufficiali",
        included: true,
      },
      {
        name: "Ricerca e filtri di base",
        description: "Cerca per regione, categoria, titolo di studio e scadenza",
        included: true,
      },
      {
        name: "Visualizzazione dettagli",
        description: "Leggi i riepiloghi chiari e accedi ai PDF originali",
        included: true,
      },
      {
        name: "Salvataggio limitato",
        description: "Salva fino a 5 concorsi nella tua lista preferiti",
        included: true,
      },
      {
        name: "Newsletter settimanale",
        description: "Ricevi un riassunto dei nuovi bandi ogni settimana",
        included: true,
      },
      {
        name: "Notifiche personalizzate",
        description: "Massimo 2 alert email al mese",
        included: false,
      },
      {
        name: "Supporto AI avanzato",
        description: "Suggerimenti personalizzati e match intelligenti",
        included: false,
      },
      {
        name: "Analisi compatibilità CV",
        description: "Verifica automatica della compatibilità del profilo",
        included: false,
      },
    ],
  },
  {
    name: "Pro",
    price: {
      monthly: 9.99,
      yearly: 99,
    },
    description: "AI personalizzata, notifiche smart e strumenti avanzati per ottimizzare la tua ricerca",
    badge: "Gratis per Beta",
    highlight: true,
    icon: <Sparkles className="w-6 h-6" />,
    features: [
      {
        name: "Tutto del piano Base",
        description: "Accesso completo a tutte le funzionalità gratuite",
        included: true,
      },
      {
        name: "AI Job Matching avanzato",
        description: "Algoritmo che impara dalle tue preferenze e trova i concorsi perfetti",
        included: true,
      },
      {
        name: "Notifiche illimitate",
        description: "Alert personalizzati via email e push per nuovi bandi rilevanti",
        included: true,
      },
      {
        name: "Promemoria scadenze smart",
        description: "Avvisi automatici 7, 3 e 1 giorno prima della scadenza",
        included: true,
      },
      {
        name: "Analisi CV e requisiti",
        description: "Verifica automatica della compatibilità del tuo profilo",
        included: true,
      },
      {
        name: "Dashboard avanzata",
        description: "Statistiche dettagliate e timeline delle candidature",
        included: true,
      },
      {
        name: "Salvataggio illimitato",
        description: "Organizza i tuoi concorsi in cartelle personalizzate",
        included: true,
      },
      {
        name: "Supporto email prioritario",
        description: "Risposte garantite entro 24 ore nei giorni lavorativi",
        included: true,
      },
    ],
  },
]

// Additional features section data
const additionalFeatures = [
  {
    icon: <Target className="w-8 h-8 text-[#0A1F44]" />,
    title: "Targeting preciso",
    description: "La nostra AI analizza il tuo profilo e trova automaticamente i concorsi più compatibili con le tue competenze e aspirazioni."
  },
  {
    icon: <Bell className="w-8 h-8 text-[#0A1F44]" />,
    title: "Notifiche intelligenti",
    description: "Ricevi alert personalizzati solo per i bandi che ti interessano davvero, quando vuoi tu."
  },
  {
    icon: <BookOpen className="w-8 h-8 text-[#0A1F44]" />,
    title: "Risorse di preparazione",
    description: "Accedi a guide, quiz e materiali per prepararti al meglio ai tuoi concorsi."
  },
  {
    icon: <Shield className="w-8 h-8 text-[#0A1F44]" />,
    title: "Sempre aggiornato",
    description: "Database aggiornato quotidianamente da fonti ufficiali certificate e verificate."
  }
]

const testimonials = [
  {
    name: "Laura Bianchi",
    role: "Funzionario pubblico",
    content: "Grazie al piano Pro di Concoro ho trovato il concorso perfetto per le mie competenze. L'AI ha individuato opportunità che non avrei mai considerato!",
    rating: 5
  },
  {
    name: "Marco Rossi", 
    role: "Neolaureato",
    content: "Perfetto per chi inizia. Il piano gratuito mi ha permesso di esplorare le opportunità, poi sono passato al Pro per le notifiche personalizzate.",
    rating: 5
  },
  {
    name: "Giulia Verdi",
    role: "Impiegata comunale", 
    content: "Le notifiche smart mi hanno fatto risparmiare ore di ricerche. Ora non perdo mai una scadenza importante!",
    rating: 5
  }
]

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-background">

      {/* Pricing Section */}
      <PricingSection tiers={concoroTiers} />

      {/* Features Comparison */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#0A1F44] mb-4">
              Perché scegliere Pro?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Il piano Pro ti offre strumenti avanzati per ottimizzare la tua ricerca 
              e non perdere mai l'opportunità giusta.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {additionalFeatures.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="mb-4 flex justify-center">
                  <div className="p-3 bg-[#0A1F44]/10 rounded-xl">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-[#0A1F44] mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* FAQ Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#0A1F44] mb-4">
              Domande frequenti sui piani
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-[#0A1F44] mb-2">
                  Posso cambiare piano in qualsiasi momento?
                </h3>
                <p className="text-gray-600 text-sm">
                  Sì, puoi effettuare l'upgrade al piano Pro o cancellare l'abbonamento in qualsiasi momento dalle impostazioni del tuo account.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#0A1F44] mb-2">
                  Come funziona il piano annuale?
                </h3>
                <p className="text-gray-600 text-sm">
                  Con il piano annuale risparmi oltre il 30% rispetto al mensile. Il pagamento viene effettuato una volta all'anno.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#0A1F44] mb-2">
                  Offrite sconti per studenti?
                </h3>
                <p className="text-gray-600 text-sm">
                  Sì, offriamo sconti speciali per studenti universitari e neolaureati. Contatta il supporto per maggiori informazioni.
                </p>
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-[#0A1F44] mb-2">
                  Quali metodi di pagamento accettate?
                </h3>
                <p className="text-gray-600 text-sm">
                  Accettiamo tutte le principali carte di credito/debito, PayPal e bonifico bancario per i piani annuali.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#0A1F44] mb-2">
                  I miei dati saranno al sicuro?
                </h3>
                <p className="text-gray-600 text-sm">
                  Assolutamente sì. Utilizziamo crittografia avanzata e rispettiamo rigorosamente il GDPR per proteggere i tuoi dati.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#0A1F44] mb-2">
                  Posso provare il piano Pro gratuitamente?
                </h3>
                <p className="text-gray-600 text-sm">
                  Al momento non offriamo trial gratuiti, ma puoi iniziare con il piano Base e fare l'upgrade quando vuoi.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* CTA Section */}
      <CTASection />

      {/* Main Footer */}
      <MainFooter />
    </main>
  )
} 