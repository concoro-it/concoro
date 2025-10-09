import { Timestamp } from 'firebase/firestore';
import type { Concorso } from './concorso';

export interface ImageMeta {
  mediaLink?: string;
  bucket?: string;
  name?: string;
  generation?: string;
}

export interface FAQ {
  domanda: string;
  risposta: string;
}

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
  // New fields for enhanced content
  image_meta?: ImageMeta;
  faqs?: FAQ[];
  people_also_ask?: FAQ[];
}

export interface ArticoloWithConcorso extends Articolo {
  concorso?: Concorso;
}