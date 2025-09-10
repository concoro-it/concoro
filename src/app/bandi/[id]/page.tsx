import { getFirestoreForSSR } from "@/lib/firebase/server-config"
import { redirect, notFound } from 'next/navigation'
import { getBandoUrl, generateBandoSlug, isValidBandoSlug } from '@/lib/utils/bando-slug-utils'
import { Concorso } from '@/types/concorso'
import { serializeConcorso } from '@/lib/utils/serialize-firestore'
import ClientJobPage from '../[...slug]/client-page'

interface PageProps {
  params: { id: string }
}

async function getJobData(id: string): Promise<Concorso | null> {
  try {
    const db = getFirestoreForSSR();
    const jobDoc = await db.collection("concorsi").doc(id).get();
    
    if (jobDoc.exists) {
      const data = jobDoc.data();
      return {
        id: jobDoc.id,
        ...data,
      } as Concorso;
    }
    return null;
  } catch (error) {
    console.error('Error finding job by ID:', error);
    return null;
  }
}

export default async function JobRedirectPage({ params }: PageProps) {
  const job = await getJobData(params.id);
  
  if (!job) {
    notFound();
  }
  
  // Try to generate SEO-friendly URL and redirect
  try {
    const slug = generateBandoSlug(job);
    if (isValidBandoSlug(slug)) {
      // Successfully generated a valid slug, redirect to SEO URL
      redirect(`/bandi/${slug}`);
    } else {
      // Slug generation failed, serve the content directly to avoid redirect loops
      console.log('Serving content directly for concorso with invalid slug:', params.id);
      const serializedJob = serializeConcorso(job);
      return <ClientJobPage job={serializedJob} slug={[params.id]} />;
    }
  } catch (error) {
    console.error('Error generating SEO URL for redirect:', error);
    // Serve content directly as fallback
    const serializedJob = serializeConcorso(job);
    return <ClientJobPage job={serializedJob} slug={[params.id]} />;
  }
}
