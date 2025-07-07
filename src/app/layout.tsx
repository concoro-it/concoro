import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ClientLayout } from "@/components/ClientLayout";
import Script from "next/script";
// Import for debugging Firebase
import "@/lib/firebase/debug";

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap', // Improve font loading performance
  preload: true,
  fallback: ['system-ui', 'arial']
});

export const metadata: Metadata = {
  title: "Concoro - Trova la tua prossima opportunità nel settore pubblico",
  description: "Trova la tua prossima opportunità nel settore pubblico",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://concoro.it' || 'http://localhost:3000'),
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it" suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains for faster loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://lh3.googleusercontent.com" />
        
        {/* Google Analytics with Consent Mode - Optimized for performance */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-NVD6N18QWW"
          strategy="lazyOnload"
        />
        <Script id="google-analytics" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            // Initialize consent mode with default denied state
            gtag('consent', 'default', {
              'ad_storage': 'denied',
              'ad_user_data': 'denied',
              'ad_personalization': 'denied', 
              'analytics_storage': 'denied',
              'wait_for_update': 500
            });

            gtag('config', 'G-NVD6N18QWW');

            // Check if user has already consented and update accordingly
            if (typeof window !== 'undefined') {
              const hasConsent = localStorage.getItem('cookieConsent') === 'true';
              if (hasConsent) {
                gtag('consent', 'update', {
                  'ad_storage': 'granted',
                  'ad_user_data': 'granted',
                  'ad_personalization': 'granted',
                  'analytics_storage': 'granted'
                });
              }
            }
          `}
        </Script>
      </head>
      <body className={inter.className}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
} 