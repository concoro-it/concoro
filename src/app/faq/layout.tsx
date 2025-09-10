import { generateGuestPageMetadata } from '@/lib/utils/guest-seo-utils'
import type { Metadata } from 'next'

// Generate metadata for FAQ page
export const metadata: Metadata = generateGuestPageMetadata({
  title: 'FAQ - Domande Frequenti | Concoro',
  description: 'Risposte alle domande più frequenti su Concoro. Scopri come funziona la piattaforma per trovare concorsi pubblici in Italia.',
  keywords: [
    'faq concoro',
    'domande frequenti',
    'aiuto concoro',
    'come funziona',
    'supporto concorsi',
    'guide concoro'
  ],
  canonical: 'https://www.concoro.it/faq',
  openGraph: {
    type: 'website',
    title: 'FAQ - Domande Frequenti | Concoro',
    description: 'Trova risposte alle domande più comuni su Concoro, la piattaforma leader per concorsi pubblici.',
  }
})

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

