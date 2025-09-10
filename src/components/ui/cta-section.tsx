"use client";
import React from "react";
import { BackgroundBeams } from "@/components/ui/background-beams";
import Link from "next/link";

function CTASection() {
  return (
    <div className="h-[40rem] w-full rounded-md bg-background relative flex flex-col items-center justify-center antialiased">
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="relative mb-4 z-10 text-4xl md:text-6xl bg-clip-text text-transparent bg-gradient-to-b from-foreground to-muted-foreground text-center font-sans font-bold">
        Costruisci il tuo futuro nella pubblica amministrazione
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto my-2 text-sm text-center relative z-10">
          Unisciti a migliaia di candidati che hanno già semplificato la loro ricerca di concorsi pubblici con Concoro. 
          Ricevi notifiche personalizzate, accedi a bandi chiari e trova la tua opportunità ideale nel settore pubblico.
        </p>
        <div className="flex justify-center gap-2 w-full mt-4 relative z-10">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center px-6 py-2 bg-[#0A1F44] text-white rounded-md font-medium hover:bg-opacity-90 transition-colors whitespace-nowrap"
          >
            Inizia subito gratis
          </Link>
        </div>
      </div>
      <BackgroundBeams />
    </div>
  );
}

export { CTASection }; 