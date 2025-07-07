import { Timestamp, FieldValue } from 'firebase/firestore';

/**
 * Contact information for a user profile
 */
export interface ContactInfo {
  email: string;
  phone: string;
  website?: string;
  linkedin?: string;
}

/**
 * Work experience entry
 */
export interface Experience {
  id: string;
  positionTitle: string;
  companyName: string;
  companyLogoURL?: string;
  startDate: Timestamp;
  endDate: Timestamp | null;
  isCurrent: boolean;
  location: string;
  skills: string[];
}

/**
 * Educational background entry
 */
export interface Education {
  id: string;
  schoolName: string;
  schoolLogoURL?: string;
  degree: string;
  fieldOfStudy: string;
  startDate: Timestamp;
  endDate: Timestamp | null;
  isCurrent: boolean;
}

/**
 * Professional certification entry
 */
export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issueDate: Timestamp;
  expiryDate?: Timestamp;
  certificateURL?: string;
}

/**
 * Volunteering experience entry
 */
export interface Volunteering {
  id: string;
  position: string;
  organization: string;
  startDate: Timestamp;
  endDate?: Timestamp;
  description: string;
}

/**
 * Publication entry
 */
export interface Publication {
  id: string;
  title: string;
  publisher: string;
  publicationDate: Timestamp;
  summary?: string;
  link?: string;
}

/**
 * Language proficiency entry
 */
export interface Language {
  id: string;
  language: string;
  proficiency: 'native' | 'fluent' | 'intermediate' | 'basic';
}

/**
 * Skill entry with proficiency level
 */
export interface Skill {
  id: string;
  name: string;
  proficiency: 'beginner' | 'intermediate' | 'advanced';
}

/**
 * Professional information summary
 */
export interface ProfessionalInfo {
  currentTitle?: string;
  yearsOfExperience?: number;
  skills?: string[];
}

/**
 * Complete user profile information
 * This is the single source of truth for user profile data structure
 */
export interface UserProfile {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  region?: string;
  isStudent: boolean;
  headline?: string;
  currentPosition?: string;
  currentCompany?: string;
  location?: string;
  about?: string;
  profilePicture?: string | null;
  backgroundImage?: string | null;
  website?: string | null;
  customProfileUrl?: string | null;
  phone?: string | null;
  experience: Experience[];
  education: Education[];
  certifications: Certification[];
  volunteering: Volunteering[];
  publications: Publication[];
  skills: Skill[];
  languages: Language[];
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  jobTitle?: string;
  bio?: string;
  contactInfo: ContactInfo;
  professionalInfo?: ProfessionalInfo;
  displayName?: string;
  city?: string;
  postalCode?: string;
  school?: string;
  showSchool?: boolean;
  notifications?: {
    deadlineReminder?: boolean;
    newConcorsiFrequency?: 'daily' | 'weekly';
    method?: 'email' | 'push' | 'both';
  };
} 