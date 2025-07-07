import React from 'react';
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import { db, storage } from '@/lib/firebase/config';

// Get favicon chain for fallbacks
const getFaviconChain = (domain: string): string[] => [
  `https://faviconkit.com/${domain}/32`,
  `https://besticon-demo.herokuapp.com/icon?url=${domain}&size=32`,
  `https://logo.clearbit.com/${domain}`,
  `https://www.google.com/s2/favicons?sz=192&domain=${domain}`,
  `/placeholder_icon.png`,
];

// Utility to slugify text for consistent naming
function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]+/g, "");
}

// Fetch the first working favicon from the chain
async function fetchFirstWorkingFavicon(domain: string): Promise<Blob | null> {
  for (const url of getFaviconChain(domain)) {
    // Skip placeholder, that's our final fallback
    if (url === '/placeholder_icon.png') {
      continue;
    }
    
    try {
      const res = await fetch(url);
      if (res.ok && res.headers.get('content-type')?.startsWith('image/')) {
        const blob = await res.blob();
        // Validate it's actually an image with reasonable size
        if (blob.size > 0 && blob.size < 1024 * 1024) { // Max 1MB
          return blob;
        }
      }
    } catch (err) {
      // Continue to next URL in chain
      console.warn(`Failed to fetch favicon from ${url}:`, err);
      continue;
    }
  }
  return null;
}

// Upload favicon to Firebase Storage
async function uploadFaviconToFirebase(enteName: string, blob: Blob): Promise<string> {
  if (!storage) {
    throw new Error('Firebase Storage is not initialized');
  }
  
  const slugifiedName = slugify(enteName);
  const storageRef = ref(storage, `images/favicons/${slugifiedName}.png`);
  
  // Set metadata
  const metadata = {
    contentType: 'image/png',
    cacheControl: 'public,max-age=86400', // Cache for 24 hours
  };
  
  await uploadBytes(storageRef, blob, metadata);
  return await getDownloadURL(storageRef);
}

// Save favicon URL to Firestore for caching
async function saveFaviconURLToFirestore(enteName: string, downloadURL: string): Promise<void> {
  if (!db) {
    throw new Error('Firestore is not initialized');
  }
  
  const slugifiedName = slugify(enteName);
  const docRef = doc(db, "favicons", slugifiedName);
  
  await setDoc(docRef, { 
    downloadURL, 
    enteName: enteName,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

// Get cached favicon URL from Firestore
async function getCachedFaviconURL(enteName: string): Promise<string | null> {
  if (!db) {
    return null;
  }
  
  try {
    const slugifiedName = slugify(enteName);
    const docRef = doc(db, "favicons", slugifiedName);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.downloadURL || null;
    }
  } catch (error) {
    console.warn('Error getting cached favicon:', error);
  }
  
  return null;
}

// Extract domain from URL
function extractDomain(url: string | undefined): string {
  if (!url) return '';
  
  try {
    // Remove protocol and www
    let domain = url.replace(/^https?:\/\//, '').replace(/^www\./, '');
    // Get domain part only (remove path)
    domain = domain.split('/')[0];
    // Remove port if present
    domain = domain.split(':')[0];
    return domain;
  } catch (error) {
    return '';
  }
}

// Main function to ensure favicon exists and return URL
export async function ensureFaviconExists(enteName: string, paLink?: string): Promise<string> {
  if (!enteName) {
    return '/placeholder_icon.png';
  }
  
  // First, check if we have a cached version
  const cachedURL = await getCachedFaviconURL(enteName);
  if (cachedURL) {
    return cachedURL;
  }
  
  // Extract domain from pa_link
  const domain = extractDomain(paLink);
  if (!domain) {
    return '/placeholder_icon.png';
  }
  
  try {
    // Try to fetch favicon
    const blob = await fetchFirstWorkingFavicon(domain);
    if (!blob) {
      // No working favicon found, cache the placeholder result to avoid future attempts
      await saveFaviconURLToFirestore(enteName, '/placeholder_icon.png');
      return '/placeholder_icon.png';
    }
    
    // Upload to Firebase Storage
    const downloadURL = await uploadFaviconToFirebase(enteName, blob);
    
    // Cache the result in Firestore
    await saveFaviconURLToFirestore(enteName, downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error('Error processing favicon for', enteName, ':', error);
    return '/placeholder_icon.png';
  }
}

// Hook to get favicon URL with loading state
export function useFaviconURL(enteName: string, paLink?: string) {
  const [faviconURL, setFaviconURL] = React.useState<string>('/placeholder_icon.png');
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    if (!enteName) {
      setFaviconURL('/placeholder_icon.png');
      setIsLoading(false);
      return;
    }
    
    let isMounted = true;
    
    ensureFaviconExists(enteName, paLink)
      .then((url) => {
        if (isMounted) {
          setFaviconURL(url);
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Error loading favicon:', err);
          setError(err.message);
          setFaviconURL('/placeholder_icon.png');
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });
    
    return () => {
      isMounted = false;
    };
  }, [enteName, paLink]);
  
  return { faviconURL, isLoading, error };
}

// For backward compatibility, export the original function
export { getFaviconChain }; 