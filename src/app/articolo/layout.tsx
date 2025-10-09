// ✅ Metadata is now dynamically generated in individual article pages
// This improves SEO by providing article-specific meta tags server-side

export default function ArticoloLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      {children}
    </div>
  )
} 