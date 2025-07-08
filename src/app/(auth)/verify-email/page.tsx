'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { resendVerificationEmail } from '@/lib/auth/auth-utils';
import { AuthButton, AuthError, AuthSuccess } from '@/components/auth/AuthFormComponents';
import { BrandColumn } from '@/components/auth/BrandColumn';
import { useAuth } from '@/lib/hooks/useAuth';
import { Spinner } from '@/components/ui/spinner';

export default function VerifyEmailPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isEmailVerified, initialized, loading: authLoading } = useAuth();
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [timeoutOccurred, setTimeoutOccurred] = useState(false);

  // Set a timeout to prevent infinite loading
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (authLoading) {
        
        setTimeoutOccurred(true);
      }
    }, 8000); // 8 second timeout

    return () => clearTimeout(timeoutId);
  }, [authLoading]);

  // Poll for email verification status
  useEffect(() => {
    if (!initialized && !timeoutOccurred) return; // Wait for auth to initialize

    // If no user exists and we're not on signup, redirect to signin
    if (!user && pathname !== '/signup') {
      
      router.push('/signin');
      return;
    }

    // If user is verified, redirect to basic-info or appropriate next step
    if (user?.emailVerified && !isRedirecting) {
      
      setIsRedirecting(true);
      router.push('/basic-info');
      return;
    }

    const checkVerification = async () => {
      if (!user || isRedirecting) return; // Don't check if no user or already redirecting

      try {
        await user.reload();
        if (user.emailVerified) {
          
          setIsRedirecting(true);
          router.push('/basic-info');
        }
      } catch (error) {
        console.error('Error checking verification status:', error);
      }
    };

    const interval = setInterval(checkVerification, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [user, isEmailVerified, router, initialized, pathname, isRedirecting, timeoutOccurred]);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResendVerification = async () => {
    if (!user || countdown > 0) return;

    try {
      setLoading(true);
      setError('');
      await resendVerificationEmail(user);
      setSuccess('Email di verifica inviata! Controlla la tua casella di posta.');
      setCountdown(60); // Start 60-second countdown
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while auth initializes
  if (authLoading && !timeoutOccurred) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="text-center">
          <Spinner variant="infinite" size={48} className="mb-4" />
          <p className="text-muted-foreground">Verifying your email status...</p>
        </div>
      </div>
    );
  }

  // Redirect if no user
  if (!user && !timeoutOccurred) {
    return null;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      <BrandColumn />

      {/* Content Section */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-md text-center">
          <h2 className="text-3xl font-bold mb-4">Controlla la tua Email</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Per favore controlla la tua casella di posta per confermare il tuo indirizzo email
          </p>

          <div className="bg-card p-6 rounded-lg shadow-sm border mb-8">
            <p className="text-base text-muted-foreground mb-2">
              Abbiamo inviato un'email di verifica a:
            </p>
            <p className="text-lg font-medium mb-4">{user?.email}</p>
            <p className="text-sm text-muted-foreground">
              Clicca sul link nell'email per verificare il tuo account.
              <br />
              Se non la vedi, controlla la cartella spam.
            </p>
          </div>

          <AuthError message={error} />
          <AuthSuccess message={success} />

          <div className="bg-muted/50 p-6 rounded-lg">
            <h3 className="text-base font-medium mb-4">Non hai ricevuto l'email?</h3>
            <AuthButton
              onClick={handleResendVerification}
              fullWidth
              disabled={loading || countdown > 0}
            >
              {countdown > 0
                ? `Rinvia tra ${countdown}s`
                : loading
                ? 'Invio in corso...'
                : 'Rinvia Email di Verifica'}
            </AuthButton>
          </div>

          <div className="mt-8">
            <AuthButton
              variant="outline"
              onClick={() => router.push('/signin')}
              fullWidth
            >
              Torna all'Accesso
            </AuthButton>
          </div>
        </div>
      </div>
    </div>
  );
} 