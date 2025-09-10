import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown, HelpCircle, Shield, Search, Bell, CreditCard, Users, FileText, Mail } from 'lucide-react';
import type { Metadata } from "next";
import { MainFooter } from "@/components/ui/main-footer";
import { CTASection } from "@/components/ui/cta-section"


export const metadata: Metadata = {
  title: "FAQ - Domande Frequenti | Concoro",
  description: "Risposte alle domande più comuni su Concoro, la piattaforma per concorsi pubblici. Scopri come funziona la ricerca, le notifiche, i prezzi e molto altro.",
  keywords: ["FAQ", "domande frequenti", "concorsi pubblici", "Concoro", "supporto", "aiuto"],
  openGraph: {
    title: "FAQ - Domande Frequenti | Concoro",
    description: "Risposte alle domande più comuni su Concoro, la piattaforma per concorsi pubblici in Italia.",
    type: "website",
  },
};

const faqData = [
  {
    category: "Informazioni Generali",
    icon: <HelpCircle className="w-5 h-5" />,
    questions: [
      {
        question: "Che cos'è Concoro?",
        answer: "Concoro è una piattaforma che semplifica la ricerca di concorsi pubblici in Italia. Raccogliamo bandi da fonti ufficiali e li rendiamo facilmente consultabili con l'aiuto dell'intelligenza artificiale, offrendo riepiloghi chiari e suggerimenti personalizzati."
      },
      {
        question: "Come vengono selezionati i concorsi mostrati?",
        answer: "I concorsi sono raccolti automaticamente da fonti certificate come la Gazzetta Ufficiale, inPA e portali istituzionali. Il nostro sistema AI analizza ogni bando per estrarre informazioni chiave come requisiti, scadenze, sedi e tipologie di impiego."
      },
      {
        question: "Concoro sostituisce le fonti ufficiali?",
        answer: "No, Concoro è uno strumento di ricerca e consultazione. Per la candidatura ufficiale dovrai sempre fare riferimento ai portali originali indicati nel bando. Il nostro ruolo è aiutarti a scoprire e capire meglio le opportunità disponibili."
      }
    ]
  },
  {
    category: "Registrazione e Account",
    icon: <Users className="w-5 h-5" />,
    questions: [
      {
        question: "Devo registrarmi per usare Concoro?",
        answer: "Puoi consultare molti concorsi gratuitamente senza registrazione. Per salvare bandi, ricevere suggerimenti personalizzati, attivare promemoria e accedere alla dashboard completa, è necessaria la registrazione."
      },
      {
        question: "Come posso creare un account?",
        answer: "Puoi registrarti facilmente con email e password, oppure utilizzare l'accesso rapido con Google. La registrazione richiede meno di un minuto e ti dà accesso immediato a tutte le funzionalità base."
      },
      {
        question: "Posso modificare le mie informazioni personali?",
        answer: "Sì, puoi aggiornare il tuo profilo, le preferenze lavorative e le impostazioni di notifica in qualsiasi momento dalla sezione 'Profilo' della tua dashboard."
      },
      {
        question: "Come posso eliminare il mio account?",
        answer: "Puoi eliminare il tuo account dalle impostazioni del profilo o contattando il nostro supporto. Tutti i tuoi dati verranno rimossi in conformità al GDPR."
      }
    ]
  },
  {
    category: "Funzionalità e Ricerca",
    icon: <Search className="w-5 h-5" />,
    questions: [
      {
        question: "Come funziona la ricerca intelligente?",
        answer: "La nostra ricerca utilizza AI per comprendere le tue intenzioni. Puoi cercare per parole chiave, località, titolo di studio, esperienza richiesta o semplicemente descrivere il tipo di lavoro che cerchi. Il sistema restituisce risultati pertinenti e ordinati per rilevanza."
      },
      {
        question: "Cosa sono i suggerimenti personalizzati?",
        answer: "Basandoci sul tuo profilo, le tue ricerche e i bandi che salvi, il nostro algoritmo ti propone nuovi concorsi compatibili con i tuoi interessi. Più usi la piattaforma, più accurati diventano i suggerimenti."
      },
      {
        question: "Come posso salvare i concorsi che mi interessano?",
        answer: "Clicca sull'icona del segnalibro accanto a ogni concorso per salvarlo. Troverai tutti i tuoi bandi salvati nella sezione 'Salvati' della dashboard, dove potrai anche organizzarli per categoria."
      },
      {
        question: "Posso filtrare i risultati?",
        answer: "Sì, puoi filtrare per regione, titolo di studio richiesto, tipologia di contratto, ente banditore, scadenza e molti altri criteri. I filtri si combinano per offrirti risultati sempre più precisi."
      }
    ]
  },
  {
    category: "Notifiche e Promemoria",
    icon: <Bell className="w-5 h-5" />,
    questions: [
      {
        question: "Posso ricevere notifiche quando escono nuovi bandi?",
        answer: "Sì, puoi attivare notifiche email personalizzate in base ai tuoi interessi, alla tua posizione geografica e ai tuoi titoli di studio. Le notifiche vengono inviate quando pubblichiamo nuovi concorsi che corrispondono ai tuoi criteri."
      },
      {
        question: "Come funzionano i promemoria sulle scadenze?",
        answer: "Ti avvisiamo automaticamente quando un concorso che hai salvato sta per scadere. Puoi scegliere di ricevere promemoria a 7, 3 o 1 giorno dalla scadenza tramite email e notifiche push."
      },
      {
        question: "Posso personalizzare le notifiche?",
        answer: "Assolutamente sì. Dalle impostazioni puoi scegliere quando e come ricevere le notifiche: email, push, frequenza e tipologie di concorsi. Hai il controllo completo sulla tua esperienza."
      }
    ]
  },
  {
    category: "Prezzi e Piani",
    icon: <CreditCard className="w-5 h-5" />,
    questions: [
      {
        question: "Concoro è gratis?",
        answer: "Concoro offre un piano gratuito con accesso alla ricerca base, visualizzazione dei concorsi e alcune funzionalità di salvataggio. I piani premium includono suggerimenti avanzati, notifiche illimitate, analisi dettagliate e supporto prioritario."
      },
      {
        question: "Quali sono le differenze tra i piani?",
        answer: "Il piano gratuito include ricerca base e consultazione. I piani a pagamento aggiungono notifiche personalizzate illimitate, suggerimenti AI avanzati, analisi delle candidature, supporto prioritario e accesso anticipato alle nuove funzionalità."
      },
      {
        question: "Posso disdire in qualsiasi momento?",
        answer: "Sì, puoi annullare il tuo abbonamento in qualsiasi momento dalle impostazioni dell'account. L'abbonamento rimarrà attivo fino alla fine del periodo già pagato."
      },
      {
        question: "Offrite sconti per studenti?",
        answer: "Sì, offriamo sconti speciali per studenti universitari e neolaureati. Contatta il nostro supporto con la documentazione appropriata per attivare lo sconto."
      }
    ]
  },
  {
    category: "Sicurezza e Privacy",
    icon: <Shield className="w-5 h-5" />,
    questions: [
      {
        question: "Come proteggete i miei dati personali?",
        answer: "I tuoi dati sono protetti con crittografia avanzata e archiviati in server sicuri in Europa. Rispettiamo rigorosamente il GDPR e non condividiamo mai le tue informazioni personali con terze parti senza il tuo consenso esplicito."
      },
      {
        question: "Cosa fate con le mie informazioni di ricerca?",
        answer: "Utilizziamo le tue ricerche solo per migliorare i suggerimenti personalizzati e l'esperienza sulla piattaforma. I dati sono anonimizzati per analisi statistiche generali. Puoi sempre visualizzare, modificare o eliminare i tuoi dati."
      },
      {
        question: "Posso vedere quali dati avete su di me?",
        answer: "Sì, dalla sezione 'Privacy' del tuo profilo puoi visualizzare tutti i dati che abbiamo raccolto, scaricare una copia completa o richiedere la cancellazione, in linea con i tuoi diritti GDPR."
      }
    ]
  },
  {
    category: "Problemi Tecnici",
    icon: <FileText className="w-5 h-5" />,
    questions: [
      {
        question: "Il sito non si carica correttamente, cosa posso fare?",
        answer: "Prova a svuotare la cache del browser, disabilitare temporaneamente gli ad-blocker o utilizzare un browser diverso. Se il problema persiste, contattaci specificando browser e sistema operativo utilizzati."
      },
      {
        question: "Non riesco a ricevere le email di notifica",
        answer: "Controlla la cartella spam, verifica che l'indirizzo email nel tuo profilo sia corretto e aggiungi noreply@concoro.it ai tuoi contatti. Se il problema continua, contatta il supporto."
      },
      {
        question: "L'app mobile è disponibile?",
        answer: "Attualmente Concoro è ottimizzato per il web e funziona perfettamente su dispositivi mobili tramite browser. Stiamo sviluppando app native per iOS e Android che saranno disponibili prossimamente."
      },
      {
        question: "Come posso segnalare un bando errato o obsoleto?",
        answer: "Ogni scheda concorso ha un pulsante 'Segnala errore'. Usa questa funzione per comunicarci informazioni errate o bandi scaduti. Verifichiamo tutte le segnalazioni entro 24 ore."
      }
    ]
  },
  {
    category: "Supporto e Contatti",
    icon: <Mail className="w-5 h-5" />,
    questions: [
      {
        question: "Come posso contattare il supporto?",
        answer: "Puoi scriverci all'indirizzo support@concoro.it, utilizzare il modulo di contatto nella pagina 'Contatti', o inviare un messaggio tramite i nostri canali social. Rispondiamo entro 24 ore nei giorni lavorativi."
      },
      {
        question: "Offrite supporto telefonico?",
        answer: "Attualmente il supporto è disponibile via email e chat. Per gli utenti dei piani premium è disponibile il supporto prioritario con tempi di risposta ridotti."
      },
      {
        question: "Dove posso trovare guide e tutorial?",
        answer: "Nella sezione 'Guide' del sito trovi tutorial dettagliati per utilizzare tutte le funzionalità. Pubblichiamo anche video tutorial sul nostro canale YouTube e aggiornamenti regolari sul blog."
      },
      {
        question: "Posso suggerire nuove funzionalità?",
        answer: "Certamente! Apprezziamo molto i feedback degli utenti. Puoi inviarci le tue idee tramite email o partecipare alle discussioni sui nostri canali social. Le migliori suggerimenti vengono implementati nei nostri aggiornamenti."
      }
    ]
  }
];

export default function FAQ() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-background py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-[#0A1F44] mb-6">
            Domande frequenti
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Hai domande su Concoro? Qui trovi le risposte alle domande più comuni. 
            Se non trovi quello che cerchi, non esitare a contattarci.
          </p>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="space-y-8">
            {faqData.map((category, categoryIndex) => (
              <div key={category.category} className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#0A1F44]/10 rounded-lg">
                      {category.icon}
                    </div>
                    <h2 className="text-xl font-semibold text-[#0A1F44]">
                      {category.category}
                    </h2>
                  </div>
                </div>
                
                <div className="p-6 pt-4">
                  <Accordion.Root type="single" collapsible className="space-y-4">
                    {category.questions.map((faq, faqIndex) => (
                      <Accordion.Item
                        key={`${categoryIndex}-${faqIndex}`}
                        value={`item-${categoryIndex}-${faqIndex}`}
                        className="border rounded-lg overflow-hidden"
                      >
                        <Accordion.Trigger className="flex w-full items-center justify-between px-6 py-4 text-left text-sm font-medium transition-all hover:bg-gray-50 [&[data-state=open]>svg]:rotate-180">
                          <span className="text-gray-900 font-medium">
                            {faq.question}
                          </span>
                          <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 text-gray-500" />
                        </Accordion.Trigger>
                        <Accordion.Content className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                          <div className="px-6 pb-4 pt-2">
                            <p className="text-gray-700 leading-relaxed">
                              {faq.answer}
                            </p>
                          </div>
                        </Accordion.Content>
                      </Accordion.Item>
                    ))}
                  </Accordion.Root>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <CTASection />

      {/* Main Footer */}
      <MainFooter />
    </main>
  );
} 