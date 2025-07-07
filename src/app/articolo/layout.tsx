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

export const metadata = {
  title: 'Articolo | Concoro',
  description: 'Articoli e approfondimenti sui concorsi pubblici. Guide, consigli e informazioni utili per partecipare ai concorsi pubblici in Italia.',
  keywords: 'concorsi pubblici, articoli concorsi, guide concorsi, concorsi italia, concorso pubblico',
  openGraph: {
    title: 'Articolo | Concoro',
    description: 'Articoli e approfondimenti sui concorsi pubblici. Guide, consigli e informazioni utili per partecipare ai concorsi pubblici in Italia.',
    type: 'article',
    url: 'https://concoro.it/articolo',
    images: [
      {
        url: 'https://concoro.it/banner.png',
        width: 1200,
        height: 630,
        alt: 'Concoro Articolo',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Articolo | Concoro',
    description: 'Articoli e approfondimenti sui concorsi pubblici in Italia',
    images: ['https://concoro.it/banner.png'],
  },
  robots: {
    index: true,
    follow: true,
  }
} 