import { Metadata } from 'next'
import { PageProps, parseSearchParams } from './types'

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = parseSearchParams(searchParams)
  let title = 'Concorsi Pubblici'
  let description = 'Trova il tuo prossimo concorso pubblico. Migliaia di opportunità nel settore pubblico.'

  // Add filter context to title and description
  if (params.settore) {
    title = `${title} - ${params.settore}`
    description = `Concorsi pubblici nel settore ${params.settore}. `
  }
  if (params.regione?.length === 1) {
    title = `${title} in ${params.regione[0]}`
    description = `${description}Opportunità in ${params.regione[0]}. `
  }
  if (params.regime) {
    title = `${title} ${params.regime}`
    description = `${description}Contratti ${params.regime}. `
  }

  return {
    title: `${title} | Concoro`,
    description,
    openGraph: {
      title: `${title} | Concoro`,
      description,
      type: 'website',
      url: 'https://www.concoro.it/bandi',
    },
    robots: {
      index: true,
      follow: true,
    }
  }
}