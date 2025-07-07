'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn, signInWithGoogle, isProfileComplete } from '@/lib/auth/auth-utils';
import {
  AuthForm,
  FormField,
  AuthButton,
  AuthDivider,
  AuthError,
  AuthSuccess,
} from '@/components/auth/AuthFormComponents';
import { BrandColumn } from '@/components/auth/BrandColumn';
import { Checkbox } from '@/components/ui/checkbox';
import type { SignInFormData } from '@/types/auth';
import { useAuth } from '@/lib/hooks/useAuth';
import { Spinner } from '@/components/ui/spinner';

export default function SignInPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [timeoutOccurred, setTimeoutOccurred] = useState(false);
  const [success, setSuccess] = useState<string>('');

  // Set a timeout to prevent infinite loading
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (authLoading) {
        
        setTimeoutOccurred(true);
      }
    }, 8000); // 8 second timeout

    return () => clearTimeout(timeoutId);
  }, [authLoading]);

  // Check auth state and redirect accordingly
  useEffect(() => {
    if (authLoading && !timeoutOccurred) return;

    const checkProfileAndRedirect = async () => {
      if (!user) return;

      try {
        const hasProfile = await isProfileComplete(user);
        if (!hasProfile && !isRedirecting) {
          
          setIsRedirecting(true);
          router.push('/basic-info');
        } else if (hasProfile && !isRedirecting) {
          
          setIsRedirecting(true);
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Error checking profile:', error);
      }
    };

    checkProfileAndRedirect();
  }, [user, router, isRedirecting, timeoutOccurred, authLoading]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data: SignInFormData = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    };

    try {
      await signIn(data);
      // Redirection will be handled by the useEffect
    } catch (error: any) {
      console.error('Sign in error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
      // Redirection will be handled by the useEffect
    } catch (error: any) {
      console.error('Google sign in error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while auth initializes
  if (authLoading && !timeoutOccurred) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Spinner variant="infinite" size={48} className="mb-4" />
          <p className="text-muted-foreground">Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <BrandColumn />

      {/* Form Section */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold mb-8 text-center">Accedi</h2>

          <AuthError message={error} />
          <AuthSuccess message={success} />

          <AuthForm onSubmit={handleSubmit}>
            <FormField
              name="email"
              label="Email"
              type="email"
              placeholder="Inserisci la tua email"
              required
            />

            <FormField
              name="password"
              label="Password"
              type="password"
              placeholder="Inserisci la tua password"
              required
            />

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Checkbox id="remember" name="remember" />
                <label
                  htmlFor="remember"
                  className="ml-2 text-sm text-gray-600"
                >
                  Ricordami
                </label>
              </div>
              <Link
                href="/reset-password"
                className="text-sm text-primary hover:text-primary/80"
              >
                Password dimenticata?
              </Link>
            </div>

            <AuthButton type="submit" fullWidth disabled={loading}>
              {loading ? 'Accesso in corso...' : 'Accedi'}
            </AuthButton>

            <AuthDivider />

            <AuthButton
              variant="outline"
              onClick={handleGoogleSignIn}
              fullWidth
              disabled={loading}
            >
              <div className="flex items-center justify-center gap-2">
                <img src="/google.svg" alt="Google" className="w-5 h-5" />
                Continue with Google
              </div>
            </AuthButton>

            <p className="text-center text-sm text-gray-600 mt-4">
              Non hai un account?{' '}
              <Link
                href="/signup"
                className="text-primary hover:text-primary/80 font-medium"
              >
                Registrati
              </Link>
            </p>
          </AuthForm>
        </div>
      </div>
    </div>
  );
} 