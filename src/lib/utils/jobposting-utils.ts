import { ArticoloWithConcorso } from '@/types';
import { Timestamp } from 'firebase/firestore';

/**
 * Generates JobPosting structured data for Google Job Search
 * Following Google's JobPosting schema requirements
 */
export interface JobPostingStructuredData {
  "@context": string;
  "@type": string;
  title: string;
  description: string;
  datePosted: string;
  hiringOrganization: {
    "@type": string;
    name: string;
    sameAs?: string;
    logo?: string;
  };
  jobLocation: {
    "@type": string;
    address: {
      "@type": string;
      addressLocality?: string;
      addressRegion?: string;
      addressCountry: string;
    };
  };
  identifier: {
    "@type": string;
    name: string;
    value: string;
  };
  validThrough?: string;
  employmentType?: string[];
  baseSalary?: {
    "@type": string;
    currency: string;
    value: {
      "@type": string;
      value?: number;
      unitText?: string;
    };
  };
  totalJobOpenings?: number;
  jobLocationType?: string;
  applicantLocationRequirements?: {
    "@type": string;
    name: string;
  };
  url: string;
  mainEntityOfPage: {
    "@type": string;
    "@id": string;
  };
}

/**
 * Maps employment types from Italian to Google JobPosting standard values
 */
const mapEmploymentType = (regime?: string): string[] => {
  if (!regime) return ["FULL_TIME"];
  
  const regimeLower = regime.toLowerCase();
  
  if (regimeLower.includes('tempo pieno') || regimeLower.includes('full-time')) {
    return ["FULL_TIME"];
  }
  if (regimeLower.includes('tempo parziale') || regimeLower.includes('part-time')) {
    return ["PART_TIME"];
  }
  if (regimeLower.includes('tempo determinato') || regimeLower.includes('contratto a termine')) {
    return ["TEMPORARY"];
  }
  if (regimeLower.includes('tempo indeterminato')) {
    return ["FULL_TIME"];
  }
  if (regimeLower.includes('stage') || regimeLower.includes('tirocinio')) {
    return ["INTERN"];
  }
  
  // Default to full-time for Italian public sector jobs
  return ["FULL_TIME"];
};

/**
 * Extracts location information from AreaGeografica
 */
const parseLocation = (areaGeografica?: string) => {
  if (!areaGeografica) {
    return {
      addressLocality: undefined,
      addressRegion: undefined,
      addressCountry: "IT"
    };
  }

  const area = areaGeografica.trim();
  
  // Handle common Italian location formats
  if (area.toLowerCase().includes('roma') || area.toLowerCase().includes('lazio')) {
    return {
      addressLocality: "Roma",
      addressRegion: "Lazio",
      addressCountry: "IT"
    };
  }
  
  if (area.toLowerCase().includes('milano') || area.toLowerCase().includes('lombardia')) {
    return {
      addressLocality: "Milano", 
      addressRegion: "Lombardia",
      addressCountry: "IT"
    };
  }
  
  if (area.toLowerCase().includes('napoli') || area.toLowerCase().includes('campania')) {
    return {
      addressLocality: "Napoli",
      addressRegion: "Campania", 
      addressCountry: "IT"
    };
  }
  
  // For other locations, use the full area as locality
  return {
    addressLocality: area,
    addressRegion: undefined,
    addressCountry: "IT"
  };
};

/**
 * Safely converts Firestore timestamp to ISO string
 */
const toISOString = (timestamp: any): string => {
  if (!timestamp) return new Date().toISOString();
  
  try {
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toISOString();
    }
    if (timestamp.seconds && timestamp.nanoseconds) {
      return new Timestamp(timestamp.seconds, timestamp.nanoseconds).toDate().toISOString();
    }
    if (timestamp instanceof Date) {
      return timestamp.toISOString();
    }
    if (typeof timestamp === 'string') {
      return new Date(timestamp).toISOString();
    }
    return new Date().toISOString();
  } catch (error) {
    console.error('Error converting timestamp to ISO string:', error);
    return new Date().toISOString();
  }
};

/**
 * Generates JobPosting structured data from article and concorso data
 */
export const generateJobPostingStructuredData = (
  article: ArticoloWithConcorso,
  baseUrl: string = 'https://concoro.it'
): JobPostingStructuredData | null => {
  
  if (!article.concorso) {
    console.warn('Cannot generate JobPosting structured data: no concorso data available');
    return null;
  }

  const concorso = article.concorso;
  const location = parseLocation(concorso.AreaGeografica || article.AreaGeografica);
  const articleUrl = `${baseUrl}/articolo/${article.slug || article.id}`;
  
  // Create description combining article and concorso information
  const description = `
    <p>${article.articolo_subtitle || article.articolo_title}</p>
    <p><strong>Ente:</strong> ${concorso.Ente}</p>
    <p><strong>Descrizione:</strong> ${concorso.Descrizione}</p>
    ${concorso.numero_di_posti ? `<p><strong>Posti disponibili:</strong> ${concorso.numero_di_posti}</p>` : ''}
    ${article.articolo_body ? `<p>${article.articolo_body.substring(0, 500)}...</p>` : ''}
  `.trim();

  const structuredData: JobPostingStructuredData = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: concorso.Titolo || article.articolo_title,
    description: description,
    datePosted: toISOString(article.publication_date).split('T')[0], // Date only
    hiringOrganization: {
      "@type": "Organization",
      name: concorso.Ente,
      sameAs: concorso.Link || undefined,
      logo: `${baseUrl}/concoro-logo-light.svg`
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: location.addressLocality,
        addressRegion: location.addressRegion,
        addressCountry: location.addressCountry
      }
    },
    identifier: {
      "@type": "PropertyValue", 
      name: concorso.Ente,
      value: concorso.id || article.concorso_id
    },
    url: articleUrl,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl
    }
  };

  // Add optional fields if available
  if (concorso.DataChiusura) {
    structuredData.validThrough = toISOString(concorso.DataChiusura);
  }

  if (concorso.regime || concorso.regime_impegno) {
    structuredData.employmentType = mapEmploymentType(concorso.regime || concorso.regime_impegno);
  }

  if (concorso.numero_di_posti && concorso.numero_di_posti > 0) {
    structuredData.totalJobOpenings = concorso.numero_di_posti;
  }

  // Add remote work support if applicable
  if (concorso.Descrizione?.toLowerCase().includes('telelavoro') || 
      concorso.Descrizione?.toLowerCase().includes('smart working') ||
      concorso.Descrizione?.toLowerCase().includes('remoto')) {
    structuredData.jobLocationType = "TELECOMMUTE";
    structuredData.applicantLocationRequirements = {
      "@type": "Country",
      name: "Italia"
    };
  }

  return structuredData;
};

/**
 * Validates that required JobPosting fields are present
 */
export const validateJobPostingData = (data: JobPostingStructuredData): boolean => {
  const requiredFields = ['title', 'description', 'datePosted', 'hiringOrganization', 'jobLocation'];
  
  for (const field of requiredFields) {
    if (!data[field as keyof JobPostingStructuredData]) {
      console.warn(`Missing required JobPosting field: ${field}`);
      return false;
    }
  }
  
  return true;
}; 