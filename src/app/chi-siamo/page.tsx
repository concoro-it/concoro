'use client';

import Image from 'next/image';
import Link from 'next/link';
import { BellIcon, SearchIcon, BookmarkIcon, UserIcon, BriefcaseIcon, SparklesIcon, Target, Users, TrendingUp } from 'lucide-react';
import { BentoCard, BentoGrid } from '@/components/ui/bento-grid';
import { Testimonials } from '@/components/ui/testimonials';
import { MagicText } from '@/components/ui/magic-text';
import { MainFooter } from '@/components/ui/main-footer';
import DisplayCards from '@/components/ui/display-cards';
import { Feature } from '@/components/ui/feature-with-advantages';
import { CTASection } from '@/components/ui/cta-section';
import { BackgroundBeams } from '@/components/ui/background-beams';

const features = [
  {
    Icon: SparklesIcon,
    name: "Bandi semplificati e leggibili",
    description: "Ogni concorso è presentato in modo chiaro, con riepiloghi comprensibili, requisiti evidenziati e PDF ufficiali a portata di click.",
    href: "/features/search",
    cta: "Scopri di più",
    background: <div />,
    className: "lg:row-start-1 lg:row-end-4 lg:col-start-2 lg:col-end-3",
  },
  {
    Icon: BellIcon,
    name: "Suggerimenti personalizzati per te",
    description: "Concoro impara da ciò che cerchi e ti propone nuovi bandi compatibili con il tuo profilo, ogni giorno.",
    href: "/features/notifications",
    cta: "Scopri di più",
    background: <div />,
    className: "lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-3",
  },
  {
    Icon: BookmarkIcon,
    name: "Promemoria automatici sulle scadenze",
    description: "Non perdere più una data importante: Concoro ti avvisa quando un concorso sta per scadere o ne esce uno simile.",
    href: "/features/bookmarks",
    cta: "Scopri di più",
    background: <div />,
    className: "lg:col-start-1 lg:col-end-2 lg:row-start-3 lg:row-end-4",
  },
  {
    Icon: SearchIcon,
    name: "Ricerca intelligente dei concorsi",
    description: "Trova subito il bando che fa per te grazie a una ricerca potenziata per parole chiave, località, profilo e scadenza.",
    href: "/features/search",
    cta: "Scopri di più",
    background: <div />,
    className: "lg:col-start-3 lg:col-end-3 lg:row-start-1 lg:row-end-2",
  },
  {
    Icon: BriefcaseIcon,
    name: "Tutti i concorsi, da fonti ufficiali",
    description: "Raccogliamo e aggiorniamo i dati ogni giorno da Gazzetta Ufficiale, inPA e altri portali pubblici: zero spam, solo concorsi reali.",
    href: "/features/fonti",
    cta: "Scopri di più",
    background: <div />,
    className: "lg:col-start-3 lg:col-end-3 lg:row-start-2 lg:row-end-4",
  },
];

const concorsoCards = [
  {
    icon: <Target className="size-4 text-[#0A1F44]" />,
    title: "Concorso pubblico",
    description: "Concorso pubblico per l’assunzione di",
    date: "4617 posti",
    iconClassName: "textcan -[#0A1F44]",
    titleClassName: "text-[#0A1F44]",
    className: "[grid-area:stack] hover:-translate-y-10 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
  },
  {
    icon: <Users className="size-4 text-[#0A1F44]" />,
    title: "Comunità attiva",
    description: "Migliaia di cittadini supportati",
    date: "Ogni giorno",
    iconClassName: "text-[#0A1F44]",
    titleClassName: "text-[#0A1F44]",
    className: "[grid-area:stack] translate-x-16 translate-y-10 hover:-translate-y-1 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
  },
  {
    icon: <TrendingUp className="size-4 text-[#0A1F44]" />,
    title: "Crescita continua",
    description: "Innovazione e miglioramento costante",
    date: "Sempre",
    iconClassName: "text-[#0A1F44]",
    titleClassName: "text-[#0A1F44]",
    className: "[grid-area:stack] translate-x-32 translate-y-20 hover:translate-y-10",
  },
];

const testimonials = [
  {
    image: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&h=150&fit=crop&crop=face",
    name: "Marco Rossi",
    username: "@marcorossi",
    text: "Grazie a Concoro ho trovato il mio attuale lavoro nel settore pubblico. La piattaforma ha reso tutto il processo molto più semplice.",
    social: "https://twitter.com/marcorossi"
  },
  
  {
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    name: "Giuseppe Verdi",
    username: "@gverdi",
    text: "La chiarezza con cui vengono presentati i bandi è impressionante. Finalmente posso capire tutti i requisiti senza difficoltà.",
    social: "https://twitter.com/gverdi"
  },
  {
    image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&h=150&fit=crop&crop=face",
    name: "Francesca Romano",
    username: "@francescaromano",
    text: "I suggerimenti personalizzati di Concoro mi hanno fatto scoprire opportunità che non avrei mai trovato da sola.",
    social: "https://twitter.com/francescaromano"
  },
  {
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    name: "Antonio Marino",
    username: "@antoniomarino",
    text: "Ho apprezzato particolarmente come Concoro abbia semplificato la ricerca di concorsi compatibili con il mio profilo professionale.",
    social: "https://twitter.com/antoniomarino"
  },
  {
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face",
    name: "Giulia Martini",
    username: "@giuliamartini",
    text: "Da quando utilizzo Concoro per la ricerca di concorsi pubblici, ho risparmiato ore di tempo e frustrazione.",
    social: "https://twitter.com/giuliamartini"
  },
  {
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face",
    name: "Paolo Ferrari",
    username: "@paoloferrari",
    text: "Dopo anni di tentativi, grazie a Concoro ho finalmente trovato e vinto un concorso pubblico. La piattaforma è intuitiva e completa.",
    social: "https://twitter.com/paoloferrari"
  },
  {
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    name: "Serena Costa",
    username: "@serenacosta",
    text: "I riassunti dei bandi sono chiari. Concoro è lo strumento che aspettavo da tempo per la mia ricerca di lavoro nel pubblico.",
    social: "https://twitter.com/serenacosta"
  },
  {
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face",
    name: "Luca Bianchi",
    username: "@lucabianchi",
    text: "Le notifiche sui nuovi bandi mi hanno permesso di essere sempre aggiornato sulle opportunità nel mio settore. Un servizio davvero prezioso.",
    social: "https://twitter.com/lucabianchi"
  },
  {
    image: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=150&h=150&fit=crop&crop=face",
    name: "Elena Ricci",
    username: "@elenaricci",
    text: "Concoro ha semplificato il mio percorso verso un impiego pubblico. Ora lavoro in comune grazie ai consigli e agli strumenti della piattaforma.",
    social: "https://twitter.com/elenaricci"
  }
];

export default function ChiSiamo() {
  return (
    <main className="min-h-screen bg-background">
    
      {/* Hero Section */}
      <section className="bg-background container mx-auto px-4 pt-16 pb-0 flex flex-col md:flex-row justify-between items-center relative overflow-hidden">
        <BackgroundBeams className="opacity-30" />
        <div className="max-w-xl mb-8 md:mb-0 relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold text-[#0A1F44] mb-6">
            Cambia il tuo futuro
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Concoro è la piattaforma leader dedicata a semplificare l'accesso ai concorsi pubblici in Italia. Aiutiamo migliaia di cittadini a trovare e candidarsi alle migliori opportunità lavorative nella pubblica amministrazione.
          </p>
          <Link
            href="/signup"
            className="inline-block px-4 py-2 bg-[#0A1F44] text-white rounded-md text-lg font-medium hover:bg-opacity-90 transition-colors"
          >
            Inizia ora
          </Link>
        </div>
        <div className="relative w-full md:w-[500px] h-[400px] md:h-[600px] flex items-center justify-center z-10">
          <DisplayCards cards={concorsoCards} />
        </div>
      </section>

      {/* Partners Section */}
      <section className="bg-[#0A1F44] py-12">
        <div className="container mx-auto px-4">
          <p className="text-center text-white text-muted mb-8">Dati raccolti da fonti pubbliche</p>
          <div className="grid grid-cols-2 md:flex md:flex-row justify-center items-center gap-8 md:gap-16 max-w-4xl mx-auto">
            <Image
              src="/partners/gazzetta-ufficiale.svg"
              alt="Gazzetta Ufficiale"
              width={180}
              height={60}
              style={{ filter: 'brightness(0) invert(1)' }}
              className="mx-auto"
            />
            <Image
              src="/partners/milano.svg"
              alt="Comune di Milano"
              width={120}
              height={40}
              style={{ filter: 'brightness(0) invert(1)' }}
              className="mx-auto"
            />
            <Image
              src="/partners/inpa.svg"
              alt="inPA"
              width={180}
              height={60}
              style={{ filter: 'brightness(0) invert(1)' }}
              className="mx-auto"
            />
            <Image
              src="/partners/roma-capitale.svg"
              alt="Roma Capitale"
              width={120}
              height={40}
              style={{ filter: 'brightness(0) invert(1)' }}
              className="mx-auto"
            />
          </div>
        </div>
      </section>

      {/* How Concoro Works Section */}
      <Feature />

      {/* Features Grid Section */}
      <section className="bg-gray-50 py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-[#0A1F44] mb-16">
            Tutto ciò di cui hai bisogno per i concorsi pubblici
          </h2>
          <BentoGrid className="lg:grid-rows-3">
            {features.map((feature) => (
              <BentoCard key={feature.name} {...feature} />
            ))}
          </BentoGrid>
        </div>
      </section>


      {/* Testimonials Section */}
      <section className="bg-dark-primary py-24">
        <div className="container mx-auto px-4">
          <Testimonials 
            testimonials={testimonials} 
            className="text-dark-text-primary [&_p.text-muted-foreground]:text-dark-text-secondary [&_div.bg-background]:bg-dark-secondary [&_div.border]:border-dark-border [&_div.shadow-primary/10]:shadow-white/5 [&_div.rounded-3xl]:bg-dark-secondary/80 [&_div.opacity-60]:text-dark-text-secondary"
            title="La voce dei nostri utenti"
            description="Scopri come Concoro sta aiutando migliaia di persone a trovare il loro posto ideale nel settore pubblico"
            animated={true}
          />
        </div>
      </section>

      {/* MagicText Section */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="relative flex items-center justify-center">
            <MagicText
              text={`**Abbiamo creato Concoro per chi crede nel valore del servizio pubblico — ma è stanco di dover affrontare un sistema che sembra fatto per scoraggiare.** Se hai passato ore a decifrare bandi confusi, rincorrere scadenze poco chiare o chiederti se hai davvero i requisiti giusti, sappi che non sei solo. Crediamo che la tua formazione, la tua esperienza e il tuo tempo meritino molto di più. Concoro nasce per semplificare, chiarire e modernizzare il modo in cui trovi e affronti i concorsi pubblici.\n\nUniamo tecnologia e fiducia — non per sostituire il sistema, ma per farlo finalmente funzionare per persone come te. Con avvisi personalizzati, riassunti intelligenti e filtri efficaci, **Concoro elimina la fatica inutile, così puoi concentrarti su ciò che conta davvero: trovare un'opportunità in linea con le tue competenze e aspirazioni.** Che tu stia cercando stabilità, un nuovo inizio o il rientro nella pubblica amministrazione, noi siamo qui per trasformare il percorso da ostacolo a possibilità concreta.`}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <CTASection />

      {/* Footer */}
      <MainFooter />

    </main>
  );
} 