import { Timestamp } from 'firebase/firestore';
import type { UserProfile as ProfileType } from './profile';

// Re-export the UserProfile type from profile.ts with a slight modification
// for backward compatibility with existing code that expects skills as string[]
export interface UserProfile extends Omit<ProfileType, 'skills'> {
  skills: string[];
  // Note: This is a temporary solution for backward compatibility.
  // Consider updating all code to use the Skill[] type from profile.ts
}

export interface SignUpFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface SignInFormData {
  email: string;
  password: string;
}

export interface BasicInfoFormData {
  email?: string;
  firstName: string;
  lastName: string;
  region: string;
  isStudent: boolean;
  education?: {
    schoolName: string;
    fieldOfStudy: string;
    degree: string;
    description?: string;
    startDate: Date;
    endDate?: Date | null;
    isCurrent: boolean;
  };
  experience?: {
    positionTitle: string;
    companyName: string;
    location: string;
    description: string;
    startDate: Date;
    endDate?: Date | null;
    isCurrent: boolean;
    skills: string[];
  };
}

export interface ResetPasswordFormData {
  email: string;
}

export interface AuthError {
  code: string;
  message: string;
} 