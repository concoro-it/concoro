import { getBlogPageMetadata } from '@/lib/utils/guest-seo-utils'
import type { Metadata } from 'next'

// Generate base metadata for blog pages
export const metadata: Metadata = getBlogPageMetadata()

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}