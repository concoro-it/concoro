import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  Timestamp,
  serverTimestamp,
  FieldValue,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './config';
import type {
  UserProfile,
  Experience,
  Education,
  Certification,
  Volunteering,
  Publication,
  Language,
} from '@/types';

// Profile Services
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    
    
    if (!db) {
      console.error('Firestore database is not initialized');
      throw new Error('Database not available');
    }
    
    const profileRef = doc(db, 'userProfiles', userId);
    const profileSnap = await getDoc(profileRef);

    if (profileSnap.exists()) {
      const data = profileSnap.data();
      
      
      // Convert Firestore data to UserProfile format
      const convertedData: UserProfile = {
        uid: userId,
        email: data.email || '',
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        region: data.region || '',
        isStudent: data.isStudent || false,
        headline: data.jobTitle || '',
        currentPosition: data.jobTitle || '',
        currentCompany: data.currentCompany || '',
        location: data.location || '',
        about: data.about || data.bio || '',
        profilePicture: data.profileImageURL || null,
        backgroundImage: data.backgroundImageURL || null,
        website: data.website || null,
        customProfileUrl: data.customProfileUrl || null,
        phone: data.contactInfo?.phone || null,
        city: data.city || '',
        postalCode: data.postalCode || '',
        experience: Array.isArray(data.experience) ? data.experience : [],
        education: Array.isArray(data.education) ? data.education : [],
        certifications: Array.isArray(data.certifications) ? data.certifications : 
                       (Array.isArray(data.licensesCertifications) ? data.licensesCertifications : []),
        volunteering: Array.isArray(data.volunteering) ? data.volunteering : [],
        publications: Array.isArray(data.publications) ? data.publications : [],
        skills: Array.isArray(data.skills) ? data.skills : [],
        languages: Array.isArray(data.languages) ? data.languages : [],
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
        jobTitle: data.jobTitle || '',
        bio: data.bio || '',
        contactInfo: {
          email: data.contactInfo?.email || data.email || '',
          phone: data.contactInfo?.phone || ''
        },
        professionalInfo: data.professionalInfo || {},
        displayName: `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'User',
        school: data.school || '',
        showSchool: data.showSchool || false
      };

      console.log('Firebase Service - Retrieved user profile:', userId);
      return convertedData;
    }
    
    
    return null;
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
};

export const createProfile = async (userId: string, data: Partial<UserProfile>): Promise<void> => {
  try {
    
    
    if (!db) {
      console.error('Firestore database is not initialized');
      throw new Error('Database not available');
    }
    
    const profileRef = doc(db, 'userProfiles', userId);
    
    // Convert dates to Firestore Timestamps and ensure arrays are initialized
    const profileData: Record<string, any> = {
      ...data,
      experience: (data.experience || []).map(exp => ({
        ...exp,
        startDate: exp.startDate instanceof Timestamp ? exp.startDate : Timestamp.fromDate(new Date(exp.startDate)),
        endDate: exp.endDate ? (exp.endDate instanceof Timestamp ? exp.endDate : Timestamp.fromDate(new Date(exp.endDate as unknown as string))) : null,
      })),
      education: (data.education || []).map(edu => ({
        ...edu,
        startDate: edu.startDate instanceof Timestamp ? edu.startDate : Timestamp.fromDate(new Date(edu.startDate)),
        endDate: edu.endDate !== null ? (edu.endDate instanceof Timestamp ? edu.endDate : Timestamp.fromDate(new Date(edu.endDate as unknown as string))) : null,
      })),
      // Use certifications field name consistently
      certifications: (data.certifications || []).map(cert => ({
        ...cert,
        issueDate: cert.issueDate instanceof Timestamp ? cert.issueDate : Timestamp.fromDate(new Date(cert.issueDate)),
        expiryDate: cert.expiryDate instanceof Timestamp ? cert.expiryDate : (cert.expiryDate ? Timestamp.fromDate(new Date(cert.expiryDate)) : undefined),
      })),
      volunteering: (data.volunteering || []).map(vol => ({
        ...vol,
        startDate: vol.startDate instanceof Timestamp ? vol.startDate : Timestamp.fromDate(new Date(vol.startDate)),
        endDate: vol.endDate instanceof Timestamp ? vol.endDate : (vol.endDate ? Timestamp.fromDate(new Date(vol.endDate)) : undefined),
      })),
      publications: (data.publications || []).map(pub => ({
        ...pub,
        publicationDate: pub.publicationDate instanceof Timestamp ? pub.publicationDate : Timestamp.fromDate(new Date(pub.publicationDate)),
      })),
      skills: (data.skills || []).map(skill => ({
        id: skill.id || crypto.randomUUID(),
        name: skill.name || '',
        proficiency: skill.proficiency || 'intermediate'
      })),
      languages: data.languages || [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    console.log('Firebase Service - Creating profile with data:', userId);
    await setDoc(profileRef, profileData);
    
  } catch (error) {
    console.error('Error creating profile:', error);
    throw error;
  }
};

export const updateProfile = async (userId: string, updates: Partial<UserProfile>): Promise<void> => {
  try {
    console.log('Firebase Service - updateProfile called with data:', JSON.stringify(updates, (key, value) => {
      // Handle circular references in logging
      if (value instanceof Timestamp) {
        return `Timestamp(${value.toDate().toISOString()})`;
      }
      return value;
    }, 2));
    
    if (!db) {
      console.error('Firebase Service - Firestore database is not initialized');
      throw new Error('Database not available');
    }
    
    const profileRef = doc(db, 'userProfiles', userId);
    
    // Create a new object with only the fields that are defined
    const cleanedUpdates: Record<string, any> = {};

    // Handle all string fields
    const stringFields = [
      'firstName',
      'lastName',
      'region',
      'city',
      'postalCode',
      'school',
      'website',
      'headline',
      'jobTitle',
      'customProfileUrl'
    ];

    // Process each field individually for better debugging
    stringFields.forEach(field => {
      if (field in updates) {
        const value = updates[field as keyof UserProfile];
        
        // Only set the field if it's not undefined
        if (value !== undefined) {
          cleanedUpdates[field] = value;
          console.log(`Firebase Service - Setting field ${field} to:`, value);
        }
      }
    });

    // Special logging for city and postalCode fields
    if ('city' in updates) {
      console.log('Firebase Service - Setting city field:', updates.city);
      cleanedUpdates.city = updates.city;
    }
    
    if ('postalCode' in updates) {
      console.log('Firebase Service - Setting postalCode field:', updates.postalCode);
      cleanedUpdates.postalCode = updates.postalCode;
    }

    // Handle about/bio field separately since it needs to update both fields
    if ('about' in updates) {
      const aboutValue = updates.about;
      
      if (aboutValue !== undefined) {
        cleanedUpdates.about = aboutValue;
        cleanedUpdates.bio = aboutValue; // Keep both fields in sync
        console.log('Firebase Service - Setting about/bio fields:', aboutValue);
      }
    }

    // Handle array fields with robust null/undefined checks
    if ('experience' in updates) {
      if (Array.isArray(updates.experience)) {
        const validExperiences = updates.experience.filter(exp => exp !== null && exp !== undefined);
        cleanedUpdates.experience = validExperiences.map(exp => ({
          ...exp,
          id: exp.id || crypto.randomUUID(),
          positionTitle: exp.positionTitle || '',
          companyName: exp.companyName || '',
          startDate: exp.startDate instanceof Timestamp ? exp.startDate : Timestamp.fromDate(new Date(exp.startDate || Date.now())),
          endDate: exp.endDate ? (exp.endDate instanceof Timestamp ? exp.endDate : Timestamp.fromDate(new Date(exp.endDate))) : null,
          isCurrent: Boolean(exp.isCurrent),
          location: exp.location || '',
          skills: Array.isArray(exp.skills) ? exp.skills : []
        }));
        console.log(`Firebase Service - Setting experience field with ${validExperiences.length} items`);
      } else {
        console.warn('Firebase Service - Experience field is not an array:', updates.experience);
      }
    }

    if ('education' in updates) {
      if (Array.isArray(updates.education)) {
        const validEducation = updates.education.filter(edu => edu !== null && edu !== undefined);
        cleanedUpdates.education = validEducation.map(edu => ({
          ...edu,
          id: edu.id || crypto.randomUUID(),
          schoolName: edu.schoolName || '',
          degree: edu.degree || '',
          fieldOfStudy: edu.fieldOfStudy || '',
          startDate: edu.startDate instanceof Timestamp ? edu.startDate : Timestamp.fromDate(new Date(edu.startDate || Date.now())),
          endDate: edu.endDate ? (edu.endDate instanceof Timestamp ? edu.endDate : Timestamp.fromDate(new Date(edu.endDate))) : null,
          isCurrent: Boolean(edu.isCurrent),
        }));
        console.log(`Firebase Service - Setting education field with ${validEducation.length} items`);
      } else {
        console.warn('Firebase Service - Education field is not an array:', updates.education);
      }
    }

    // Fix the field name inconsistency: use certifications consistently
    if ('certifications' in updates) {
      if (Array.isArray(updates.certifications)) {
        // Filter out any items with undefined values
        const validCertifications = updates.certifications.filter(cert => 
          cert !== undefined && cert !== null
        );
        
        if (validCertifications.length > 0) {
          // Use certifications field name consistently (not licensesCertifications)
          cleanedUpdates.certifications = validCertifications.map(cert => ({
            ...cert,
            // Use null instead of undefined for Firebase
            id: cert.id || crypto.randomUUID(),
            name: cert.name || '',
            issuer: cert.issuer || '',
            issueDate: cert.issueDate instanceof Timestamp ? cert.issueDate : Timestamp.fromDate(new Date(cert.issueDate || Date.now())),
            expiryDate: cert.expiryDate ? (cert.expiryDate instanceof Timestamp ? cert.expiryDate : Timestamp.fromDate(new Date(cert.expiryDate))) : null,
            certificateURL: cert.certificateURL || null
          }));
          console.log(`Firebase Service - Setting certifications field with ${validCertifications.length} items`);
        } else {
          cleanedUpdates.certifications = [];
          console.log('Firebase Service - Setting empty certifications array');
        }
      } else {
        console.warn('Firebase Service - Certifications field is not an array:', updates.certifications);
      }
    }

    if ('volunteering' in updates) {
      if (Array.isArray(updates.volunteering)) {
        // Filter out any items with undefined values
        const validVolunteering = updates.volunteering.filter(vol => 
          vol !== undefined && vol !== null
        );
        
        if (validVolunteering.length > 0) {
          cleanedUpdates.volunteering = validVolunteering.map(vol => {
            console.log('Firebase Service - Processing volunteering item:', vol);
            return {
              ...vol,
              // Use null instead of undefined for Firebase
              id: vol.id || crypto.randomUUID(),
              position: vol.position || '',
              organization: vol.organization || '',
              startDate: vol.startDate instanceof Timestamp ? vol.startDate : Timestamp.fromDate(new Date(vol.startDate || Date.now())),
              endDate: vol.endDate ? (vol.endDate instanceof Timestamp ? vol.endDate : Timestamp.fromDate(new Date(vol.endDate))) : null,
            };
          });
          console.log(`Firebase Service - Setting volunteering field with ${validVolunteering.length} items`);
        } else {
          cleanedUpdates.volunteering = [];
          console.log('Firebase Service - Setting empty volunteering array');
        }
      } else {
        console.warn('Firebase Service - Volunteering field is not an array:', updates.volunteering);
      }
    }

    if ('publications' in updates) {
      if (Array.isArray(updates.publications)) {
        const validPublications = updates.publications.filter(pub => pub !== null && pub !== undefined);
        cleanedUpdates.publications = validPublications.map(pub => ({
          ...pub,
          id: pub.id || crypto.randomUUID(),
          title: pub.title || '',
          publisher: pub.publisher || '',
          publicationDate: pub.publicationDate instanceof Timestamp ? pub.publicationDate : Timestamp.fromDate(new Date(pub.publicationDate || Date.now())),
          summary: pub.summary || '',
          link: pub.link || null
        }));
        console.log(`Firebase Service - Setting publications field with ${validPublications.length} items`);
      } else {
        console.warn('Firebase Service - Publications field is not an array:', updates.publications);
      }
    }

    if ('skills' in updates) {
      if (Array.isArray(updates.skills)) {
        const validSkills = updates.skills.filter(skill => skill !== null && skill !== undefined);
        cleanedUpdates.skills = validSkills.map(skill => ({
          id: skill.id || crypto.randomUUID(),
          name: skill.name || '',
          proficiency: skill.proficiency || 'intermediate'
        }));
        console.log(`Firebase Service - Setting skills field with ${validSkills.length} items`);
      } else {
        console.warn('Firebase Service - Skills field is not an array:', updates.skills);
      }
    }

    if ('languages' in updates) {
      if (Array.isArray(updates.languages)) {
        const validLanguages = updates.languages.filter(lang => lang !== null && lang !== undefined);
        cleanedUpdates.languages = validLanguages.map(lang => ({
          id: lang.id || crypto.randomUUID(),
          language: lang.language || '',
          proficiency: lang.proficiency || 'intermediate'
        }));
        console.log(`Firebase Service - Setting languages field with ${validLanguages.length} items`);
      } else {
        console.warn('Firebase Service - Languages field is not an array:', updates.languages);
      }
    }

    // Handle displayName
    if ('firstName' in updates || 'lastName' in updates) {
      const firstName = updates.firstName || cleanedUpdates.firstName || '';
      const lastName = updates.lastName || cleanedUpdates.lastName || '';
      cleanedUpdates.displayName = `${firstName} ${lastName}`.trim();
      console.log('Firebase Service - Setting displayName:', cleanedUpdates.displayName);
    }

    // Add timestamp for update
    cleanedUpdates.updatedAt = serverTimestamp();
    console.log('Firebase Service - Final data to be updated:', cleanedUpdates);

    try {
      const result = await updateDoc(profileRef, cleanedUpdates);
      console.log('Firebase Service - Update successful, result:', result);
    } catch (error) {
      console.error('Firebase Service - Error during Firestore update:', error);
      throw error;
    }
  } catch (error) {
    console.error('Firebase Service - Error in updateProfile function:', error);
    throw error;
  }
};

// Image Upload Service
export const uploadImage = async (
  userId: string,
  file: File,
  path: string
): Promise<string> => {
  try {
    if (!storage) {
      console.error('Firebase storage is not initialized');
      throw new Error('Storage not available');
    }
    
    // Create a unique filename
    const timestamp = Date.now();
    const uniquePath = `images/users/${userId}/${path}-${timestamp}`;
    const storageRef = ref(storage, uniquePath);

    // Set metadata
    const metadata = {
      contentType: file.type,
      cacheControl: 'public,max-age=7200'
    };

    // Upload the file with metadata
    const uploadResult = await uploadBytes(storageRef, file, metadata);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(uploadResult.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to upload image: ${error.message}`);
    }
    throw new Error('Failed to upload image');
  }
};

// Experience Services
export const addExperience = async (userId: string, experience: Omit<Experience, 'id'>) => {
  try {
    if (!db) {
      console.error('Firestore database is not initialized');
      throw new Error('Database not available');
    }
    
    const profileRef = doc(db, 'userProfiles', userId);
    const experienceWithId = {
      ...experience,
      id: crypto.randomUUID(),
    };
    await updateDoc(profileRef, {
      experience: arrayUnion(experienceWithId),
    });
    return experienceWithId;
  } catch (error) {
    console.error('Error adding experience:', error);
    throw error;
  }
};

export const updateExperience = async (
  userId: string,
  oldExperience: Experience,
  newExperience: Experience
) => {
  try {
    if (!db) {
      console.error('Firestore database is not initialized');
      throw new Error('Database not available');
    }
    
    const profileRef = doc(db, 'userProfiles', userId);
    await updateDoc(profileRef, {
      experience: arrayRemove(oldExperience),
    });
    await updateDoc(profileRef, {
      experience: arrayUnion(newExperience),
    });
  } catch (error) {
    console.error('Error updating experience:', error);
    throw error;
  }
};

export const deleteExperience = async (userId: string, experience: Experience) => {
  try {
    if (!db) {
      console.error('Firestore database is not initialized');
      throw new Error('Database not available');
    }
    
    const profileRef = doc(db, 'userProfiles', userId);
    await updateDoc(profileRef, {
      experience: arrayRemove(experience),
    });
  } catch (error) {
    console.error('Error deleting experience:', error);
    throw error;
  }
};

// Education Services
export const addEducation = async (userId: string, education: Omit<Education, 'id'>) => {
  try {
    if (!db) {
      console.error('Firestore database is not initialized');
      throw new Error('Database not available');
    }
    
    const profileRef = doc(db, 'userProfiles', userId);
    const educationWithId = {
      ...education,
      id: crypto.randomUUID(),
    };
    await updateDoc(profileRef, {
      education: arrayUnion(educationWithId),
    });
    return educationWithId;
  } catch (error) {
    console.error('Error adding education:', error);
    throw error;
  }
};

// Certification Services
export const addCertification = async (userId: string, certification: Omit<Certification, 'id'>) => {
  try {
    if (!db) {
      console.error('Firestore database is not initialized');
      throw new Error('Database not available');
    }
    
    const profileRef = doc(db, 'userProfiles', userId);
    const certificationWithId = {
      ...certification,
      id: crypto.randomUUID(),
    };
    
    console.log('Firebase Service - Adding certification:', certificationWithId);
    
    // Use certifications instead of licensesCertifications for consistency
    await updateDoc(profileRef, {
      certifications: arrayUnion(certificationWithId),
    });
    return certificationWithId;
  } catch (error) {
    console.error('Error adding certification:', error);
    throw error;
  }
};

// Volunteering Services
export const addVolunteering = async (userId: string, volunteering: Omit<Volunteering, 'id'>) => {
  try {
    if (!db) {
      console.error('Firestore database is not initialized');
      throw new Error('Database not available');
    }
    
    const profileRef = doc(db, 'userProfiles', userId);
    const volunteeringWithId = {
      ...volunteering,
      id: crypto.randomUUID(),
    };
    await updateDoc(profileRef, {
      volunteering: arrayUnion(volunteeringWithId),
    });
    return volunteeringWithId;
  } catch (error) {
    console.error('Error adding volunteering:', error);
    throw error;
  }
};

// Publication Services
export const addPublication = async (userId: string, publication: Omit<Publication, 'id'>) => {
  try {
    if (!db) {
      console.error('Firestore database is not initialized');
      throw new Error('Database not available');
    }
    
    const profileRef = doc(db, 'userProfiles', userId);
    const publicationWithId = {
      ...publication,
      id: crypto.randomUUID(),
    };
    await updateDoc(profileRef, {
      publications: arrayUnion(publicationWithId),
    });
    return publicationWithId;
  } catch (error) {
    console.error('Error adding publication:', error);
    throw error;
  }
};

// Language Services
export const addLanguage = async (userId: string, language: Omit<Language, 'id'>) => {
  try {
    if (!db) {
      console.error('Firestore database is not initialized');
      throw new Error('Database not available');
    }
    
    const profileRef = doc(db, 'userProfiles', userId);
    const languageWithId = {
      ...language,
      id: crypto.randomUUID(),
    };
    await updateDoc(profileRef, {
      languages: arrayUnion(languageWithId),
    });
    return languageWithId;
  } catch (error) {
    console.error('Error adding language:', error);
    throw error;
  }
};

// Initialize User Profile
export const initializeUserProfile = async (
  userId: string,
  initialData: Partial<UserProfile>
) => {
  try {
    if (!db) {
      console.error('Firestore database is not initialized');
      throw new Error('Database not available');
    }
    
    const profileRef = doc(db, 'userProfiles', userId);
    const defaultProfile: Record<string, any> = {
      firstName: '',
      lastName: '',
      jobTitle: '',
      currentCompany: '',
      location: '',
      bio: '',
      contactInfo: {
        email: '',
        phone: '',
      },
      experience: [],
      education: [],
      certifications: [], // Use certifications instead of licensesCertifications
      volunteering: [],
      publications: [],
      languages: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(profileRef, {
      ...defaultProfile,
      ...initialData,
    });
  } catch (error) {
    console.error('Error initializing user profile:', error);
    throw error;
  }
}; 