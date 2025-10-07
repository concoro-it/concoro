'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { signUp, signInWithGoogle } from '@/lib/auth/auth-utils';
import {
  AuthForm,
  FormField,
  AuthButton,
  AuthDivider,
  AuthError,
  AuthSuccess,
} from '@/components/auth/AuthFormComponents';
import { BrandColumn } from '@/components/auth/BrandColumn';
import type { SignUpFormData } from '@/types/auth';
import { useAuth } from '@/lib/hooks/useAuth';
import { Spinner } from '@/components/ui/spinner';
import Image from 'next/image';

export default function SignUpPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string>('');

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/basic-info');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data: SignUpFormData = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      confirmPassword: formData.get('confirmPassword') as string,
    };

    try {
      await signUp(data);
      setSuccess('Account creato con successo! Controlla la tua email per verificare l\'account.');
      setTimeout(() => {
        router.push('/verify-email');
      }, 3000);
<<<<<<< Updated upstream
    } catch (error: unknown) {
      console.error('Sign up error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
=======
    } catch (error) {
      console.error('Sign up error:', error);
      setError(error instanceof Error ? error.message : 'Si è verificato un errore');
>>>>>>> Stashed changes
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
      // Redirection will be handled by the useEffect
<<<<<<< Updated upstream
    } catch (error: unknown) {
      console.error('Google sign up error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
=======
    } catch (error) {
      console.error('Google sign up error:', error);
      setError(error instanceof Error ? error.message : 'Si è verificato un errore');
>>>>>>> Stashed changes
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="text-center">
          <Spinner variant="infinite" size={48} className="mb-4" />
          <p className="text-muted-foreground">Preparazione registrazione...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      <BrandColumn />

      {/* Form Section */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold mb-8 text-center">Registrati</h2>

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

            <FormField
              name="confirmPassword"
              label="Conferma Password"
              type="password"
              placeholder="Conferma la tua password"
              required
            />

            <AuthButton type="submit" fullWidth disabled={loading}>
              {loading ? 'Registrazione in corso...' : 'Registrati'}
            </AuthButton>

            <AuthDivider />

            <AuthButton
              variant="outline"
              onClick={handleGoogleSignUp}
              fullWidth
              disabled={loading}
            >
              <div className="flex items-center justify-center gap-2">
                <Image src="/google.svg" alt="Google" width={20} height={20} />
                Continua con Google
              </div>
            </AuthButton>

            <p className="text-center text-sm text-gray-600 mt-4">
              Hai già un account?{' '}
              <Link
                href="/signin"
                className="text-primary hover:text-primary/80 font-medium"
              >
                Accedi
              </Link>
            </p>
          </AuthForm>
        </div>
      </div>
    </div>
  );
} 