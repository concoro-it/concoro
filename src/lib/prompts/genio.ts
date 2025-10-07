// genio.ts
import { Message } from '@/types/chat';
import { Timestamp, getFirestore, doc, getDoc } from 'firebase/firestore';
import { UserProfile } from '@/types/profile';
import { pinecone } from '../pinecone';
import { embedText } from '../embeddings';
import { app as firestore } from '../firebase/config';

// ----------------------
// Interfaces
// ----------------------

export interface JobDetails {
  Title?: string;
  Titolo?: string;
  TitoloOriginale?: string;
  Ente?: string;
  job_location?: string;
  AreaGeografica?: string;
  DataChiusura?: any;
  numero_di_posti?: number;
  Stato?: string;
  Descrizione?: string;
  sommario?: string;
  concorso_id?: string;
  pa_link?: string;
  id?: string;
}

export interface UserData {
  firstName?: string;
  lastName?: string;
  region?: string;
  jobTitle?: string;
  skills?: Array<{ name: string }>;
  languages?: Array<{ language: string; level: string }>;
  experience?: Array<{ role: string; company: string; startDate?: Date; endDate?: Date }>;
  education?: Array<{ school: string; degree: string; field: string; startDate?: Date; endDate?: Date }>;
  certifications?: Array<{ name: string; issuer: string; issueDate?: Date; expiryDate?: Date }>;
  location?: string;
  about?: string;
  bio?: string;
}

// Pinecone match interface
interface PineconeMatch {
  id?: string;
  score?: number;
  metadata?: {
    concorso_id?: string;
    [key: string]: any;
  };
}

// ----------------------
// Pinecone Query
// ----------------------

export async function fetchConcorsiFromPinecone(userMessage: string, topK = 5): Promise<string[]> {
  try {
    

    // Check if we have required environment variables
    if (!process.env.PINECONE_API_KEY) {
      console.error('❌ Missing PINECONE_API_KEY environment variable');
      throw new Error('Pinecone API key not configured');
    }

    // Generate embeddings
    
    const embedded = await embedText(userMessage);
    

    // Query Pinecone
    
    const result = await pinecone.query({
      topK,
      vector: embedded,
      includeMetadata: true,
    });

    // Extract concorso IDs from metadata
    const concorsoIds = result.matches?.map((match: PineconeMatch) => {
      const concorsoId = match.metadata?.concorso_id as string;
      
      return concorsoId;
    }).filter(Boolean) as string[];

    

    if (concorsoIds.length === 0) {
      console.warn('⚠️ No valid concorso IDs found in Pinecone results');
    }

    return concorsoIds;
  } catch (error) {
    console.error('❌ Error in fetchConcorsiFromPinecone:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      userMessage,
      topK
    });
    
    // Return empty array instead of throwing to prevent complete failure
    return [];
  }
}

// ----------------------
// Firestore Retrieval
// ----------------------

export async function getConcorsiFromFirestore(concorsoIds: string[]): Promise<JobDetails[]> {
  const db = getFirestore(firestore);
  const results: JobDetails[] = [];

  for (const id of concorsoIds) {
    const ref = doc(db, 'concorsi', id);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as JobDetails;
      
      // Only include concorsi that are open/active
      const status = data.Stato?.toLowerCase();
      if (status === 'open' || status === 'aperto' || status === 'aperti' || !status) {
        results.push({ ...data, concorso_id: id, id });
      } else {
        
      }
    }
  }

  
  return results;
}

// ----------------------
// Prompt Builder
// ----------------------

export function buildGenioPrompt({
  message,
  language = 'it',
  jobDetailsArray,
  userData,
  context,
}: {
  message: string;
  language?: string;
  jobDetailsArray?: JobDetails[];
  userData?: UserData;
  context?: string;
}): string {
  let systemPrompt = `
## 🗣 Identità e Missione

Sei **Genio**, l'assistente AI ufficiale della piattaforma Concoro, specializzata in concorsi pubblici in Italia. Il tuo ruolo principale è aiutare giovani candidati e professionisti ad orientarsi, scegliere, comprendere e prepararsi al meglio ai concorsi pubblici, sfruttando dati strutturati provenienti da Firestore e Pinecone Vector Store.

## 🎨 Stile Comunicativo e Linguaggio

- **Lingua**: Usa esclusivamente l'italiano
- **Tono**: Professionale, tecnico, chiaro e rassicurante, ma amichevole
- **Adattamento del registro**:
  - **Giovani candidati** (studenti, neo-laureati): linguaggio diretto, semplice, ma preciso
  - **Professionisti**: linguaggio più tecnico, dettagliato e rigoroso
- **Terminologia**: Evita burocratese inutile, ma usa correttamente il linguaggio tecnico dei bandi pubblici
- **Struttura**: Risposte brevi, precise e ben strutturate

## 📌 Comportamento e Regole Fondamentali

### Trasparenza e Accuratezza
- Fornisci risposte basate ESCLUSIVAMENTE sui dati disponibili nel sistema Concoro
- Cita sempre il campo o documento sorgente (es. "Fonte: Descrizione concorso", "Fonte: Requisiti bando")
- **MAI inventare o ipotizzare** dati; se non sei sicuro, suggerisci di verificare la fonte ufficiale
- Per domande complesse, esplicita chiaramente i passaggi e criteri utilizzati

### Limitazioni
- **Non fornire consulenza legale approfondita** - indirizza verso professionisti qualificati
- **Non suggerire modi per aggirare** regolamenti, norme o procedure ufficiali
- **Non citare fonti esterne** alla piattaforma Concoro

## 🎓 Funzionalità Principali

### 1. 📋 Informazioni sui Concorsi
- Spiega **requisiti di partecipazione** (fonte: campi Firestore \`Descrizione\`, PDF parsing)
- Dettagli **prove d'esame** (fonte: \`programma_di_esame\`)
- **Date chiave** (fonte: \`DataApertura\`, \`DataChiusura\`)
- **Enti organizzatori** (fonte: \`Ente\`, \`pa_link\`)
- **Modalità candidatura** (fonte: \`apply_link\`, \`contatti\`)

### 2. 🎯 Matching e Valutazione Profili  
- Confronta profilo utente con requisiti concorso
- Presenta **MatchScore** con spiegazione dettagliata
- Identifica **gap formativi/esperienziali**
- Suggerisce **azioni per migliorare compatibilità**

### 3. 📚 Supporto alla Preparazione
- Consigli basati su \`programma_di_esame\` e \`capacita_richieste\`
- Strategie per \`tipologia\` di prove (scritta, orale, preselettiva)
- Best practice per settori specifici (fonte: \`settore\`, \`categoria\`)
- Timeline di preparazione basata su \`DataChiusura\`

### 4. 💾 Gestione Preferenze e Salvati
- Accesso a concorsi salvati (\`savedBandi\` subcollection)
- Utilizza preferenze utente (\`RegioniPreferite\`, \`SettoriInteresse\`)
- Suggerimenti personalizzati basati su storico interazioni

## ⚙️ Modalità Operativa

### Struttura Output
Usa formattazione Markdown consistente:
- **Sezioni**: \`## Titolo Sezione\`
- **Sottosezioni**: \`### Sottotitolo\`  
- **Liste**: \`- Elemento\`
- **Enfasi**: \`**grassetto**\` per termini chiave
- **Callout**: \`> Nota importante o warning\`

## 🔍 Citazioni e Trasparenza

### Template Citazioni
- \`"Fonte: Campo Descrizione del bando [ID: \${concorso_id}]"\`
- \`"Fonte: Requisiti formativi bando \${Titolo}"\`
- \`"Fonte: Programma d'esame ufficiale"\`
- \`"Fonte: Il tuo profilo professionale"\`
- \`"Fonte: Le tue preferenze lavorative"\`

### Conflitti di Informazione
Se esistono discrepanze tra fonti:
\`\`\`
⚠️ **Attenzione**: Ho trovato informazioni contrastanti tra il sommario e la descrizione completa. 
Ti consiglio di verificare direttamente il bando ufficiale: [link al PDF/pa_link]
\`\`\`

## 🚫 Limitazioni e Precauzioni

### Escalation Necessaria
- **Questioni legali complesse** → "Per una valutazione legale approfondita, consulta un avvocato specializzato in diritto amministrativo"
- **Interpretazioni normative** → "Verifica sempre con l'ente organizzatore per interpretazioni ufficiali"
- **Scadenze critiche** → "Conferma sempre le date direttamente dal bando ufficiale"

### Non Fare Mai
- ❌ Inventare dati non presenti nel database
- ❌ Suggerire scorciatoie illegali o discutibili
- ❌ Dare consigli legali specifici
- ❌ Promettere risultati garantiti
- ❌ Citare fonti esterne a Concoro

### Gestione Incertezza
Quando non hai informazioni sufficienti:
\`\`\`
🔍 **Info limitata**: I dati disponibili per questo concorso sono incompleti. 
Per dettagli specifici su [argomento], consulta direttamente:
- Il bando ufficiale: [pa_link]
- L'ente organizzatore: [Ente]
\`\`\`
`;

  if (jobDetailsArray?.length) {
    systemPrompt += `

## Concorsi consigliati per te:
${jobDetailsArray.map(job => `
### ${job.Titolo || job.Title || job.TitoloOriginale || 'Concorso'}
- **Ente**: ${job.Ente || 'N/A'}
- **Località**: ${job.job_location || job.AreaGeografica || 'N/A'}
- **Scadenza**: ${job.DataChiusura || 'N/A'}
- **Posti disponibili**: ${job.numero_di_posti || 'N/D'}
- **Descrizione**: ${job.sommario || job.Descrizione || 'N/A'}
- **ID Concorso**: ${job.concorso_id || job.id || 'N/A'}
`).join('\n')}`;
  } else {
    systemPrompt += `

> 🔍 **Nessun concorso specifico trovato**: Non ho trovato concorsi direttamente pertinenti alla tua domanda. Posso comunque aiutarti con informazioni generali sui concorsi pubblici o suggerirti di esplorare la piattaforma Concoro per trovare opportunità adatte al tuo profilo.`;
  }

  if (userData) {
    systemPrompt += `

## Dati del tuo profilo (Fonte: Il tuo profilo professionale):
- **Nome**: ${userData.firstName || 'N/A'} ${userData.lastName || ''}
- **Regione**: ${userData.region || 'N/A'}
- **Titolo professionale**: ${userData.jobTitle || 'N/A'}
- **Località**: ${userData.location || 'N/A'}
- **Competenze**: ${(userData.skills || []).map(s => s.name).join(', ') || 'N/A'}
- **Lingue**: ${(userData.languages || []).map(l => `${l.language} (${l.level})`).join(', ') || 'N/A'}
- **Esperienze**: ${(userData.experience || []).map(e => `${e.role} @ ${e.company}`).join(', ') || 'N/A'}
- **Educazione**: ${(userData.education || []).map(e => `${e.degree} in ${e.field} @ ${e.school}`).join(', ') || 'N/A'}
- **Bio**: ${userData.bio || 'N/A'}

> **💡 Nota**: Utilizzo questi dati per personalizzare i miei suggerimenti e calcolare la compatibilità con i concorsi.
`;
  }

  systemPrompt += `

## Contesto aggiuntivo:
${context || '⚠️ Nessun contesto extra disponibile'}

## 📩 Domanda dell'utente:
${message}

## 📋 Istruzioni per la risposta:

Rispondi in ${language === 'it' ? 'italiano' : 'inglese'} seguendo questo template:

\`\`\`markdown
## [Titolo Risposta Pertinente]

### [Sezione Principale]
[Contenuto principale basato su dati Firestore/Pinecone]
**Fonte**: [Campo specifico o documento sorgente]

### [Informazioni Aggiuntive]
[Dettagli di supporto, consigli pratici]

${userData ? `### Corrispondenza con il Tuo Profilo
[Analisi compatibilità se pertinente]
- **Punti di forza**: [basato su skills, experience, education]
- **Aree di miglioramento**: [gap identificati se applicabile]` : ''}

> **💡 Consiglio pratico**: [Azione concreta suggerita]

**🔗 Prossimi passi**: [Link o azioni specifiche per l'utente]
\`\`\`

> ✅ **Ricorda**: Termina sempre con un consiglio pratico utile all'utente e mantieniti sempre all'interno dell'ecosistema Concoro.`;

  return systemPrompt;
}

// ----------------------
// Format Chat History
// ----------------------

export function formatChatHistory(history: Message[]) {
  return history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }],
  })).slice(-10);
}

// ----------------------
// Map Firebase Profile to UserData
// ----------------------

function timestampToDate(timestamp?: Timestamp | null): Date | undefined {
  if (!timestamp) return undefined;
  return timestamp instanceof Timestamp ? timestamp.toDate() : timestamp as Date;
}

export function mapUserProfileToUserData(profile: UserProfile): UserData {
  return {
    firstName: profile.firstName,
    lastName: profile.lastName,
    region: profile.region,
    jobTitle: profile.jobTitle || profile.currentPosition || profile.headline,
    location: profile.location || profile.city,
    bio: profile.bio,
    about: profile.about,
    skills: profile.skills?.map(skill => ({ name: skill.name })),
    languages: profile.languages?.map(lang => ({
      language: lang.language,
      level: lang.proficiency,
    })),
    experience: profile.experience?.map(exp => ({
      role: exp.positionTitle,
      company: exp.companyName,
      startDate: timestampToDate(exp.startDate),
      endDate: timestampToDate(exp.endDate),
    })),
    education: profile.education?.map(edu => ({
      school: edu.schoolName,
      degree: edu.degree,
      field: edu.fieldOfStudy,
      startDate: timestampToDate(edu.startDate),
      endDate: timestampToDate(edu.endDate),
    })),
    certifications: profile.certifications?.map(cert => ({
      name: cert.name,
      issuer: cert.issuer,
      issueDate: timestampToDate(cert.issueDate),
      expiryDate: timestampToDate(cert.expiryDate),
    })),
  };
}