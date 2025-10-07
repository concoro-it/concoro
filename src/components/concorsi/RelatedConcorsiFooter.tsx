"use client";

import Link from 'next/link';
import { MapPin, Building2, Briefcase, ArrowRight } from 'lucide-react';
import { MainFooter } from '@/components/ui/main-footer';
import { CTASection } from '@/components/ui/cta-section';

interface RelatedLink {
  label: string;
  href: string;
  icon: React.ReactNode;
  description: string;
}

export function RelatedConcorsiFooter() {
  const popularLocations: RelatedLink[] = [
    {
      label: 'Concorsi a Roma',
      href: '/concorsi?localita=Roma',
      icon: <MapPin className="w-4 h-4" />,
      description: 'Opportunità nella capitale'
    },
    {
      label: 'Concorsi a Milano',
      href: '/concorsi?localita=Milano',
      icon: <MapPin className="w-4 h-4" />,
      description: 'Lavoro nel Nord Italia'
    },
    {
      label: 'Concorsi a Napoli',
      href: '/concorsi?localita=Napoli',
      icon: <MapPin className="w-4 h-4" />,
      description: 'Opportunità in Campania'
    },
    {
      label: 'Concorsi in Lombardia',
      href: '/concorsi?localita=Lombardia',
      icon: <MapPin className="w-4 h-4" />,
      description: 'Regione più ricca d\'Italia'
    }
  ];

  const popularEnti: RelatedLink[] = [
    {
      label: 'Concorsi Comuni',
      href: '/concorsi?ente=Comune',
      icon: <Building2 className="w-4 h-4" />,
      description: 'Enti locali'
    },
    {
      label: 'Concorsi ASL',
      href: '/concorsi?ente=ASL',
      icon: <Building2 className="w-4 h-4" />,
      description: 'Sanità pubblica'
    },
    {
      label: 'Concorsi Università',
      href: '/concorsi?ente=Università',
      icon: <Building2 className="w-4 h-4" />,
      description: 'Mondo accademico'
    },
    {
      label: 'Concorsi Ministeri',
      href: '/concorsi?ente=Ministero',
      icon: <Building2 className="w-4 h-4" />,
      description: 'Amministrazione centrale'
    }
  ];

  const popularRoles: RelatedLink[] = [
    {
      label: 'Istruttore Amministrativo',
      href: '/concorsi?search=Istruttore+Amministrativo',
      icon: <Briefcase className="w-4 h-4" />,
      description: 'Ruolo amministrativo'
    },
    {
      label: 'Dirigente',
      href: '/concorsi?search=Dirigente',
      icon: <Briefcase className="w-4 h-4" />,
      description: 'Posizioni dirigenziali'
    },
    {
      label: 'Infermiere',
      href: '/concorsi?search=Infermiere',
      icon: <Briefcase className="w-4 h-4" />,
      description: 'Professioni sanitarie'
    },
    {
      label: 'Assistente Sociale',
      href: '/concorsi?search=Assistente+Sociale',
      icon: <Briefcase className="w-4 h-4" />,
      description: 'Servizi sociali'
    }
  ];

  const renderLinks = (links: RelatedLink[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {links.map((link, index) => (
        <Link
          key={index}
          href={link.href}
          className="group flex items-start p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
        >
          <div className="flex-shrink-0 p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
            {link.icon}
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-700 transition-colors">
                {link.label}
              </h4>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </div>
            <p className="text-xs text-gray-500 mt-1">{link.description}</p>
          </div>
        </Link>
      ))}
    </div>
  );

  return (
    <div className="bg-gray-50 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Esplora Altri Concorsi Pubblici
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Trova il concorso perfetto per te esplorando per località, ente o ruolo professionale
            </p>
          </div>

          {/* Popular Locations */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              <h3 className="text-xl font-semibold text-gray-900">Concorsi per Località</h3>
            </div>
            {renderLinks(popularLocations)}
          </div>

          {/* Popular Enti */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <h3 className="text-xl font-semibold text-gray-900">Concorsi per Ente</h3>
            </div>
            {renderLinks(popularEnti)}
          </div>

          {/* Popular Roles */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              <h3 className="text-xl font-semibold text-gray-900">Concorsi per Ruolo</h3>
            </div>
            {renderLinks(popularRoles)}
          </div>


        </div>
      </div>
      
      {/* CTA Section with background beams */}
      <CTASection />
      
      {/* Main Footer with company info, social links, etc. */}
      <MainFooter />
    </div>
  );
}
