import { Timestamp } from 'firebase/firestore';

export interface Concorso {
  id: string;
  AreaGeografica?: string;
  province?: Array<{
    regione_nome: string;
    provincia_nome?: string;
  }>;
  DataApertura?: string | { seconds: number; nanoseconds: number };
  DataChiusura?: string | { seconds: number; nanoseconds: number };
  Descrizione?: string;
  Ente?: string;
  Link?: string;
  Stato?: string;
  Titolo?: string;
  titolo_breve?: string;
  Valutazione?: string;
  ambito_lavorativo?: string;
  apply_link?: string;
  capacita_richieste?: string | string[];
  categoria?: string;
  area_categoria?: string;
  collocazione_organizzativa?: string;
  concorso_id?: string;
  conoscenze_tecnico_specialistiche?: string | string[];
  contatti?: string;
  numero_di_posti?: number;
  pa_link?: string;
  pdf_links?: string[];
  programma_di_esame?: string | string[];
  publication_date?: string | { seconds: number; nanoseconds: number };
  regime?: string;
  regime_impegno?: string;
  settore?: string;
  settore_professionale?: string;
  sommario?: string;
  riassunto?: string;
  tipologia?: string;
  titolo_originale?: string;
  createdAt?: { seconds: number; nanoseconds: number };
  updatedAt?: { seconds: number; nanoseconds: number };
  requisiti_generali?: string | string[];
}

export interface Match {
  concorso_id: string;
  match_score: number;
  match_explanation: string;
  publication_date: Timestamp;
  user_id: string;
}

export interface ConcorsoWithMatch extends Concorso {
  match_score: number;
  match_explanation: string;
} 