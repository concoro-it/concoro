'use client';

import Link from 'next/link';
import { ChevronLeft, Shield, Mail, ExternalLink, Lock, Eye, UserCheck } from 'lucide-react';
import { MainFooter } from '@/components/ui/main-footer';

export default function PrivacyPolicy() {
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
              <Shield className="size-8 text-[#0A1F44]" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#0A1F44] mb-4">
            Informativa sulla Privacy
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Ultimo aggiornamento: 5 Giugno 2025
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Lock className="size-4" />
            <span>Conforme al GDPR</span>
          </div>
        </div>

        {/* Table of Contents */}
        <div className="bg-gray-50 rounded-lg p-6 mb-12">
          <h2 className="text-lg font-semibold text-[#0A1F44] mb-4">Indice dei contenuti</h2>
          <nav className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <a href="#introduzione" className="text-gray-600 hover:text-[#0A1F44] transition-colors py-1">1. Introduzione</a>
            <a href="#titolare-trattamento" className="text-gray-600 hover:text-[#0A1F44] transition-colors py-1">2. Titolare del trattamento</a>
            <a href="#informazioni-raccolte" className="text-gray-600 hover:text-[#0A1F44] transition-colors py-1">3. Informazioni raccolte</a>
            <a href="#uso-informazioni" className="text-gray-600 hover:text-[#0A1F44] transition-colors py-1">4. Uso delle informazioni</a>
            <a href="#base-giuridica" className="text-gray-600 hover:text-[#0A1F44] transition-colors py-1">5. Base giuridica del trattamento</a>
            <a href="#condivisione-informazioni" className="text-gray-600 hover:text-[#0A1F44] transition-colors py-1">6. Condivisione delle informazioni</a>
            <a href="#cookie-tecnologie" className="text-gray-600 hover:text-[#0A1F44] transition-colors py-1">7. Cookie e tecnologie simili</a>
            <a href="#protezione-dati" className="text-gray-600 hover:text-[#0A1F44] transition-colors py-1">8. Protezione dei dati</a>
            <a href="#conservazione-dati" className="text-gray-600 hover:text-[#0A1F44] transition-colors py-1">9. Conservazione dei dati</a>
            <a href="#diritti-utente" className="text-gray-600 hover:text-[#0A1F44] transition-colors py-1">10. Diritti dell'utente</a>
            <a href="#trasferimenti-internazionali" className="text-gray-600 hover:text-[#0A1F44] transition-colors py-1">11. Trasferimenti internazionali</a>
            <a href="#modifiche-informativa" className="text-gray-600 hover:text-[#0A1F44] transition-colors py-1">12. Modifiche all'informativa</a>
            <a href="#contatti" className="text-gray-600 hover:text-[#0A1F44] transition-colors py-1">13. Contatti</a>
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
                La tua privacy è importante per Concoro. Questa informativa spiega come raccogliamo, utilizziamo e proteggiamo le tue informazioni personali quando utilizzi la nostra piattaforma.
              </p>
              <p>
                Ci impegniamo a rispettare la tua privacy e a proteggere i tuoi dati personali in conformità al Regolamento Generale sulla Protezione dei Dati (GDPR 2016/679) e alla normativa italiana sulla privacy (D.Lgs. 196/2003, come modificato dal D.Lgs. 101/2018).
              </p>
              <div className="bg-blue-50 border-l-4 border-[#0A1F44] p-4 my-4">
                <p className="text-[#0A1F44]">
                  <strong>Importante:</strong> Ti incoraggiamo a leggere attentamente questa informativa e a contattarci per qualsiasi domanda o chiarimento sui tuoi diritti sulla privacy.
                </p>
              </div>
            </div>
          </section>

          <section id="titolare-trattamento" className="mb-12">
            <h2 className="text-2xl font-bold text-[#0A1F44] mb-4 border-b-2 border-gray-200 pb-2">
              2. Titolare del trattamento
            </h2>
            <div className="text-gray-700 leading-relaxed space-y-4">
              <p>
                Il titolare del trattamento dei dati è Concoro, con sede in Italia.
              </p>
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-[#0A1F44] mb-3">Dati del Titolare:</h3>
                <ul className="space-y-2">
                  <li><strong>Denominazione:</strong> Concoro</li>
                  <li><strong>Email:</strong> <a href="mailto:info@concoro.it" className="text-[#0A1F44] hover:underline">info@concoro.it</a></li>
                  <li><strong>Email DPO:</strong> <a href="mailto:privacy@concoro.it" className="text-[#0A1F44] hover:underline">privacy@concoro.it</a></li>
                </ul>
              </div>
            </div>
          </section>

          <section id="informazioni-raccolte" className="mb-12">
            <h2 className="text-2xl font-bold text-[#0A1F44] mb-4 border-b-2 border-gray-200 pb-2">
              3. Informazioni raccolte
            </h2>
            <div className="text-gray-700 leading-relaxed space-y-4">
              <p>
                Concoro raccoglie diversi tipi di informazioni per fornire e migliorare i nostri servizi:
              </p>
              
              <h3 className="text-xl font-semibold text-[#0A1F44] mt-6 mb-3">3.1 Dati forniti direttamente dall'utente</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Nome e cognome</li>
                <li>Indirizzo email</li>
                <li>Preferenze lavorative e professionali</li>
                <li>Informazioni di profilo (titolo di studio, esperienza, settori di interesse)</li>
                <li>Comunicazioni che ci invii</li>
              </ul>

              <h3 className="text-xl font-semibold text-[#0A1F44] mt-6 mb-3">3.2 Dati raccolti automaticamente</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Indirizzo IP e informazioni di geolocalizzazione approssimativa</li>
                <li>Tipo di browser e sistema operativo</li>
                <li>Dati di utilizzo della piattaforma (pagine visitate, tempo di permanenza)</li>
                <li>Informazioni sui dispositivi utilizzati</li>
                <li>Cookie e identificatori simili</li>
              </ul>

              <h3 className="text-xl font-semibold text-[#0A1F44] mt-6 mb-3">3.3 Dati da fonti pubbliche</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Informazioni sui concorsi pubblici da Gazzetta Ufficiale</li>
                <li>Dati da portali istituzionali (inPA, enti pubblici)</li>
                <li>Bandi e avvisi pubblici da fonti ufficiali</li>
              </ul>
            </div>
          </section>

          <section id="uso-informazioni" className="mb-12">
            <h2 className="text-2xl font-bold text-[#0A1F44] mb-4 border-b-2 border-gray-200 pb-2">
              4. Uso delle informazioni
            </h2>
            <div className="text-gray-700 leading-relaxed space-y-4">
              <p>
                Utilizziamo le informazioni personali raccolte per i seguenti scopi:
              </p>
              
              <div className="grid md:grid-cols-2 gap-6 mt-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <UserCheck className="size-5 text-[#0A1F44]" />
                    <h3 className="font-semibold text-[#0A1F44]">Servizi principali</h3>
                  </div>
                  <ul className="text-sm space-y-1">
                    <li>• Fornire accesso alla piattaforma</li>
                    <li>• Personalizzare notifiche sui concorsi</li>
                    <li>• Gestire il tuo account utente</li>
                    <li>• Fornire supporto tecnico</li>
                  </ul>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Eye className="size-5 text-[#0A1F44]" />
                    <h3 className="font-semibold text-[#0A1F44]">Miglioramenti</h3>
                  </div>
                  <ul className="text-sm space-y-1">
                    <li>• Analizzare l'utilizzo della piattaforma</li>
                    <li>• Migliorare i nostri servizi</li>
                    <li>• Sviluppare nuove funzionalità</li>
                    <li>• Prevenire frodi e abusi</li>
                  </ul>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-[#0A1F44] mt-6 mb-3">4.1 Comunicazioni</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Invio di notifiche sui concorsi di tuo interesse</li>
                <li>Comunicazioni di servizio e aggiornamenti importanti</li>
                <li>Risposte alle tue richieste di supporto</li>
                <li>Newsletter e comunicazioni promozionali (solo con il tuo consenso)</li>
              </ul>
            </div>
          </section>

          <section id="base-giuridica" className="mb-12">
            <h2 className="text-2xl font-bold text-[#0A1F44] mb-4 border-b-2 border-gray-200 pb-2">
              5. Base giuridica del trattamento
            </h2>
            <div className="text-gray-700 leading-relaxed space-y-4">
              <p>
                Il trattamento dei tuoi dati personali si basa sulle seguenti basi giuridiche previste dal GDPR:
              </p>
              <div className="space-y-4">
                <div className="border-l-4 border-green-400 pl-4 py-2 bg-green-50">
                  <h4 className="font-semibold text-green-800">Esecuzione del contratto (Art. 6.1.b GDPR)</h4>
                  <p className="text-sm text-green-700">Per fornirti i servizi richiesti e gestire il tuo account</p>
                </div>
                <div className="border-l-4 border-blue-400 pl-4 py-2 bg-blue-50">
                  <h4 className="font-semibold text-blue-800">Consenso (Art. 6.1.a GDPR)</h4>
                  <p className="text-sm text-blue-700">Per comunicazioni promozionali e cookie non essenziali</p>
                </div>
                <div className="border-l-4 border-purple-400 pl-4 py-2 bg-purple-50">
                  <h4 className="font-semibold text-purple-800">Legittimo interesse (Art. 6.1.f GDPR)</h4>
                  <p className="text-sm text-purple-700">Per migliorare i servizi e prevenire frodi</p>
                </div>
                <div className="border-l-4 border-orange-400 pl-4 py-2 bg-orange-50">
                  <h4 className="font-semibold text-orange-800">Obbligo legale (Art. 6.1.c GDPR)</h4>
                  <p className="text-sm text-orange-700">Per adempiere a obblighi di legge</p>
                </div>
              </div>
            </div>
          </section>

          <section id="condivisione-informazioni" className="mb-12">
            <h2 className="text-2xl font-bold text-[#0A1F44] mb-4 border-b-2 border-gray-200 pb-2">
              6. Condivisione delle informazioni
            </h2>
            <div className="text-gray-700 leading-relaxed space-y-4">
              <p>
                Non condividiamo le tue informazioni personali con terze parti, salvo nei seguenti casi limitati:
              </p>
              
              <h3 className="text-xl font-semibold text-[#0A1F44] mt-6 mb-3">6.1 Fornitori di servizi</h3>
              <p>
                Condividiamo dati con fornitori che ci aiutano a erogare i servizi:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provider di hosting e infrastruttura cloud</li>
                <li>Servizi di email e comunicazione</li>
                <li>Strumenti di analisi (solo con il tuo consenso)</li>
                <li>Fornitori di servizi di pagamento (se applicabile)</li>
              </ul>

              <h3 className="text-xl font-semibold text-[#0A1F44] mt-6 mb-3">6.2 Obblighi legali</h3>
              <p>
                Possiamo divulgare le tue informazioni quando richiesto dalla legge per:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Rispondere a procedimenti legali</li>
                <li>Proteggere i diritti e la sicurezza di Concoro e degli utenti</li>
                <li>Prevenire frodi o attività illegali</li>
                <li>Adempiere a obblighi normativi</li>
              </ul>

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-4">
                <p className="text-yellow-800">
                  <strong>Garanzia:</strong> Tutti i fornitori di servizi sono vincolati da contratti che garantiscono la protezione dei tuoi dati e limitano l'uso delle informazioni ai soli scopi concordati.
                </p>
              </div>
            </div>
          </section>

          <section id="cookie-tecnologie" className="mb-12">
            <h2 className="text-2xl font-bold text-[#0A1F44] mb-4 border-b-2 border-gray-200 pb-2">
              7. Cookie e tecnologie simili
            </h2>
            <div className="text-gray-700 leading-relaxed space-y-4">
              <p>
                Concoro utilizza cookie e tecnologie simili per migliorare l'esperienza degli utenti, analizzare l'utilizzo della piattaforma e offrire funzionalità personalizzate.
              </p>

              <h3 className="text-xl font-semibold text-[#0A1F44] mt-6 mb-3">7.1 Tipi di cookie utilizzati</h3>
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-[#0A1F44] mb-2">Cookie essenziali</h4>
                  <p className="text-sm">Necessari per il funzionamento della piattaforma (autenticazione, sicurezza)</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-[#0A1F44] mb-2">Cookie di preferenze</h4>
                  <p className="text-sm">Memorizzano le tue impostazioni e preferenze</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-[#0A1F44] mb-2">Cookie analitici</h4>
                  <p className="text-sm">Ci aiutano a capire come utilizzi la piattaforma (solo con consenso)</p>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-[#0A1F44] mt-6 mb-3">7.2 Gestione dei cookie</h3>
              <p>
                Puoi gestire le tue preferenze sui cookie:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Attraverso il banner di consenso che appare alla prima visita</li>
                <li>Nelle impostazioni del tuo browser</li>
                <li>Contattandoci per modificare le tue preferenze</li>
              </ul>
            </div>
          </section>

          <section id="protezione-dati" className="mb-12">
            <h2 className="text-2xl font-bold text-[#0A1F44] mb-4 border-b-2 border-gray-200 pb-2">
              8. Protezione dei dati
            </h2>
            <div className="text-gray-700 leading-relaxed space-y-4">
              <p>
                Concoro utilizza misure di sicurezza tecniche e organizzative per proteggere le tue informazioni personali da accessi non autorizzati, alterazioni o distruzioni.
              </p>

              <h3 className="text-xl font-semibold text-[#0A1F44] mt-6 mb-3">8.1 Misure tecniche</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Crittografia dei dati in transito (HTTPS/TLS)</li>
                  <li>Crittografia dei dati sensibili a riposo</li>
                  <li>Sistemi di autenticazione sicuri</li>
                  <li>Firewall e sistemi di monitoraggio</li>
                </ul>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Backup regolari e sicuri</li>
                  <li>Controlli di accesso basati su ruoli</li>
                  <li>Logging e auditing delle attività</li>
                  <li>Aggiornamenti di sicurezza regolari</li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold text-[#0A1F44] mt-6 mb-3">8.2 Misure organizzative</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Formazione del personale sulla privacy</li>
                <li>Procedure per la gestione degli incidenti</li>
                <li>Valutazioni d'impatto sulla protezione dei dati</li>
                <li>Contratti di riservatezza con fornitori</li>
              </ul>
            </div>
          </section>

          <section id="conservazione-dati" className="mb-12">
            <h2 className="text-2xl font-bold text-[#0A1F44] mb-4 border-b-2 border-gray-200 pb-2">
              9. Conservazione dei dati
            </h2>
            <div className="text-gray-700 leading-relaxed space-y-4">
              <p>
                Conserviamo i tuoi dati personali solo per il tempo necessario agli scopi per cui sono stati raccolti:
              </p>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-[#0A1F44] mb-4">Periodi di conservazione:</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-medium">Dati dell'account attivo</span>
                    <span className="text-gray-600">Per tutta la durata del servizio</span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-medium">Dati dell'account cancellato</span>
                    <span className="text-gray-600">30 giorni (salvo obblighi legali)</span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-medium">Dati di utilizzo e analytics</span>
                    <span className="text-gray-600">24 mesi</span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-medium">Log di sicurezza</span>
                    <span className="text-gray-600">12 mesi</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Comunicazioni di supporto</span>
                    <span className="text-gray-600">3 anni</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="diritti-utente" className="mb-12">
            <h2 className="text-2xl font-bold text-[#0A1F44] mb-4 border-b-2 border-gray-200 pb-2">
              10. Diritti dell'utente
            </h2>
            <div className="text-gray-700 leading-relaxed space-y-4">
              <p>
                In conformità al GDPR, hai diversi diritti riguardo ai tuoi dati personali:
              </p>

              <div className="grid md:grid-cols-2 gap-6 mt-6">
                <div className="space-y-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-semibold text-[#0A1F44] mb-2">🔍 Diritto di accesso</h4>
                    <p className="text-sm">Ottenere informazioni sui dati che trattiamo</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="font-semibold text-[#0A1F44] mb-2">✏️ Diritto di rettifica</h4>
                    <p className="text-sm">Correggere dati inesatti o incompleti</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4">
                    <h4 className="font-semibold text-[#0A1F44] mb-2">🗑️ Diritto alla cancellazione</h4>
                    <p className="text-sm">Richiedere la rimozione dei tuoi dati</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <h4 className="font-semibold text-[#0A1F44] mb-2">⏸️ Diritto di limitazione</h4>
                    <p className="text-sm">Limitare il trattamento dei tuoi dati</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <h4 className="font-semibold text-[#0A1F44] mb-2">📦 Diritto alla portabilità</h4>
                    <p className="text-sm">Ricevere i tuoi dati in formato strutturato</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4">
                    <h4 className="font-semibold text-[#0A1F44] mb-2">✋ Diritto di opposizione</h4>
                    <p className="text-sm">Opporti al trattamento per marketing</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#0A1F44] text-white rounded-lg p-6 mt-6">
                <h3 className="font-semibold mb-3">Come esercitare i tuoi diritti</h3>
                <p className="text-sm mb-3">
                  Per esercitare questi diritti, puoi contattarci tramite email all'indirizzo{' '}
                  <a href="mailto:privacy@concoro.it" className="text-blue-200 hover:underline">
                    privacy@concoro.it
                  </a>
                </p>
                <p className="text-sm">
                  Risponderemo alla tua richiesta entro 30 giorni e, se necessario, potremo richiedere documenti per verificare la tua identità.
                </p>
              </div>
            </div>
          </section>

          <section id="trasferimenti-internazionali" className="mb-12">
            <h2 className="text-2xl font-bold text-[#0A1F44] mb-4 border-b-2 border-gray-200 pb-2">
              11. Trasferimenti internazionali
            </h2>
            <div className="text-gray-700 leading-relaxed space-y-4">
              <p>
                I tuoi dati sono principalmente trattati all'interno dell'Unione Europea. In alcuni casi limitati, potremmo trasferire dati verso paesi terzi, sempre garantendo adeguate misure di protezione.
              </p>
              <p>
                Quando effettuiamo trasferimenti internazionali, utilizziamo:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Decisioni di adeguatezza della Commissione Europea</li>
                <li>Clausole contrattuali standard approvate dalla Commissione</li>
                <li>Certificazioni e codici di condotta riconosciuti</li>
                <li>Misure tecniche supplementari quando necessario</li>
              </ul>
            </div>
          </section>

          <section id="modifiche-informativa" className="mb-12">
            <h2 className="text-2xl font-bold text-[#0A1F44] mb-4 border-b-2 border-gray-200 pb-2">
              12. Modifiche all'informativa
            </h2>
            <div className="text-gray-700 leading-relaxed space-y-4">
              <p>
                Concoro può aggiornare periodicamente questa informativa sulla privacy per riflettere cambiamenti nei nostri servizi o nella normativa applicabile.
              </p>
              <p>
                In caso di modifiche significative:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Ti notificheremo via email</li>
                <li>Pubblicheremo un avviso sulla piattaforma</li>
                <li>Aggiorneremo la data di "ultimo aggiornamento"</li>
                <li>Potremmo richiedere un nuovo consenso se necessario</li>
              </ul>
              <p>
                Ti incoraggiamo a consultare periodicamente questa pagina per rimanere informato su come proteggiamo i tuoi dati.
              </p>
            </div>
          </section>

          <section id="contatti" className="mb-12">
            <h2 className="text-2xl font-bold text-[#0A1F44] mb-4 border-b-2 border-gray-200 pb-2">
              13. Contatti
            </h2>
            <div className="text-gray-700 leading-relaxed space-y-4">
              <p>
                Per domande o richieste relative alla privacy e ai tuoi dati personali, puoi contattarci tramite:
              </p>
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="size-5 text-[#0A1F44]" />
                  <div>
                    <p className="font-medium text-[#0A1F44]">Email generale</p>
                    <a href="mailto:info@concoro.it" className="text-gray-600 hover:text-[#0A1F44] transition-colors">
                      info@concoro.it
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="size-5 text-[#0A1F44]" />
                  <div>
                    <p className="font-medium text-[#0A1F44]">Data Protection Officer</p>
                    <a href="mailto:privacy@concoro.it" className="text-gray-600 hover:text-[#0A1F44] transition-colors">
                      privacy@concoro.it
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
                <h3 className="font-semibold text-[#0A1F44] mb-2">Autorità di controllo</h3>
                <p className="text-sm text-gray-500">
                  Hai il diritto di presentare reclamo al Garante per la protezione dei dati personali se ritieni che il trattamento dei tuoi dati violi la normativa sulla privacy.
                </p>
                <a 
                  href="https://www.garanteprivacy.it" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-[#0A1F44] hover:underline"
                >
                  www.garanteprivacy.it
                </a>
              </div>
            </div>
          </section>
        </div>

        {/* Footer CTA */}
        <div className="bg-[#0A1F44] rounded-lg text-white p-8 text-center mt-16">
          <h3 className="text-2xl font-bold mb-4">Hai domande sulla privacy?</h3>
          <p className="text-blue-100 mb-6">
            Il nostro team è disponibile per rispondere a qualsiasi domanda sui tuoi dati e sulla privacy.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contatti"
              className="inline-block px-6 py-3 bg-white text-[#0A1F44] rounded-md font-medium hover:bg-gray-100 transition-colors"
            >
              Contattaci
            </Link>
            <Link
              href="/termini-di-servizio"
              className="inline-block px-6 py-3 border border-white/30 text-white rounded-md font-medium hover:bg-white/10 transition-colors"
            >
              Termini di servizio
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <MainFooter />
    </main>
  );
} 