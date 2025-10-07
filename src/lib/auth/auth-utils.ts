import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  User,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { SignUpFormData, SignInFormData, BasicInfoFormData } from '@/types/auth';
import { UserProfile, Education, Experience } from '@/types';
import { brevoClient } from '@/lib/services/brevoClient';
// Error message utilities - inline implementation since error-messages.ts was removed
const getItalianError = (error: any): string => {
  // Basic error mapping for common Firebase errors
  const errorMessages: { [key: string]: string } = {
    'auth/user-not-found': 'Utente non trovato',
    'auth/wrong-password': 'Password errata',
    'auth/email-already-in-use': 'Email già in uso',
    'auth/weak-password': 'Password troppo debole',
    'auth/invalid-email': 'Email non valida',
    'auth/too-many-requests': 'Troppi tentativi. Riprova più tardi',
    'auth/network-request-failed': 'Errore di rete. Controlla la connessione',
  };
  
  return errorMessages[error.code] || 'Si è verificato un errore. Riprova.';
};

const getItalianErrorMessage = (key: string): string => {
  const messages: { [key: string]: string } = {
    'generic/authentication-service-unavailable': 'Servizio di autenticazione non disponibile',
    'generic/verification-email-failed': 'Impossibile inviare email di verifica',
    'auth/email-not-verified': 'Email non verificata. Controlla la tua casella di posta',
  };
  
  return messages[key] || 'Si è verificato un errore. Riprova.';
};

export const signUp = async (data: SignUpFormData) => {
  try {
    
    
    if (!auth) {
      console.error('Firebase auth is not initialized');
      throw new Error(getItalianErrorMessage('generic/authentication-service-unavailable'));
    }
    
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    
    
    try {
      
      await sendEmailVerification(userCredential.user);
      
    } catch (verificationError: any) {
      console.error('Error sending verification email:', verificationError);
      throw new Error(getItalianErrorMessage('generic/verification-email-failed'));
    }
    
    return userCredential.user;
  } catch (error: any) {
    console.error('Signup error:', error);
    
    // Use Italian error message utility
    throw new Error(getItalianError(error));
  }
};

export const signIn = async (data: SignInFormData) => {
  try {
    if (!auth) {
      console.error('Firebase auth is not initialized');
      throw new Error(getItalianErrorMessage('generic/authentication-service-unavailable'));
    }
    
    const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
    
    if (!userCredential.user.emailVerified) {
      await signOut();
      throw new Error(getItalianErrorMessage('auth/email-not-verified'));
    }
    
    return userCredential.user;
  } catch (error: any) {
    // Use Italian error message utility
    throw new Error(getItalianError(error));
  }
};

export const signInWithGoogle = async () => {
  try {
    if (!auth) {
      console.error('Firebase auth is not initialized');
      throw new Error('Authentication service not available');
    }
    
    if (!db) {
      console.error('Firestore database is not initialized');
      throw new Error('Database not available');
    }
    
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    
    // For Google Sign In, we don't need to verify email as Google accounts are pre-verified
    const user = userCredential.user;

    // Check if user profile exists
    const userProfileRef = doc(db, 'userProfiles', user.uid);
    const profileSnap = await getDoc(userProfileRef);

    if (!profileSnap.exists()) {
      // Create a new profile with required fields
      const nameParts = user.displayName?.split(' ') || ['', ''];
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ');

      const profileData = {
        email: user.email,
        RegioniPreferite: [],
        SettoriInteresse: [],
        backgroundImageURL: "",
        bio: "",
        contactInfo: {
          email: user.email,
          phone: ""
        },
        createdAt: Timestamp.now(),
        currentCompany: "",
        education: [],
        experience: [],
        firstName: firstName,
        jobTitle: "",
        languages: [],
        lastName: lastName || "",
        certifications: [],
        location: "",
        profileImageURL: user.photoURL || "",
        publications: [],
        updatedAt: Timestamp.now(),
        volunteering: []
      };

      await setDoc(userProfileRef, profileData);

      // Sync new Google profile with Brevo
      try {
        const userProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          firstName: firstName,
          lastName: lastName || '',
          region: '',
          isStudent: false,
          headline: '',
          currentPosition: '',
          currentCompany: '',
          location: '',
          about: '',
          profilePicture: user.photoURL,
          backgroundImage: null,
          website: null,
          customProfileUrl: null,
          phone: null,
          experience: [],
          education: [],
          certifications: [],
          volunteering: [],
          publications: [],
          skills: [],
          languages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          contactInfo: {
            email: user.email || '',
            phone: ''
          }
        };

        
        const brevoResult = await brevoClient.syncProfileWithRetry(userProfile);
        
        if (brevoResult.success) {
          
        } else {
          console.warn('Failed to sync Google profile with Brevo:', brevoResult.error);
        }
      } catch (brevoError) {
        console.error('Brevo sync error for Google profile:', brevoError);
        // Don't block the sign-in flow
      }
    }
    
    return user;
  } catch (error: any) {
    // Use Italian error message utility
    throw new Error(getItalianError(error));
  }
};

export const resendVerificationEmail = async (user: User) => {
  try {
    await sendEmailVerification(user);
    return true;
  } catch (error: any) {
    console.error('Error resending verification email:', error);
    throw new Error(getItalianError(error));
  }
};

export const signOut = async () => {
  try {
    if (!auth) {
      console.error('Firebase auth is not initialized');
      throw new Error(getItalianErrorMessage('generic/authentication-service-unavailable'));
    }
    
    await firebaseSignOut(auth);
  } catch (error: any) {
    throw new Error(getItalianError(error));
  }
};

export const resetPassword = async (email: string) => {
  try {
    if (!auth) {
      console.error('Firebase auth is not initialized');
      throw new Error(getItalianErrorMessage('generic/authentication-service-unavailable'));
    }
    
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    // Use Italian error message utility
    throw new Error(getItalianError(error));
  }
};

export const createUserProfile = async (userId: string, data: BasicInfoFormData) => {
  try {
    
    
    if (!db) {
      console.error('Firestore database is not initialized');
      throw new Error('Database not available');
    }
    
    const userRef = doc(db, 'userProfiles', userId);
    const now = Timestamp.now();
    
    // Create base profile with all required fields
    const profile: UserProfile = {
      uid: userId,
      email: data.email || '',
      firstName: data.firstName,
      lastName: data.lastName,
      region: data.region,
      isStudent: data.isStudent,
      headline: '',
      currentPosition: '',
      currentCompany: '',
      location: data.region, // Initialize with region
      about: '',
      profilePicture: null,
      backgroundImage: null,
      website: null,
      customProfileUrl: null,
      phone: null,
      experience: [],
      education: [],
      certifications: [],
      volunteering: [],
      publications: [],
      skills: [],
      languages: [],
      createdAt: now,
      updatedAt: now,
      contactInfo: {
        email: data.email || '',
        phone: ''
      }
    };

    // Create the main profile document first
    try {
      
      await setDoc(userRef, profile);
      

      // Create public profile
      const publicProfile = {
        uid: userId,
        firstName: data.firstName,
        lastName: data.lastName,
        region: data.region,
        headline: '',
        currentPosition: '',
        currentCompany: '',
        isStudent: data.isStudent,
        createdAt: now,
        updatedAt: now,
        isPublic: false // Default to private
      };
      
      const publicProfileRef = doc(db, 'publicProfiles', userId);
      await setDoc(publicProfileRef, publicProfile);
      

      // Initialize saved bandi collection
      const savedBandiDoc = {
        userId: userId,
        bandi: [] // Initialize with empty array
      };
      
      const savedBandiRef = doc(db, 'savedBandi', userId);
      await setDoc(savedBandiRef, savedBandiDoc);
      

      // Create education or experience based on user type
      if (data.isStudent && data.education) {
        const educationData: Education = {
          id: 'current',
          schoolName: data.education.schoolName,
          degree: data.education.degree,
          fieldOfStudy: data.education.fieldOfStudy,
          startDate: Timestamp.fromDate(data.education.startDate),
          endDate: data.education.endDate ? Timestamp.fromDate(data.education.endDate) : null,
          isCurrent: !data.education.endDate
        };

        // Update the profile's education array
        const updatedProfile = {
          ...profile,
          education: [educationData]
        };
        await setDoc(userRef, updatedProfile);
        

      } else if (!data.isStudent && data.experience) {
        const experienceData: Experience = {
          id: 'current',
          positionTitle: data.experience.positionTitle,
          companyName: data.experience.companyName,
          location: data.experience.location,
          startDate: Timestamp.fromDate(data.experience.startDate),
          endDate: data.experience.endDate ? Timestamp.fromDate(data.experience.endDate) : null,
          isCurrent: data.experience.isCurrent,
          skills: data.experience.skills || []
        };

        // Update the profile's experience array
        const updatedProfile = {
          ...profile,
          experience: [experienceData],
          currentPosition: data.experience.positionTitle,
          currentCompany: data.experience.companyName
        };
        await setDoc(userRef, updatedProfile);
        
      }

      // Sync completed profile with Brevo
      try {
        
        
        // Get the final profile with all updates (education/experience)
        const finalProfile = data.isStudent && data.education 
          ? { ...profile, education: [{ ...profile.education[0] }] }
          : !data.isStudent && data.experience 
          ? { 
              ...profile, 
              experience: [{ ...profile.experience[0] }],
              currentPosition: data.experience.positionTitle,
              currentCompany: data.experience.companyName
            }
          : profile;

        const brevoResult = await brevoClient.syncProfileWithRetry(finalProfile);
        
        if (brevoResult.success) {
          
        } else {
          console.warn('Failed to sync completed profile with Brevo:', brevoResult.error);
        }
      } catch (brevoError) {
        console.error('Brevo sync error for completed profile:', brevoError);
        // Don't block the profile creation flow
      }

      return profile;

    } catch (error: any) {
      console.error('Error creating main profile:', error);
      if (error.code === 'permission-denied') {
        throw new Error('You do not have permission to create a profile. Please sign in again.');
      }
      throw new Error('Failed to create profile. Please try again.');
    }
  } catch (error: any) {
    console.error('Error in createUserProfile:', error);
    throw error;
  }
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    if (!db) {
      console.error('Firestore database is not initialized');
      throw new Error('Database not available');
    }
    
    const userRef = doc(db, 'userProfiles', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    return null;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const isProfileComplete = async (user: User): Promise<boolean> => {
  try {
    const profile = await getUserProfile(user.uid);
    return !!profile && !!profile.firstName && !!profile.lastName && !!profile.region;
  } catch (error) {
    return false;
  }
}; 