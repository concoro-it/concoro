"use client"

import { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, getFirebaseAuth } from '../firebase/config';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isEmailVerified: boolean;
  initialized: boolean;
}

const defaultContextValue: AuthContextType = {
  user: null,
  loading: true,
  signInWithGoogle: async () => { throw new Error('AuthContext not initialized'); },
  signOut: async () => { throw new Error('AuthContext not initialized'); },
  isEmailVerified: false,
  initialized: false,
};

const AuthContext = createContext<AuthContextType>(defaultContextValue);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [authError, setAuthError] = useState<Error | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let timeoutId: NodeJS.Timeout;

    const initializeAuth = async () => {
      try {
        // Only run on client-side
        if (typeof window === 'undefined') return;

        // Set a timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          setLoading(prevLoading => {
            if (prevLoading) {
              
              setInitialized(true);
              return false;
            }
            return prevLoading;
          });
        }, 3000);

        // Get Firebase auth instance safely
        let authInstance;
        try {
          authInstance = getFirebaseAuth();
          
        } catch (error) {
          console.error("Failed to get Auth instance:", error);
          setAuthError(new Error("Authentication service initialization failed"));
          setLoading(false);
          setInitialized(true);
          return;
        }

        
        unsubscribe = onAuthStateChanged(authInstance, async (user) => {
          
          
          if (user) {
            // Set user and email verification status directly without reloading
            setUser(user);
            setIsEmailVerified(user.emailVerified);
          } else {
            setUser(null);
            setIsEmailVerified(false);
          }
          
          setLoading(false);
          setInitialized(true);
        }, (error) => {
          console.error("Auth state change error:", error);
          setAuthError(error as Error);
          setLoading(false);
          setInitialized(true);
        });
      } catch (error) {
        console.error("Error in auth initialization:", error);
        setAuthError(error as Error);
        setLoading(false);
        setInitialized(true);
      }
    };

    // Initialize auth only on client-side
    if (typeof window !== 'undefined') {
      initializeAuth();
    } else {
      // On server-side, just set initialized to true and loading to false
      setLoading(false);
      setInitialized(true);
    }

    return () => {
      clearTimeout(timeoutId);
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      let authInstance;
      try {
        authInstance = getFirebaseAuth();
      } catch (error) {
        throw new Error("Authentication service not available");
      }
      
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
      let authInstance;
      try {
        authInstance = getFirebaseAuth();
        
      } catch (error) {
        console.error('useAuth: Failed to get auth instance:', error);
        throw new Error("Authentication service not available");
      }
      
      
      await firebaseSignOut(authInstance);
      

      // Clear user state immediately after signout
      setUser(null);
      setIsEmailVerified(false);
      
      // Clear any cached data or state
      if (typeof window !== 'undefined') {
        
        localStorage.clear(); // Clear all localStorage
        sessionStorage.clear();
        
        // Clear any cookies related to authentication
        document.cookie.split(";").forEach((c) => {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
      }
      
      
    } catch (error) {
      console.error('useAuth: Error during signOut:', error);
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
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 