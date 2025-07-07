import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

function Feature() {
  return (
    <div className="w-full py-20 lg:py-40">
      <div className="container mx-auto">
        <div className="flex gap-4 py-20 lg:py-40 flex-col items-start">
          <div>
            <Badge variant="outline">Piattaforma</Badge>
          </div>
          <div className="flex gap-2 flex-col">
            <h2 className="text-3xl md:text-5xl tracking-tighter lg:max-w-xl font-bold text-[#0A1F44]">
              Come funziona Concoro
            </h2>
            <p className="text-lg max-w-xl lg:max-w-xl leading-relaxed tracking-tight text-muted-foreground">
              La nostra piattaforma semplifica ogni aspetto della ricerca di concorsi pubblici attraverso tecnologie avanzate e un approccio centrato sull'utente.
            </p>
          </div>
          <div className="flex gap-10 pt-12 flex-col w-full">
            <div className="grid grid-cols-1 items-start lg:grid-cols-3 gap-10">
              <div className="flex flex-row gap-6 w-full items-start">
                <Check className="w-4 h-4 mt-2 text-primary" />
                <div className="flex flex-col gap-1">
                  <p className="font-medium">Aggregazione intelligente</p>
                  <p className="text-muted-foreground text-sm">
                    Raccogliamo automaticamente migliaia di bandi ufficiali da fonti certificate.
                  </p>
                </div>
              </div>
              <div className="flex flex-row gap-6 items-start">
                <Check className="w-4 h-4 mt-2 text-primary" />
                <div className="flex flex-col gap-1">
                  <p className="font-medium">Estrazione semplificata</p>
                  <p className="text-muted-foreground text-sm">
                    Convertiamo complessi documenti in informazioni chiare, veloci e facili da consultare.
                  </p>
                </div>
              </div>
              <div className="flex flex-row gap-6 items-start">
                <Check className="w-4 h-4 mt-2 text-primary" />
                <div className="flex flex-col gap-1">
                  <p className="font-medium">AI-Enhanced Matching</p>
                  <p className="text-muted-foreground text-sm">
                    Offriamo consigli personalizzati per trovare i concorsi più adatti ai tuoi interessi e qualifiche.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { Feature }; 