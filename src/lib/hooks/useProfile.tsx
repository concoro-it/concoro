import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import type { UserProfile, Education as FirebaseEducation, Skill } from '@/types';
import { Timestamp } from 'firebase/firestore';
import * as profileServices from '@/lib/firebase/services';
import { updateProfile } from 'firebase/auth';
import { useDeferredDataFetch } from '@/hooks/useDeferredLoading';

export const useProfile = () => {
  const { user, initialized } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canFetchData = useDeferredDataFetch(); // Defer profile loading

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const fetchProfile = async () => {
      
      
      // Set a timeout to prevent infinite loading - reduced for better performance
      timeoutId = setTimeout(() => {
        if (mounted && loading) {
          
          setLoading(false);
        }
      }, 3000); // Reduced to 3 second timeout
      
      if (!user) {
        
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        
        const fetchedProfile = await profileServices.getUserProfile(user.uid);

        if (!mounted) {
          
          return;
        }

        if (fetchedProfile) {
          
          
          
          // Convert the firebase profile to UserProfile format
          const userProfileData: UserProfile = {
            uid: user.uid,
            email: user.email || '',
            firstName: fetchedProfile.firstName || '',
            lastName: fetchedProfile.lastName || '',
            region: fetchedProfile.region || '',
            isStudent: false,
            headline: fetchedProfile.jobTitle || '',
            currentPosition: fetchedProfile.jobTitle || '',
            currentCompany: fetchedProfile.currentCompany || '',
            location: fetchedProfile.location || '',
            about: fetchedProfile.bio || '',
            profilePicture: user.photoURL || fetchedProfile.profilePicture,
            backgroundImage: fetchedProfile.backgroundImage,
            website: fetchedProfile.contactInfo?.website || null,
            customProfileUrl: fetchedProfile.customProfileUrl || null,
            phone: fetchedProfile.contactInfo?.phone || null,
            city: fetchedProfile.city || '',
            postalCode: fetchedProfile.postalCode || '',
            experience: fetchedProfile.experience || [],
            education: (fetchedProfile.education || []).map(edu => ({
              id: edu.id,
              schoolName: edu.schoolName,
              fieldOfStudy: edu.fieldOfStudy,
              degree: edu.degree,
              startDate: edu.startDate instanceof Timestamp ? edu.startDate : Timestamp.fromDate(edu.startDate),
              endDate: edu.endDate instanceof Timestamp ? edu.endDate : edu.endDate ? Timestamp.fromDate(edu.endDate) : null,
              isCurrent: false,
            })),
            certifications: (fetchedProfile.certifications || []).map(cert => ({
              id: cert.id,
              name: cert.name,
              issuer: cert.issuer,
              issueDate: cert.issueDate instanceof Timestamp ? cert.issueDate : Timestamp.fromDate(cert.issueDate),
              expiryDate: cert.expiryDate instanceof Timestamp ? cert.expiryDate : cert.expiryDate ? Timestamp.fromDate(cert.expiryDate) : undefined,
              certificateURL: cert.certificateURL,
            })),
            volunteering: fetchedProfile.volunteering || [],
            publications: fetchedProfile.publications || [],
            skills: (fetchedProfile.skills || []).map(skill => ({
              id: skill.id || crypto.randomUUID(),
              name: skill.name || '',
              proficiency: skill.proficiency || 'intermediate'
            })),
            languages: fetchedProfile.languages || [],
            createdAt: (fetchedProfile.createdAt as any) instanceof Timestamp ? fetchedProfile.createdAt : Timestamp.fromDate(fetchedProfile.createdAt instanceof Date ? fetchedProfile.createdAt : new Date()),
            updatedAt: (fetchedProfile.updatedAt as any) instanceof Timestamp ? fetchedProfile.updatedAt : Timestamp.fromDate(fetchedProfile.updatedAt instanceof Date ? fetchedProfile.updatedAt : new Date()),
            jobTitle: fetchedProfile.jobTitle,
            bio: fetchedProfile.bio,
            contactInfo: fetchedProfile.contactInfo,
            professionalInfo: fetchedProfile.professionalInfo,
          };
          setProfile(userProfileData);
        } else {
          
          // Create a new profile if it doesn't exist
          const now = new Date();
          const nowTimestamp = Timestamp.fromDate(now);
          
          const newProfile: UserProfile = {
            uid: user.uid,
            email: user.email || '',
            firstName: user.displayName?.split(' ')[0] || 'New',
            lastName: user.displayName?.split(' ').slice(1).join(' ') || 'User',
            region: '',
            isStudent: false,
            headline: '',
            currentPosition: '',
            currentCompany: '',
            location: '',
            about: '',
            profilePicture: user.photoURL || undefined,
            backgroundImage: undefined,
            website: undefined,
            customProfileUrl: undefined,
            phone: undefined,
            experience: [],
            education: [],
            certifications: [],
            volunteering: [],
            publications: [],
            skills: [] as Skill[],
            languages: [],
            createdAt: Timestamp.fromDate(now),
            updatedAt: Timestamp.fromDate(now),
            jobTitle: '',
            bio: '',
            contactInfo: {
              email: user.email || '',
              phone: ''
            }
          };
          
          // Convert User Profile to the format expected by createProfile
          const profileToCreate = {
            firstName: newProfile.firstName,
            lastName: newProfile.lastName,
            jobTitle: newProfile.headline || '',
            currentCompany: newProfile.currentCompany || '',
            location: newProfile.location || '',
            bio: newProfile.about || '',
            contactInfo: {
              email: newProfile.email,
              phone: newProfile.phone || '',
            },
            profileImageURL: newProfile.profilePicture || '', // Map to Firebase field
            backgroundImageURL: newProfile.backgroundImage || '', // Map to Firebase field
            experience: newProfile.experience.map(exp => ({
              ...exp,
              startDate: exp.startDate || nowTimestamp,
              endDate: exp.endDate || null,
            })),
            education: newProfile.education.map(edu => {
              // Create education entry with the isCurrent property required by Firebase
              const firebaseEdu: FirebaseEducation = {
                id: edu.id,
                schoolName: edu.schoolName,
                degree: edu.degree,
                fieldOfStudy: edu.fieldOfStudy,
                startDate: edu.startDate || nowTimestamp,
                endDate: edu.endDate || nowTimestamp,
                isCurrent: false,
              };
              return firebaseEdu;
            }),
            certifications: (newProfile.certifications || []).map(cert => ({
              id: cert.id,
              name: cert.name,
              issuer: cert.issuer,
              issueDate: cert.issueDate || nowTimestamp,
              expiryDate: cert.expiryDate,
              certificateURL: cert.certificateURL,
            })),
            volunteering: newProfile.volunteering,
            publications: newProfile.publications,
            languages: newProfile.languages,
            skills: newProfile.skills.map(skill => ({
              id: skill.id || crypto.randomUUID(),
              name: skill.name || '',
              proficiency: skill.proficiency || 'intermediate'
            })),
          };
          
          
          await profileServices.createProfile(user.uid, profileToCreate);
          
          
          setProfile(newProfile);
        }
      } catch (err) {
        console.error('Error in useProfile hook:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch profile');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    
    
    // Only fetch profile if auth is initialized AND we can fetch data (deferred)
    if (initialized && canFetchData) {
      fetchProfile();
    } else {
      
    }

    return () => {
      
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [user, initialized, canFetchData]);

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) {
      console.error('Cannot update profile: No authenticated user or profile found');
      throw new Error('No authenticated user or profile found');
    }

    try {
      
      
      // Process volunteering data to ensure no undefined values
      if (updates.volunteering) {
        
        updates = {
          ...updates,
          volunteering: updates.volunteering.filter(vol => vol !== undefined && vol !== null).map(vol => ({
            ...vol,
            id: vol.id || crypto.randomUUID(),
            position: vol.position || '',
            organization: vol.organization || '',
            startDate: vol.startDate || Timestamp.now(),
            endDate: vol.endDate,
          }))
        };
        
      }
      
      // Process certifications data to ensure no undefined values
      if (updates.certifications) {
        
        updates = {
          ...updates,
          certifications: updates.certifications.filter(cert => cert !== undefined && cert !== null).map(cert => ({
            ...cert,
            id: cert.id || crypto.randomUUID(),
            name: cert.name || '',
            issuer: cert.issuer || '',
            issueDate: cert.issueDate || Timestamp.now(),
            expiryDate: cert.expiryDate,
            certificateURL: cert.certificateURL
          }))
        };
        
      }
      
      // Process education data to ensure no undefined values
      if (updates.education) {
        
        updates = {
          ...updates,
          education: updates.education.filter(edu => edu !== undefined && edu !== null).map(edu => ({
            ...edu,
            id: edu.id || crypto.randomUUID(),
            schoolName: edu.schoolName || '',
            degree: edu.degree || '',
            fieldOfStudy: edu.fieldOfStudy || '',
            startDate: edu.startDate || Timestamp.now(),
            endDate: edu.endDate || null,
            isCurrent: Boolean(edu.isCurrent),
          }))
        };
        
      }
      
      // Process skills data to ensure no undefined values
      if (updates.skills) {
        
        updates = {
          ...updates,
          skills: updates.skills.filter(skill => skill !== undefined && skill !== null).map(skill => ({
            ...skill,
            id: skill.id || crypto.randomUUID(),
            name: skill.name || '',
            proficiency: skill.proficiency || 'intermediate'
          }))
        };
        
      }
      
      
      // Update Firestore
      await profileServices.updateProfile(user.uid, updates);
      
      
      // Update local state immediately with the new values
      const updatedProfile = {
        ...profile,
        ...updates,
        // Special handling for nested objects and arrays
        volunteering: updates.volunteering || profile.volunteering,
        certifications: updates.certifications || profile.certifications,
        education: updates.education || profile.education,
        skills: updates.skills || profile.skills,
        // Ensure city and postalCode are preserved
        city: updates.city !== undefined ? updates.city : profile.city,
        postalCode: updates.postalCode !== undefined ? updates.postalCode : profile.postalCode,
        // Ensure we preserve the existing fields while updating only what changed
        about: 'about' in updates ? updates.about : profile.about,
        bio: 'about' in updates ? updates.about : profile.bio,
        updatedAt: Timestamp.fromDate(new Date())
      };
      
      
      setProfile(updatedProfile);
      
      return true;
    } catch (err) {
      console.error('useProfile - Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      return false;
    }
  };

  return {
    profile,
    loading,
    error,
    updateProfile: updateUserProfile,
  };
}; 