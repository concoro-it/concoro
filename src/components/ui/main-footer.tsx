"use client";

import Link from "next/link";
import Image from "next/image";
import { Mail, X, Instagram, Facebook, Linkedin, Heart, BriefcaseBusiness } from "lucide-react";
import Footer from "@/components/ui/footer";
import { DynamicLogo } from "@/components/ui/dynamic-logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const navigation = {
  categories: [
    {
      id: "concoro",
      name: "Concoro",
      sections: [
        {
          id: "about",
          name: "About",
          items: [
            { name: "Chi siamo", href: "/chi-siamo" },
            { name: "Prezzi", href: "/prezzi" },
          ],
        },
        {
          id: "features",
          name: "Features",
          items: [
            { name: "Ricerca concorsi", href: "/bandi" },
            { name: "Blog", href: "/blog" },
          ],
        },
        {
          id: "resources",
          name: "Risorse",
          items: [
            { name: "FAQ", href: "/faq" },
            { name: "Privacy", href: "/privacy-policy" },
          ],
        },
        {
          id: "support",
          name: "Supporto",
          items: [
            { name: "Termini di servizio", href: "/termini-di-servizio" },
            { name: "Contatti", href: "/contatti" },
          ],
        },
      ],
    },
  ],
};

const SocialButton = `hover:-translate-y-1 rounded-full p-2.5 transition-all hover:bg-white/10/10`;

export function MainFooter() {
  return (
    <footer className="bg-dark-primary text-dark-text-primary w-full px-2">
      <div className="relative mx-auto grid max-w-7xl items-center justify-center gap-6 p-10 pb-0 md:flex ">
        <Link href="/">
          <p className="flex items-center justify-center">
            <DynamicLogo
              lightSrc="/footer-logo-light.svg"
              darkSrc="/footer-logo-dark.svg"
              alt="Concoro"
              width={120}
              height={40}
            />
          </p>
        </Link>
        <p className="bg-transparent text-center text-xs leading-4 text-dark-text-muted md:text-left">
          Concoro è la piattaforma che semplifica la ricerca e la partecipazione ai concorsi pubblici in Italia.
          Raccogliamo e aggiorniamo i dati ogni giorno da Gazzetta Ufficiale, inPA e altri portali pubblici,
          offrendo un'esperienza chiara e intuitiva per trovare il tuo prossimo lavoro nel settore pubblico.
        </p>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="border-b border-dark-border"> </div>
        <div className="py-10">
          {navigation.categories.map((category) => (
            <div
              key={category.name}
              className="grid grid-cols-2 flex-row justify-between gap-6 leading-6 md:flex"
            >
              {category.sections.map((section) => (
                <div key={section.name}>
                  <ul
                    role="list"
                    aria-labelledby={`${category.id}-${section.id}-heading-mobile`}
                    className="flex flex-col space-y-2"
                  >
                    {section.items.map((item) => (
                      <li key={item.name} className="flow-root">
                        <Link
                          href={item.href}
                          className="text-sm text-dark-text-secondary hover:text-dark-text-primary md:text-xs"
                        >
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="border-b border-dark-border"> </div>
      </div>

      <div className="flex flex-wrap justify-center gap-y-6">
        <div className="flex flex-wrap items-center justify-center gap-6 gap-y-4 px-6">
          <Link
            aria-label="Email"
            href="mailto:info@concoro.it"
            rel="noreferrer"
            target="_blank"
            className={SocialButton}
          >
            <Mail strokeWidth={1.5} className="h-5 w-5 text-dark-text-primary" />
          </Link>
          <Link
            aria-label="Twitter"
            href="https://x.com/concoro_it"
            rel="noreferrer"
            target="_blank"
            className={SocialButton}
          >
            <X className="h-5 w-5 text-dark-text-primary" />
          </Link>
          <Link
            aria-label="Instagram"
            href="https://www.instagram.com/concoro_it/"
            rel="noreferrer"
            target="_blank"
            className={SocialButton}
          >
            <Instagram className="h-5 w-5 text-dark-text-primary" />
          </Link>
          <Link
            aria-label="Facebook"
            href="https://www.facebook.com/concoro"
            rel="noreferrer"
            target="_blank"
            className={SocialButton}
          >
            <Facebook className="h-5 w-5 text-dark-text-primary" />
          </Link>
          <Link
            aria-label="LinkedIn"
            href="https://www.linkedin.com/company/concoro"
            rel="noreferrer"
            target="_blank"
            className={SocialButton}
          >
            <Linkedin className="h-5 w-5 text-dark-text-primary" />
          </Link>
          <ThemeToggle />
        </div>
        <Footer />
      </div>

      <div className="mx-auto mb-10 mt-10 flex flex-col justify-between text-center text-xs md:max-w-7xl">
        <div className="flex flex-row items-center justify-center gap-1 text-dark-text-secondary">
          <span> © </span>
          <span>{new Date().getFullYear()}</span>
          <span>Concoro</span>
          <Heart className="text-dark-text-primary mx-1 h-4 w-4 fill-dark-text-primary animate-pulse" />
          <span>Tutti i diritti riservati</span>
          <BriefcaseBusiness className="text-dark-text-primary mx-1 h-4 w-4 fill-dark-text-primary animate-pulse" />
          <span>P.IVA: IT07070220822</span>

        </div>
      </div>
    </footer>
  );
} 