'use client';

import { useState } from 'react';
import Link from 'next/link';
import { resetPassword } from '@/lib/auth/auth-utils';
import {
  AuthForm,
  FormField,
  AuthButton,
  AuthError,
  AuthSuccess,
} from '@/components/auth/AuthFormComponents';
import { BrandColumn } from '@/components/auth/BrandColumn';

export default function ResetPasswordPage() {
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;

    try {
      await resetPassword(email);
      setSuccess('Check your inbox for a password reset link.');
      (e.target as HTMLFormElement).reset();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <BrandColumn />

      {/* Form Section */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold mb-8 text-center">Reimposta Password</h2>

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

            <AuthButton type="submit" fullWidth disabled={loading}>
              {loading ? 'Invio link in corso...' : 'Invia Link di Reset'}
            </AuthButton>

            <p className="text-center text-sm text-gray-600 mt-4">
              Ricordi la password?{' '}
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