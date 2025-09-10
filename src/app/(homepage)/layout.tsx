import { getHomepageMetadata } from '@/lib/utils/guest-seo-utils'
import type { Metadata } from 'next'

// Generate metadata for homepage
export const metadata: Metadata = getHomepageMetadata()

export default function HomepageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

