import { getAboutPageMetadata } from '@/lib/utils/guest-seo-utils'
import type { Metadata } from 'next'

// Generate metadata for about page
export const metadata: Metadata = getAboutPageMetadata()

export default function ChiSiamoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

