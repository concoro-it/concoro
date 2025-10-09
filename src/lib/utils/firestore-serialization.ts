/**
 * Firestore Serialization Utilities
 * 
 * Converts Firestore Timestamp objects to plain objects that can be passed
 * from Server Components to Client Components in Next.js 14
 */

/**
 * Check if an object is a Firestore Timestamp
 */
function isFirestoreTimestamp(obj: any): boolean {
  if (!obj || typeof obj !== 'object') return false;
  
  // Check for Firebase Admin Timestamp format (with underscore)
  if ('_seconds' in obj && '_nanoseconds' in obj) return true;
  
  // Check for Firebase Client SDK Timestamp format
  if ('seconds' in obj && 'nanoseconds' in obj) return true;
  
  // Check for Timestamp class instance
  if (obj.constructor?.name === 'Timestamp') return true;
  
  return false;
}

/**
 * Convert a Firestore Timestamp to a plain serializable object
 */
function serializeTimestamp(timestamp: any): { _seconds: number; _nanoseconds: number } | null {
  if (!timestamp) return null;
  
  try {
    // Handle Firebase Admin format
    if (timestamp._seconds !== undefined) {
      return {
        _seconds: timestamp._seconds,
        _nanoseconds: timestamp._nanoseconds || 0
      };
    }
    
    // Handle Firebase Client SDK format
    if (timestamp.seconds !== undefined) {
      return {
        _seconds: timestamp.seconds,
        _nanoseconds: timestamp.nanoseconds || 0
      };
    }
    
    // Handle Timestamp instance with toDate method
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      const date = timestamp.toDate();
      return {
        _seconds: Math.floor(date.getTime() / 1000),
        _nanoseconds: (date.getTime() % 1000) * 1000000
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error serializing timestamp:', error);
    return null;
  }
}

/**
 * Deeply serialize an object, converting all Firestore Timestamps
 * to plain objects that can be passed to Client Components
 */
export function deepSerializeFirestoreData<T = any>(data: T): T {
  // Handle null/undefined
  if (data === null || data === undefined) {
    return data;
  }
  
  // Handle primitive types
  if (typeof data !== 'object') {
    return data;
  }
  
  // Handle Date objects
  if (data instanceof Date) {
    return data as any;
  }
  
  // Handle Firestore Timestamps
  if (isFirestoreTimestamp(data)) {
    return serializeTimestamp(data) as any;
  }
  
  // Handle Arrays
  if (Array.isArray(data)) {
    return data.map(item => deepSerializeFirestoreData(item)) as any;
  }
  
  // Handle Objects (recursively)
  const serialized: any = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      serialized[key] = deepSerializeFirestoreData((data as any)[key]);
    }
  }
  
  return serialized;
}

/**
 * Serialize article data specifically (optimized for article structure)
 */
export function serializeArticle(article: any) {
  return deepSerializeFirestoreData(article);
}

/**
 * Serialize an array of articles
 */
export function serializeArticles(articles: any[]) {
  return articles.map(article => deepSerializeFirestoreData(article));
}

/**
 * Convert serialized timestamp back to Date (for client-side use)
 */
export function deserializeTimestamp(timestamp: { _seconds: number; _nanoseconds?: number } | null | undefined): Date | null {
  if (!timestamp || !timestamp._seconds) return null;
  
  try {
    return new Date(timestamp._seconds * 1000);
  } catch {
    return null;
  }
}
