import { getBandiListingMetadata } from '@/lib/utils/guest-seo-utils'
import type { Metadata } from 'next'

// Generate metadata for bandi pages
export const metadata: Metadata = getBandiListingMetadata()

export default function BandiLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}