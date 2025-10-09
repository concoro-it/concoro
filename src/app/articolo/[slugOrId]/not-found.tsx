import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileText } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Articolo non trovato | Concoro',
  description: 'L\'articolo che stai cercando non esiste o è stato rimosso.',
  robots: {
    index: false,
    follow: true,
  }
}

export default function ArticleNotFound() {
  return (
    <div className="container mx-auto py-12 px-4 md:px-8 max-w-4xl">
      <div className="text-center py-16">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full">
          <FileText className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Articolo non trovato
        </h1>
        <p className="text-gray-600 mb-8">
          L'articolo che stai cercando non esiste o è stato rimosso.
        </p>
        <Link href="/blog">
          <Button>
            Torna al blog
          </Button>
        </Link>
      </div>
    </div>
  )
}
