/**
 * Italian Capitalization Utility
 * 
 * Converts text to proper Italian sentence case following Italian grammar rules:
 * 1. First word of a sentence (including after punctuation marks)
 * 2. Proper nouns (people, places, geographical areas, institutions, brands)
 * 3. Always lowercase: days, months, languages, general words in titles
 */

export function toItalianSentenceCase(str: string): string {
  if (!str) return '';
  
  // Clean the string first
  const cleanStr = str.trim();
  if (!cleanStr) return '';
  
  // Convert to lowercase first
  let result = cleanStr.toLowerCase();
  
  // Capitalize first letter of sentence and after punctuation
  result = result.replace(/(^\w|[.!?]\s+\w|:\s+\w)/g, letter => letter.toUpperCase());
  
  // Proper nouns that should always be capitalized
  const properNouns = [
    // Countries and regions
    'Italia', 'Europa', 'Unione Europea', 'Lombardia', 'Veneto', 'Piemonte', 'Lazio', 'Campania', 
    'Sicilia', 'Sardegna', 'Puglia', 'Calabria', 'Basilicata', 'Molise', 'Abruzzo', 'Marche', 
    'Umbria', 'Toscana', 'Emilia-Romagna', 'Emilia Romagna', 'Liguria', 'Friuli-Venezia Giulia', 
    'Friuli Venezia Giulia', 'Trentino-Alto Adige', 'Trentino Alto Adige', 'Valle d\'Aosta',
    
    // Cities (common ones)
    'Roma', 'Milano', 'Napoli', 'Torino', 'Palermo', 'Genova', 'Bologna', 'Firenze', 'Bari', 
    'Catania', 'Venezia', 'Verona', 'Messina', 'Padova', 'Trieste', 'Brescia', 'Taranto', 
    'Prato', 'Parma', 'Modena', 'Reggio Calabria', 'Reggio Emilia', 'Perugia', 'Livorno',
    'Cagliari', 'Foggia', 'Rimini', 'Salerno', 'Ferrara', 'Sassari', 'Latina', 'Giugliano',
    'Monza', 'Siracusa', 'Pescara', 'Bergamo', 'Forlì', 'Trento', 'Vicenza', 'Terni',
    'Bolzano', 'Novara', 'Piacenza', 'Ancona', 'Andria', 'Arezzo', 'Udine', 'Cesena',
    'Lecce', 'Pesaro', 'Barletta', 'Alessandria', 'La Spezia', 'Pistoia', 'Catanzaro',
    'Brindisi', 'Treviso', 'Pisa', 'Caserta', 'Marsala', 'Varese', 'Monza', 'Ravenna',
    'Como', 'Lucca', 'Isernia', 'Grosseto', 'Viterbo', 'Ragusa', 'Cremona', 'Caltanissetta',
    'Trapani', 'Vercelli', 'Asti', 'Cosenza', 'Matera', 'Agrigento', 'Massa', 'Carrara',
    'Cuneo', 'Benevento', 'Potenza', 'Avellino', 'Gorizia', 'Pordenone', 'Imperia',
    'Fermo', 'Ascoli Piceno', 'Rieti', 'Frosinone', 'Chieti', 'Teramo', 'L\'Aquila',
    'Campobasso', 'Enna', 'Crotone', 'Vibo Valentia', 'Biella', 'Verbania', 'Belluno',
    'Sondrio', 'Rovigo', 'Mantova', 'Cremona', 'Lodi', 'Pavia', 'Savona', 'Aosta',
    'Vimodrone', 'Usrcalabria',
    
    // Institutions and organizations
    'Ministero', 'Regione', 'Provincia', 'Comune', 'Università', 'Politecnico', 'Istituto',
    'Agenzia', 'Ufficio', 'Dipartimento', 'Direzione', 'Servizio', 'Settore', 'Unità',
    'Commissione', 'Consiglio', 'Giunta', 'Assemblea', 'Parlamento', 'Senato', 'Camera',
    'Corte', 'Tribunale', 'Procura', 'Questura', 'Prefettura', 'Soprintendenza',
    'Usr', 'Ddg', 'Dpr', 'Dlgs', 'Gazzetta Ufficiale',
    
    // Educational titles and degrees
    'Laurea', 'Master', 'Dottorato', 'Diploma', 'Certificato', 'Attestato', 'Abilitazione',
    'Specializzazione', 'Perfezionamento', 'Corso', 'Scuola', 'Liceo', 'Istituto Tecnico',
    'Istituto Professionale',
    
    // Languages (when referring to the language itself as a subject)
    'Italiano', 'Inglese', 'Francese', 'Tedesco', 'Spagnolo', 'Portoghese', 'Russo',
    'Cinese', 'Giapponese', 'Arabo', 'Latino', 'Greco',
    
    // Legal and administrative terms
    'Codice', 'Legge', 'Decreto', 'Regolamento', 'Ordinanza', 'Circolare', 'Direttiva',
    'Bando', 'Avviso', 'Concorso', 'Selezione', 'Graduatoria', 'Mobilità', 'Trasferimento',
    'Art.', 'Articolo', 'Comma', 'Lettera', 'Allegato', 'Tabella'
  ];
  
  // Apply proper noun capitalization
  properNouns.forEach(noun => {
    const regex = new RegExp(`\\b${noun.toLowerCase()}\\b`, 'gi');
    result = result.replace(regex, noun);
  });
  
  // Handle special multi-word region patterns that might have different spacing
  const regionPatterns = [
    { pattern: /\bfriuli[\s-]*venezia[\s-]*giulia\b/gi, replacement: 'Friuli Venezia Giulia' },
    { pattern: /\bemilia[\s-]*romagna\b/gi, replacement: 'Emilia Romagna' },
    { pattern: /\btrentino[\s-]*alto[\s-]*adige\b/gi, replacement: 'Trentino Alto Adige' },
    { pattern: /\bvalle[\s-]*d['\']*aosta\b/gi, replacement: 'Valle d\'Aosta' }
  ];
  
  regionPatterns.forEach(({ pattern, replacement }) => {
    result = result.replace(pattern, replacement);
  });
  
  // Handle specific patterns for Italian administrative texts
  
  // Capitalize abbreviations like "art.", "n.", "ddg", etc. when they appear with numbers
  result = result.replace(/\bart\.\s*(\d+)/gi, 'art. $1');
  result = result.replace(/\bn\.\s*(\d+)/gi, 'n. $1');
  result = result.replace(/\bddg\s*(\d+)/gi, 'ddg $1');
  result = result.replace(/\bd\.lgs\.?\s*(\d+)/gi, 'D.lgs $1');
  result = result.replace(/\bd\.p\.r\.?\s*(\d+)/gi, 'D.p.r. $1');
  
  // Handle "Comune di [City]" pattern - capitalize the city name after "di"
  result = result.replace(/\bcomune\s+di\s+([a-zàéèìîòóùú][a-zàéèìîòóùú\s]*)/gi, (match, cityName) => {
    const capitalizedCity = cityName.trim().charAt(0).toUpperCase() + cityName.trim().slice(1).toLowerCase();
    return `Comune di ${capitalizedCity}`;
  });
  
  // Keep certain words lowercase (prepositions, articles, conjunctions)
  const lowercaseWords = [
    'da', 'in', 'con', 'su', 'per', 'tra', 'fra', 'a', 'ad', 'del', 'della', 'dei', 
    'delle', 'dello', 'degli', 'dal', 'dalla', 'dai', 'dalle', 'dallo', 'dagli', 'nel', 
    'nella', 'nei', 'nelle', 'nello', 'negli', 'sul', 'sulla', 'sui', 'sulle', 'sullo', 
    'sugli', 'col', 'coi', 'al', 'alla', 'ai', 'alle', 'allo', 'agli', 'il', 'la', 'lo', 
    'gli', 'le', 'un', 'una', 'uno', 'e', 'ed', 'o', 'od', 'ma', 'però', 'tuttavia', 
    'quindi', 'dunque', 'perciò', 'infatti', 'inoltre', 'anche', 'pure', 'ancora', 'già', 
    'sempre', 'mai', 'più', 'meno', 'molto', 'poco', 'tanto', 'quanto', 'come', 'quando', 
    'dove', 'mentre', 'durante', 'prima', 'dopo', 'sopra', 'sotto', 'dentro', 'fuori', 
    'davanti', 'dietro', 'accanto', 'vicino', 'lontano', 'insieme', 'senza', 'contro', 
    'verso', 'presso', 'secondo', 'mediante', 'attraverso', 'oltre', 'entro', 'circa',
    'tempo', 'pieno', 'indeterminato', 'determinato', 'part-time', 'full-time', 'area',
    'istruttore', 'istruttori', 'amministrativo', 'amministrativa', 'amministrativi',
    'amministrative', 'tecnico', 'tecnica', 'tecnici', 'tecniche', 'specialistico',
    'specialistica', 'specialistici', 'specialistiche', 'volontaria', 'volontario',
    'esterna', 'esterno', 'interna', 'interno', 'per', 'con', 'rapporto', 'lavoro',
    'assunzione', 'accesso', 'ruoli', 'personale', 'docente', 'scuola', 'secondaria',
    'primo', 'secondo', 'grado', 'convocazione', 'scelta', 'traccia', 'lezione',
    'simulata', 'prova', 'orale', 'scritta', 'pubblicazione', 'graduatoria', 'merito',
    'titoli', 'esami', 'mobilità'
  ];
  
  // Apply lowercase to specific words (but not at the beginning of sentences)
  // Also exclude words that come after "Comune" to avoid affecting "Comune di [City]"
  lowercaseWords.forEach(word => {
    // Don't lowercase if it's at the beginning of a sentence, after punctuation, or after "Comune"
    const regex = new RegExp(`(?<!^|[.!?]\\s+|comune\\s+)\\b${word}\\b`, 'gi');
    result = result.replace(regex, word.toLowerCase());
  });
  
  // Special handling for "di" - keep lowercase except after "Comune"
  result = result.replace(/(?<!^|[.!?]\s+|comune\s+)\bdi\b/gi, 'di');
  
  // Handle months and days (always lowercase unless at start of sentence)
  const monthsAndDays = [
    'gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
    'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre',
    'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato', 'domenica'
  ];
  
  monthsAndDays.forEach(word => {
    const regex = new RegExp(`(?<!^|[.!?]\\s+)\\b${word}\\b`, 'gi');
    result = result.replace(regex, word.toLowerCase());
  });
  
  return result;
}

// Alias for backward compatibility
export const toSentenceCase = toItalianSentenceCase; 