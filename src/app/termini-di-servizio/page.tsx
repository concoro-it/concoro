'use client';

import Link from 'next/link';
import { ChevronLeft, FileText, Shield, Mail, ExternalLink } from 'lucide-react';
import { MainFooter } from '@/components/ui/main-footer';

export default function TerminiDiServizio() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className="flex items-center gap-2 text-gray-600 hover:text-[#0A1F44] transition-colors"
            >
              <ChevronLeft className="size-4" />
              Torna alla home
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Title Section */}
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 bg-[#0A1F44]/10 rounded-full">
              <FileText className="size-8 text-[#0A1F44]" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#0A1F44] mb-4">
            Termini di servizio
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Ultimo aggiornamento: 5 Giugno 2025
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Shield className="size-4" />
            <span>Documento legale vincolante</span>
          </div>
        </div>

        {/* Table of Contents */}
        <div className="bg-gray-50 rounded-lg p-6 mb-12">
          <h2 className="text-lg font-semibold text-[#0A1F44] mb-4">Indice dei contenuti</h2>
          <nav className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <a href="#introduzione" className="text-gray-600 hover:text-[#0A1F44] transition-colors py-1">1. Introduzione</a>
            <a href="#descrizione-servizio" className="text-gray-600 hover:text-[#0A1F44] transition-colors py-1">2. Descrizione del servizio</a>
            <a href="#account-utente" className="text-gray-600 hover:text-[#0A1F44] transition-colors py-1">3. Account utente</a>
            <a href="#uso-piattaforma" className="text-gray-600 hover:text-[#0A1F44] transition-colors py-1">4. Uso della piattaforma</a>
            <a href="#proprieta-intellettuale" className="text-gray-600 hover:text-[#0A1F44] transition-colors py-1">5. Proprietà intellettuale</a>
            <a href="#limitazione-responsabilita" className="text-gray-600 hover:text-[#0A1F44] transition-colors py-1">6. Limitazione di responsabilità</a>
            <a href="#privacy-dati" className="text-gray-600 hover:text-[#0A1F44] transition-colors py-1">7. Privacy e protezione dati</a>
            <a href="#modifiche-termini" className="text-gray-600 hover:text-[#0A1F44] transition-colors py-1">8. Modifiche ai termini</a>
            <a href="#cancellazione-account" className="text-gray-600 hover:text-[#0A1F44] transition-colors py-1">9. Cancellazione dell'account</a>
            <a href="#legge-applicabile" className="text-gray-600 hover:text-[#0A1F44] transition-colors py-1">10. Legge applicabile</a>
            <a href="#contatti" className="text-gray-600 hover:text-[#0A1F44] transition-colors py-1">11. Contatti</a>
          </nav>
        </div>

        {/* Content Sections */}
        <div className="prose prose-lg max-w-none">
          <section id="introduzione" className="mb-12">
            <h2 className="text-2xl font-bold text-[#0A1F44] mb-4 border-b-2 border-gray-200 pb-2">
              1. Introduzione
            </h2>
            <div className="text-gray-700 leading-relaxed space-y-4">
              <p>
                Benvenuto su Concoro. Utilizzando i nostri servizi, accetti di rispettare i seguenti termini di servizio. Ti preghiamo di leggerli attentamente prima di utilizzare la piattaforma.
              </p>
              <p>
                I presenti termini costituiscono un accordo legalmente vincolante tra te ("Utente") e Concoro ("noi", "nostro", "Società"). L'accesso e l'utilizzo della nostra piattaforma implica l'accettazione integrale di questi termini.
              </p>
            </div>
          </section>

          <section id="descrizione-servizio" className="mb-12">
            <h2 className="text-2xl font-bold text-[#0A1F44] mb-4 border-b-2 border-gray-200 pb-2">
              2. Descrizione del servizio
            </h2>
            <div className="text-gray-700 leading-relaxed space-y-4">
              <p>
                Concoro è una piattaforma che raccoglie, organizza e presenta informazioni su concorsi pubblici italiani. Offriamo strumenti per ricevere notifiche, candidarsi più facilmente e ottenere informazioni dettagliate sui concorsi pubblici.
              </p>
              <p>
                I nostri servizi includono, ma non si limitano a:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Aggregazione di dati sui concorsi pubblici da fonti ufficiali</li>
                <li>Sistema di notifiche personalizzate</li>
                <li>Strumenti di ricerca e filtro avanzati</li>
                <li>Riassunti e semplificazioni dei bandi di concorso</li>
                <li>Area personale per la gestione delle candidature</li>
              </ul>
            </div>
          </section>

          <section id="account-utente" className="mb-12">
            <h2 className="text-2xl font-bold text-[#0A1F44] mb-4 border-b-2 border-gray-200 pb-2">
              3. Account utente
            </h2>
            <div className="text-gray-700 leading-relaxed space-y-4">
              <p>
                Per utilizzare alcune funzionalità di Concoro, è necessario creare un account personale. L'utente è responsabile di mantenere riservate le credenziali di accesso e di tutte le attività svolte tramite il proprio account.
              </p>
              <p>
                L'utente si impegna a:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Fornire informazioni accurate e aggiornate durante la registrazione</li>
                <li>Mantenere la sicurezza delle proprie credenziali di accesso</li>
                <li>Notificare immediatamente qualsiasi uso non autorizzato del proprio account</li>
                <li>Utilizzare un solo account per persona</li>
              </ul>
            </div>
          </section>

          <section id="uso-piattaforma" className="mb-12">
            <h2 className="text-2xl font-bold text-[#0A1F44] mb-4 border-b-2 border-gray-200 pb-2">
              4. Uso della piattaforma
            </h2>
            <div className="text-gray-700 leading-relaxed space-y-4">
              <p>
                Concoro offre servizi esclusivamente per uso personale e non commerciale. È vietato utilizzare la piattaforma per scopi illeciti, fraudolenti, o che violino i diritti altrui.
              </p>
              <p>
                È specificamente vietato:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Utilizzare la piattaforma per attività commerciali non autorizzate</li>
                <li>Effettuare scraping automatizzato dei dati senza autorizzazione</li>
                <li>Interferire con il funzionamento della piattaforma</li>
                <li>Pubblicare contenuti offensivi, diffamatori o illegali</li>
                <li>Impersonare altre persone o entità</li>
                <li>Violare i diritti di proprietà intellettuale</li>
              </ul>
            </div>
          </section>

          <section id="proprieta-intellettuale" className="mb-12">
            <h2 className="text-2xl font-bold text-[#0A1F44] mb-4 border-b-2 border-gray-200 pb-2">
              5. Proprietà intellettuale
            </h2>
            <div className="text-gray-700 leading-relaxed space-y-4">
              <p>
                Tutti i contenuti, inclusi testi, grafiche, loghi, icone e software, sono proprietà di Concoro o dei suoi fornitori di contenuti e sono protetti dalle leggi sul diritto d'autore. È vietato copiare, riprodurre o distribuire qualsiasi materiale senza previa autorizzazione scritta.
              </p>
              <p>
                I diritti di proprietà intellettuale includono:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Marchi registrati e non registrati</li>
                <li>Diritti d'autore su contenuti originali</li>
                <li>Design e layout della piattaforma</li>
                <li>Algoritmi e metodologie proprietarie</li>
                <li>Database e compilazioni di dati</li>
              </ul>
            </div>
          </section>

          <section id="limitazione-responsabilita" className="mb-12">
            <h2 className="text-2xl font-bold text-[#0A1F44] mb-4 border-b-2 border-gray-200 pb-2">
              6. Limitazione di responsabilità
            </h2>
            <div className="text-gray-700 leading-relaxed space-y-4">
              <p>
                Concoro non è responsabile per eventuali errori, omissioni o inesattezze nelle informazioni sui concorsi pubblicati, né per eventuali danni derivanti dall'utilizzo o dal mancato utilizzo delle informazioni fornite sulla piattaforma.
              </p>
              <p>
                La nostra responsabilità è limitata nei seguenti casi:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Interruzioni temporanee del servizio per manutenzione</li>
                <li>Modifiche ai bandi di concorso apportate dagli enti pubblici</li>
                <li>Errori nelle fonti ufficiali da cui raccogliamo i dati</li>
                <li>Problemi tecnici indipendenti dalla nostra volontà</li>
                <li>Decisioni prese dall'utente basate sulle informazioni fornite</li>
              </ul>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-4">
                <p className="text-yellow-800">
                  <strong>Importante:</strong> Le informazioni sui concorsi sono raccolte da fonti ufficiali, ma consigliamo sempre di verificare i dettagli direttamente sui siti degli enti banditori prima di presentare domanda.
                </p>
              </div>
            </div>
          </section>

          <section id="privacy-dati" className="mb-12">
            <h2 className="text-2xl font-bold text-[#0A1F44] mb-4 border-b-2 border-gray-200 pb-2">
              7. Privacy e protezione dati
            </h2>
            <div className="text-gray-700 leading-relaxed space-y-4">
              <p>
                La protezione dei tuoi dati personali è una nostra priorità. Il trattamento dei dati avviene in conformità al Regolamento Generale sulla Protezione dei Dati (GDPR) e alla normativa italiana applicabile.
              </p>
              <p>
                Per informazioni dettagliate sul trattamento dei dati personali, ti invitiamo a consultare la nostra{' '}
                <Link href="/privacy-policy" className="text-[#0A1F44] hover:underline font-medium">
                  Informativa sulla Privacy
                </Link>.
              </p>
              <p>
                I tuoi diritti includono:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Accesso ai dati personali</li>
                <li>Rettifica di dati inesatti</li>
                <li>Cancellazione dei dati (diritto all'oblio)</li>
                <li>Limitazione del trattamento</li>
                <li>Portabilità dei dati</li>
                <li>Opposizione al trattamento</li>
              </ul>
            </div>
          </section>

          <section id="modifiche-termini" className="mb-12">
            <h2 className="text-2xl font-bold text-[#0A1F44] mb-4 border-b-2 border-gray-200 pb-2">
              8. Modifiche ai termini
            </h2>
            <div className="text-gray-700 leading-relaxed space-y-4">
              <p>
                Concoro si riserva il diritto di modificare questi termini di servizio in qualsiasi momento. In caso di modifiche sostanziali, notificheremo agli utenti via email o tramite avviso sulla piattaforma.
              </p>
              <p>
                Le modifiche entreranno in vigore:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>30 giorni dopo la notifica per modifiche sostanziali</li>
                <li>Immediatamente per correzioni minori o chiarimenti</li>
                <li>Alla data specificata nell'avviso di modifica</li>
              </ul>
              <p>
                Il continuo utilizzo della piattaforma dopo l'entrata in vigore delle modifiche costituisce accettazione dei nuovi termini.
              </p>
            </div>
          </section>

          <section id="cancellazione-account" className="mb-12">
            <h2 className="text-2xl font-bold text-[#0A1F44] mb-4 border-b-2 border-gray-200 pb-2">
              9. Cancellazione dell'account
            </h2>
            <div className="text-gray-700 leading-relaxed space-y-4">
              <p>
                Gli utenti possono cancellare il proprio account in qualsiasi momento contattandoci direttamente tramite i recapiti forniti nella sezione "Contatti" o utilizzando la funzione di cancellazione nell'area personale.
              </p>
              <p>
                Conseguenze della cancellazione dell'account:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Perdita di accesso a tutte le funzionalità personalizzate</li>
                <li>Cancellazione dei dati personali secondo la normativa applicabile</li>
                <li>Mantenimento di alcuni dati per obblighi legali o contabili</li>
                <li>Cessazione di tutte le notifiche e comunicazioni</li>
              </ul>
              <p>
                Ci riserviamo il diritto di sospendere o cancellare account che violino questi termini di servizio.
              </p>
            </div>
          </section>

          <section id="legge-applicabile" className="mb-12">
            <h2 className="text-2xl font-bold text-[#0A1F44] mb-4 border-b-2 border-gray-200 pb-2">
              10. Legge applicabile
            </h2>
            <div className="text-gray-700 leading-relaxed space-y-4">
              <p>
                Questi termini sono disciplinati e interpretati secondo le leggi dello Stato Italiano. Qualsiasi controversia derivante dall'utilizzo di Concoro sarà soggetta alla giurisdizione esclusiva dei tribunali italiani.
              </p>
              <p>
                In caso di controversie, le parti si impegnano a tentare inizialmente una risoluzione amichevale attraverso:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Comunicazione diretta con il nostro servizio clienti</li>
                <li>Mediazione civile secondo la normativa italiana</li>
                <li>Arbitrato, se concordato tra le parti</li>
              </ul>
            </div>
          </section>

          <section id="contatti" className="mb-12">
            <h2 className="text-2xl font-bold text-[#0A1F44] mb-4 border-b-2 border-gray-200 pb-2">
              11. Contatti
            </h2>
            <div className="text-gray-700 leading-relaxed space-y-4">
              <p>
                Per qualsiasi domanda relativa a questi termini di servizio, contattaci tramite:
              </p>
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="size-5 text-[#0A1F44]" />
                  <div>
                    <p className="font-medium text-[#0A1F44]">Email</p>
                    <a href="mailto:info@concoro.it" className="text-gray-600 hover:text-[#0A1F44] transition-colors">
                      info@concoro.it
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <ExternalLink className="size-5 text-[#0A1F44]" />
                  <div>
                    <p className="font-medium text-[#0A1F44]">Centro assistenza</p>
                    <Link href="/contatti" className="text-gray-600 hover:text-[#0A1F44] transition-colors">
                      Visita la pagina contatti
                    </Link>
                  </div>
                </div>
              </div>
              <div className="border-t pt-4 mt-8">
                <p className="text-sm text-gray-500">
                  Ci impegniamo a rispondere a tutte le richieste entro 48 ore lavorative.
                  Per questioni urgenti relative alla privacy o alla sicurezza, utilizziamo tempi di risposta più rapidi.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Footer CTA */}
        <div className="bg-[#0A1F44] rounded-lg text-white p-8 text-center mt-16">
          <h3 className="text-2xl font-bold mb-4">Hai domande sui nostri termini?</h3>
          <p className="text-blue-100 mb-6">
            Il nostro team legale è disponibile per chiarire qualsiasi dubbio sui termini di servizio.
          </p>
          <Link
            href="/contatti"
            className="inline-block px-6 py-3 bg-white text-[#0A1F44] rounded-md font-medium hover:bg-gray-100 transition-colors"
          >
            Contattaci
          </Link>
        </div>
      </div>

      {/* Footer */}
      <MainFooter />
    </main>
  );
} 