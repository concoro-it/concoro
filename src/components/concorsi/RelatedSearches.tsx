"use client";

import Link from 'next/link';
import { Search, MapPin, Building2, Briefcase } from 'lucide-react';

interface RelatedSearchesProps {
  searchTerm: string;
  totalCount: number;
}

export function RelatedSearches({ searchTerm, totalCount }: RelatedSearchesProps) {
  // Generate related searches based on the search term
  const relatedSearches = generateRelatedSearches(searchTerm);
  
  if (relatedSearches.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border p-6 mt-8">
      <div className="flex items-center gap-2 mb-4">
        <Search className="h-5 w-5 text-gray-600" />
        <h2 className="text-xl font-semibold text-gray-900">Ricerche Correlate</h2>
      </div>
      
      <p className="text-gray-600 mb-6">
        Esplora altre opportunità correlate a <strong>{searchTerm}</strong>
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {relatedSearches.map((related, index) => (
          <Link
            key={index}
            href={related.url}
            className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all group"
          >
            <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
              {related.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors mb-1">
                {related.title}
              </h3>
              <p className="text-sm text-gray-500 line-clamp-2">
                {related.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
      
      {/* Additional helpful links */}
      <div className="mt-6 pt-6 border-t">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Cerca per categoria:</h3>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Tutti i concorsi', url: '/concorsi' },
            { label: 'Concorsi Roma', url: '/concorsi?localita=Roma' },
            { label: 'Concorsi Milano', url: '/concorsi?localita=Milano' },
            { label: 'Concorsi Napoli', url: '/concorsi?localita=Napoli' },
            { label: 'Concorsi Torino', url: '/concorsi?localita=Torino' },
            { label: 'Concorsi Bologna', url: '/concorsi?localita=Bologna' }
          ].map((link, index) => (
            <Link
              key={index}
              href={link.url}
              className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-blue-100 hover:text-blue-700 rounded-full transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function generateRelatedSearches(searchTerm: string): Array<{
  title: string;
  description: string;
  url: string;
  icon: React.ReactNode;
}> {
  const term = searchTerm.toLowerCase();
  const related: Array<{
    title: string;
    description: string;
    url: string;
    icon: React.ReactNode;
  }> = [];

  // Job role variations
  const roleVariations: Record<string, string[]> = {
    'infermiere': ['OSS', 'medico', 'tecnico sanitario', 'assistente sanitario'],
    'oss': ['infermiere', 'medico', 'tecnico sanitario', 'assistente sanitario'],
    'medico': ['infermiere', 'OSS', 'tecnico sanitario', 'specialista'],
    'insegnante': ['docente', 'professore', 'maestro', 'educatore'],
    'docente': ['insegnante', 'professore', 'maestro', 'ricercatore'],
    'istruttore': ['funzionario', 'assistente amministrativo', 'segretario', 'collaboratore'],
    'funzionario': ['istruttore', 'dirigente', 'responsabile', 'coordinatore'],
    'dirigente': ['funzionario', 'direttore', 'responsabile', 'coordinatore'],
    'tecnico': ['ingegnere', 'geometra', 'perito', 'specialista tecnico'],
    'ingegnere': ['tecnico', 'architetto', 'perito', 'progettista'],
    'amministrativo': ['segretario', 'istruttore', 'assistente', 'impiegato'],
    'agente': ['ispettore', 'assistente', 'operatore', 'funzionario'],
    'vigile': ['operatore', 'ispettore', 'agente', 'comandante'],
    'bibliotecario': ['archivista', 'documentalista', 'assistente culturale', 'conservatore'],
  };

  // Find related roles
  for (const [key, variations] of Object.entries(roleVariations)) {
    if (term.includes(key)) {
      variations.slice(0, 3).forEach(variation => {
        related.push({
          title: `Concorsi ${variation.charAt(0).toUpperCase() + variation.slice(1)}`,
          description: `Scopri le opportunità per ${variation} nella pubblica amministrazione`,
          url: `/concorsi?search=${encodeURIComponent(variation)}`,
          icon: <Briefcase className="h-5 w-5 text-blue-600" />
        });
      });
      break;
    }
  }

  // Add location-based searches if term is not a location
  const locations = ['Roma', 'Milano', 'Napoli', 'Torino'];
  if (!locations.some(loc => term.includes(loc.toLowerCase()))) {
    related.push({
      title: `${searchTerm} a Roma`,
      description: `Concorsi per ${searchTerm} nella capitale`,
      url: `/concorsi?search=${encodeURIComponent(searchTerm)}&localita=Roma`,
      icon: <MapPin className="h-5 w-5 text-blue-600" />
    });
  }

  // Add entity-based searches
  const entities = [
    { name: 'Comuni', description: 'Concorsi presso i comuni italiani' },
    { name: 'ASL', description: 'Opportunità nel settore sanitario' },
    { name: 'Università', description: 'Posizioni in ambito universitario' },
    { name: 'Ministeri', description: 'Opportunità nei ministeri' }
  ];

  entities.slice(0, 2).forEach(entity => {
    related.push({
      title: `${searchTerm} - ${entity.name}`,
      description: entity.description,
      url: `/concorsi?search=${encodeURIComponent(searchTerm + ' ' + entity.name)}`,
      icon: <Building2 className="h-5 w-5 text-blue-600" />
    });
  });

  // Limit to 6 related searches
  return related.slice(0, 6);
}


