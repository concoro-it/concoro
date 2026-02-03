// ✅ Metadata is now dynamically generated in individual article pages
// This improves SEO by providing article-specific meta tags server-side

import { Adsense } from "@/components/Adsense";

export default function ArticoloLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      <Adsense />
      {children}
    </div>
  )
}