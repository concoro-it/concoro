import React from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { getJobPageMetadata, getJobPostingStructuredData } from '@/lib/utils/guest-seo-utils'
import { Metadata } from 'next'

type Props = {
  children: React.ReactNode
  params: { id: string }
}

// Fetch job data server-side for SEO
async function getJobData(id: string) {
  try {
    if (!db) {
      console.error('Firestore not initialized')
      return null
    }
    const jobDoc = await getDoc(doc(db, "concorsi", id))
    if (jobDoc.exists()) {
      return {
        id: jobDoc.id,
        ...jobDoc.data()
      }
    }
  } catch (error) {
    console.error('Error fetching job for SEO:', error)
  }
  return null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const job = await getJobData(params.id)
  
  if (!job) {
    // Fallback metadata for job not found
    return {
      title: 'Concorso Pubblico | Concoro',
      description: 'Dettagli concorso pubblico su Concoro - La piattaforma leader per trovare lavoro nel settore pubblico.',
      robots: {
        index: false,
        follow: true,
      },
    }
  }
  
  return getJobPageMetadata(job)
}

export default async function JobLayout({ children, params }: Props) {
  const job = await getJobData(params.id)
  
  // Generate structured data if job exists
  let jobPostingStructuredData = null
  if (job) {
    try {
      jobPostingStructuredData = getJobPostingStructuredData(job)
    } catch (error) {
      console.error('Error generating job structured data:', error)
    }
  }
  
  return (
    <>
      {/* Job Posting Structured Data */}
      {jobPostingStructuredData && (
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingStructuredData) }}
        />
      )}
      
      {children}
    </>
  )
}
