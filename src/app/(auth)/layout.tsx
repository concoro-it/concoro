import { Inter } from 'next/font/google';
import { Providers } from '@/app/providers';
import { MinimalAuthNavbar } from '@/components/auth/MinimalAuthNavbar';

const inter = Inter({ subsets: ['latin'] });

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Providers>
      <MinimalAuthNavbar />
      {children}
    </Providers>
  )
} 