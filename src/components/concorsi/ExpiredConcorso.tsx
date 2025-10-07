"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, Calendar, Building2, MapPin, ExternalLink } from "lucide-react"
import Link from "next/link"
import { Concorso } from "@/types/concorso"

interface ExpiredConcorsoProps {
  concorso: Concorso;
}

export function ExpiredConcorso({ concorso }: ExpiredConcorsoProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-3xl mx-auto">
          <CardContent className="p-8">
            {/* Icon and Title */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-amber-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Questo Concorso è Scaduto
              </h1>
              <p className="text-gray-600">
                Il bando di concorso che stai cercando è stato chiuso e non accetta più candidature.
              </p>
            </div>

            {/* Concorso Details */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Dettagli del Concorso Scaduto</h2>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Titolo</p>
                  <p className="font-medium text-gray-900">{concorso.Titolo}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1 flex items-center">
                      <Building2 className="w-4 h-4 mr-1" />
                      Ente
                    </p>
                    <p className="font-medium">{concorso.Ente}</p>
                  </div>

                  {concorso.AreaGeografica && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1 flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        Località
                      </p>
                      <p className="font-medium">{concorso.AreaGeografica}</p>
                    </div>
                  )}

                  {concorso.DataChiusura && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1 flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Data di Chiusura
                      </p>
                      <p className="font-medium">
                        {typeof concorso.DataChiusura === 'object' && 'seconds' in concorso.DataChiusura
                          ? new Date(concorso.DataChiusura.seconds * 1000).toLocaleDateString('it-IT')
                          : concorso.DataChiusura}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Call to Actions */}
            <div className="space-y-4">
              <div className="border-t pt-6">
                <h3 className="font-semibold mb-3">Cosa Puoi Fare Ora:</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* View Similar Concorsi from Same Ente */}
                  {concorso.Ente && (
                    <Button asChild variant="default" className="w-full">
                      <Link href={`/concorsi?ente=${encodeURIComponent(concorso.Ente)}`}>
                        <Building2 className="w-4 h-4 mr-2" />
                        Altri Concorsi di {concorso.Ente.split(' ').slice(0, 3).join(' ')}
                      </Link>
                    </Button>
                  )}

                  {/* View Concorsi in Same Location */}
                  {concorso.AreaGeografica && (
                    <Button asChild variant="outline" className="w-full">
                      <Link href={`/concorsi?localita=${encodeURIComponent(concorso.AreaGeografica.split(',')[0].trim())}`}>
                        <MapPin className="w-4 h-4 mr-2" />
                        Concorsi in {concorso.AreaGeografica.split(',')[0].trim()}
                      </Link>
                    </Button>
                  )}

                  {/* View All Active Concorsi */}
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/concorsi">
                      Vedi Tutti i Concorsi Aperti
                    </Link>
                  </Button>

                  {/* View on INPA (if still available there) */}
                  {concorso.Link && (
                    <Button asChild variant="ghost" className="w-full">
                      <a href={concorso.Link} target="_blank" rel="noopener noreferrer">
                        Visualizza su INPA
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              {/* Additional Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <p className="text-sm text-blue-800">
                  <strong>💡 Suggerimento:</strong> Iscriviti a Concoro per ricevere notifiche sui nuovi concorsi 
                  che corrispondono al tuo profilo e non perdere mai un'opportunità!
                </p>
                <Button asChild className="mt-3 w-full" size="sm">
                  <Link href="/signup">
                    Registrati Gratuitamente
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

