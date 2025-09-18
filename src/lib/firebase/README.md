# Firebase Configuration 🔥

This folder contains the optimized Firebase configuration and services for the Concoro application.

## 📁 **File Structure**

```
/lib/firebase/
├── config.ts          # Client-side Firebase configuration & initialization
├── server-config.ts   # Server-side Firebase Admin configuration
├── services.ts        # Firebase service functions for user profiles
└── README.md          # This documentation
```

## 🚀 **Files Overview**

### **config.ts** - Client-Side Configuration
**Purpose**: Main Firebase configuration for client-side operations  
**Features**:
- ✅ **Lazy initialization** - Services load only when needed
- ✅ **Dynamic imports** - Analytics and Messaging loaded asynchronously  
- ✅ **Environment validation** - Validates API keys and required fields
- ✅ **Error handling** - Comprehensive error handling and logging
- ✅ **Caching** - Firebase instances cached to avoid re-initialization

**Main Exports**:
```typescript
// Lazy initialization functions (recommended)
export function getFirebaseAuth(): Auth
export function getFirebaseFirestore(): Firestore  
export function getFirebaseStorage(): FirebaseStorage
export async function getFirebaseAnalytics(): Promise<any | null>
export async function getFirebaseMessaging(): Promise<any | null>

// Direct exports (backward compatibility)
export { app, auth, db, storage, analytics, messaging }
```

### **server-config.ts** - Server-Side Configuration  
**Purpose**: Firebase Admin SDK configuration for server-side operations  
**Features**:
- ✅ **Cached instances** - Avoids re-initialization on each request
- ✅ **Multiple credential strategies** - Service account file + environment variables
- ✅ **SSR optimized** - Designed for server-side rendering

**Main Exports**:
```typescript
export function initializeFirebaseAdminForSSR(): admin.firestore.Firestore
export function getFirestoreForSSR(): admin.firestore.Firestore
```

### **services.ts** - Profile Services
**Purpose**: Firebase service functions for user profile operations  
**Features**:
- ✅ **Complete CRUD operations** - Create, read, update, delete profiles
- ✅ **Image upload handling** - Firebase Storage integration
- ✅ **Data validation** - Proper type checking and data cleaning
- ✅ **Array operations** - Experience, education, certifications, etc.

**Main Services**:
```typescript
// Profile Management
export const getUserProfile(userId: string): Promise<UserProfile | null>
export const createProfile(userId: string, data: Partial<UserProfile>): Promise<void>
export const updateProfile(userId: string, updates: Partial<UserProfile>): Promise<void>

// Image Upload
export const uploadImage(userId: string, file: File, path: string): Promise<string>

// Profile Sections
export const addExperience(userId: string, experience: Omit<Experience, 'id'>)
export const addEducation(userId: string, education: Omit<Education, 'id'>)
export const addCertification(userId: string, certification: Omit<Certification, 'id'>)
// ... and more
```

---

## 🎯 **Usage Guidelines**

### **Client-Side Usage**
```typescript
// ✅ Recommended: Use lazy initialization
import { getFirebaseAuth, getFirebaseFirestore } from '@/lib/firebase/config'

const auth = getFirebaseAuth()
const db = getFirebaseFirestore()

// ✅ For Analytics/Messaging (async)
const analytics = await getFirebaseAnalytics()
const messaging = await getFirebaseMessaging()
```

### **Server-Side Usage**  
```typescript
// ✅ Server-side operations
import { getFirestoreForSSR } from '@/lib/firebase/server-config'

const db = getFirestoreForSSR()
const snapshot = await db.collection('concorsi').get()
```

### **Profile Services Usage**
```typescript
// ✅ Profile operations
import { getUserProfile, updateProfile } from '@/lib/firebase/services'

const profile = await getUserProfile(userId)
await updateProfile(userId, { firstName: 'John', lastName: 'Doe' })
```

---

## 🔧 **Optimization Benefits**

### **Before Cleanup**
- **5 files** with redundant wrappers
- **Unused debug utilities**
- **Unnecessary indirection** through firebase.ts

### **After Cleanup**
- **3 focused files** with clear purposes
- **No redundant code** or unused utilities
- **Direct imports** without unnecessary wrappers
- **40% reduction** in file count

### **Performance Improvements**
- ✅ **Lazy loading** reduces initial bundle size
- ✅ **Dynamic imports** for Analytics/Messaging  
- ✅ **Cached instances** prevent re-initialization
- ✅ **Optimized server config** for SSR performance

---

## ⚠️ **Important Notes**

### **Environment Variables Required**
```bash
# Client-side (required)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

# Server-side (for SSR)
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
```

### **Service Account File**
For server-side operations, ensure the service account file exists:
```
concoro-fc095-firebase-adminsdk-fbsvc-a817929655.json
```

### **Error Handling**
All Firebase services include comprehensive error handling. Check console logs for detailed error information during development.

---

## 🚨 **Migration Notes**

If you were previously importing from deleted files:

```typescript
// ❌ Old (removed files)
import { firestore } from '@/lib/firebase/firebase'  // DELETED
import { logFirebaseStatus } from '@/lib/firebase/debug'  // DELETED

// ✅ New (direct imports)
import { app as firestore } from '@/lib/firebase/config'
// Debug functionality removed (was unused)
```

---

## 📞 **Support**

For Firebase-related issues:
1. **Check environment variables** are properly set
2. **Verify service account** file exists for server-side operations  
3. **Check console logs** for detailed error messages
4. **Use lazy initialization** functions for better performance

The Firebase configuration is now optimized for performance, maintainability, and clarity.

