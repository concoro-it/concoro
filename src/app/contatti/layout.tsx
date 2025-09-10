import { getContactPageMetadata } from '@/lib/utils/guest-seo-utils'
import type { Metadata } from 'next'

// Generate metadata for contact page
export const metadata: Metadata = getContactPageMetadata()

export default function ContattiLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

