'use client';

import { MainFooter } from '@/components/ui/main-footer';
import { Contact2 } from '@/components/ui/contact-2';
import { CTASection } from '@/components/ui/cta-section';

export default function Contatti() {
  return (
    <main className="min-h-screen bg-background">
      
      {/* Main Contact Section */}
      <Contact2 
        title="Contattaci"
        description="Il team di Concoro è qui per te. Che tu abbia domande, suggerimenti o bisogno di assistenza tecnica, siamo pronti a supportarti."
        email="info@concoro.it"
        web={{ label: "concoro.it", url: "https://www.concoro.it" }}
      />

      {/* CTA Section */}
      <CTASection />
      <MainFooter />
    </main>
  );
} 