export default function BlogLayout({
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

export const metadata = {
  title: 'Blog | Concoro',
  description: 'Articoli e approfondimenti sui concorsi pubblici in Italia. Consigli, guide e informazioni utili per partecipare ai concorsi.',
  keywords: 'concorsi pubblici, blog concorsi, articoli concorsi, guide concorsi, concorsi italia',
  openGraph: {
    title: 'Blog | Concoro',
    description: 'Articoli e approfondimenti sui concorsi pubblici in Italia. Consigli, guide e informazioni utili per partecipare ai concorsi.',
    type: 'website',
    url: 'https://concoro.it/blog',
    images: [
      {
        url: 'https://concoro.it/banner.png',
        width: 1200,
        height: 630,
        alt: 'Concoro Blog',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog | Concoro',
    description: 'Articoli e approfondimenti sui concorsi pubblici in Italia',
    images: ['https://concoro.it/banner.png'],
  },
  robots: {
    index: true,
    follow: true,
  }
} 