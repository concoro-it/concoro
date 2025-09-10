"use client"

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isEmailVerified: boolean;
  initialized: boolean;
  isAuthLoaded: boolean;
  initializeAuth: () => Promise<void>;
}

const defaultContextValue: AuthContextType = {
  user: null,
  loading: false,
  signInWithGoogle: async () => { throw new Error('Auth not initialized'); },
  signOut: async () => { throw new Error('Auth not initialized'); },
  isEmailVerified: false,
  initialized: false,
  isAuthLoaded: false,
  initializeAuth: async () => { throw new Error('AuthContext not provided'); },
};

const LazyAuthContext = createContext<AuthContextType>(defaultContextValue);

export function LazyAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);
  const [authError, setAuthError] = useState<Error | null>(null);

  const initializeAuth = useCallback(async () => {
    if (isAuthLoaded) return; // Already loaded
    
    try {
      setLoading(true);
      setIsAuthLoaded(true);
      
      // Only run on client-side
      if (typeof window === 'undefined') return;

      // Dynamic import of Firebase auth to avoid loading it on homepage
      const { getFirebaseAuth } = await import('@/lib/firebase/config');
      
      // Set a timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        setLoading(prevLoading => {
          if (prevLoading) {
            if (process.env.NODE_ENV === 'development') {
              console.log('Auth timeout reached - continuing with no user');
            }
            setInitialized(true);
            return false;
          }
          return prevLoading;
        });
      }, 800);

      // Get Firebase auth instance safely
      let authInstance;
      try {
        authInstance = getFirebaseAuth();
      } catch (error) {
        console.error("Failed to get Auth instance:", error);
        setAuthError(new Error("Authentication service initialization failed"));
        setLoading(false);
        setInitialized(true);
        clearTimeout(timeoutId);
        return;
      }

      const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
        if (user) {
          setUser(user);
          setIsEmailVerified(user.emailVerified);
        } else {
          setUser(null);
          setIsEmailVerified(false);
        }
        
        setLoading(false);
        setInitialized(true);
        clearTimeout(timeoutId);
      }, (error) => {
        if (process.env.NODE_ENV === 'development') {
          console.error("Auth state change error:", error);
        }
        setAuthError(error as Error);
        setLoading(false);
        setInitialized(true);
        clearTimeout(timeoutId);
      });

      // Clean up handled internally - don't return unsubscribe
    } catch (error) {
      console.error("Error in auth initialization:", error);
      setAuthError(error as Error);
      setLoading(false);
      setInitialized(true);
    }
  }, [isAuthLoaded]);

  const signInWithGoogle = async () => {
    try {
      // Ensure auth is loaded before signing in
      if (!isAuthLoaded) {
        await initializeAuth();
      }
      
      const { getFirebaseAuth } = await import('@/lib/firebase/config');
      const authInstance = getFirebaseAuth();
      
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/userinfo.email');
      provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
      
      const result = await signInWithPopup(authInstance, provider);
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      if (!isAuthLoaded) {
        return; // No need to sign out if auth isn't loaded
      }
      
      const { getFirebaseAuth } = await import('@/lib/firebase/config');
      const authInstance = getFirebaseAuth();
      
      await firebaseSignOut(authInstance);

      // Clear user state immediately after signout
      setUser(null);
      setIsEmailVerified(false);
      
      // Clear any cached data or state
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
        
        // Clear any cookies related to authentication
        document.cookie.split(";").forEach((c) => {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
      }
    } catch (error) {
      console.error('Error during signOut:', error);
      throw error;
    }
  };

  // If there's an auth error, throw it
  if (authError) {
    throw authError;
  }

  const contextValue: AuthContextType = {
    user,
    loading,
    signInWithGoogle,
    signOut,
    isEmailVerified,
    initialized,
    isAuthLoaded,
    initializeAuth,
  };

  return (
    <LazyAuthContext.Provider value={contextValue}>
      {children}
    </LazyAuthContext.Provider>
  );
}

export function useLazyAuth(): AuthContextType {
  const context = useContext(LazyAuthContext);
  if (!context) {
    throw new Error('useLazyAuth must be used within a LazyAuthProvider');
  }
  return context;
}
