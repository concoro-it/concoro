import { Providers } from '@/app/providers';
import { MinimalAuthNavbar } from '@/components/auth/MinimalAuthNavbar';


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