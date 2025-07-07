import { Timestamp } from 'firebase/firestore';

export interface Articolo {
  id: string;
  articolo_title: string;
  articolo_subtitle?: string;
  articolo_body: string;
  articolo?: string;
  articolo_meta_description?: string;
  articolo_tags: string[];
  concorso_id: string;
  publication_date: Timestamp;
  slug?: string; // SEO-friendly URL slug
  // Categorization metadata from concorso
  categoria?: string;
  settore_professionale?: string;
  AreaGeografica?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ArticoloWithConcorso extends Articolo {
  concorso?: {
    id: string;
    Titolo: string;
    Stato: string;
    categoria?: string;
    settore_professionale?: string;
    AreaGeografica?: string;
    Ente: string;
    Descrizione: string;
    Link?: string;
    DataChiusura?: any; // Firestore Timestamp
    numero_di_posti?: number;
    regime?: string;
    regime_impegno?: string;
    // Other concorso fields as needed
  };
} 