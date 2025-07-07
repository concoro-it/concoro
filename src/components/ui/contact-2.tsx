import React, { useState } from "react";
import Link from "next/link";
import { Mail, X, Instagram, Facebook, Linkedin, HelpCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Contact2Props {
  title?: string;
  description?: string;
  phone?: string;
  email?: string;
  web?: { label: string; url: string };
}

export const Contact2 = ({
  title = "Contattaci",
  description = "Il team di Concoro è qui per te. Che tu abbia domande, suggerimenti o bisogno di assistenza tecnica, siamo pronti a supportarti.",
  email = "info@concoro.it",
  web = { label: "concoro.it", url: "https://concoro.it" },
}: Contact2Props) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ type: null, message: '' });

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({ type: 'success', message: data.message });
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          subject: '',
          message: ''
        });
      } else {
        setStatus({ type: 'error', message: data.error });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Errore di connessione. Riprova più tardi.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="py-32">
      <div className="container">
        <div className="mx-auto flex max-w-screen-xl flex-col justify-between gap-10 lg:flex-row lg:gap-20">
          <div className="mx-auto flex max-w-sm flex-col justify-between gap-10">
            <div className="text-center lg:text-left">
              <h1 className="text-5xl font-semibold lg:mb-1 lg:text-6xl text-[#0A1F44]">
                {title}
              </h1>
              <p className="mt-3 text-muted-foreground text-gray-600">{description}</p>
            </div>
            <div className="mx-auto w-full max-w-sm lg:mx-0">


          {/* FAQ Section */}
            <div className="pr-4 bg-white rounded-lg mb-6 flex items-center justify-center">
                <div className="flex items-start space-x-3">
                  <div className="flex">
                    <h4 className="text-sm font-medium text-[#0A1F44] mb-1">
                    Consulta le nostre FAQ per trovare risposte immediate
                    </h4>
                    <Link href="/faq">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="border-[#0A1F44] text-[#0A1F44] hover:bg-[#0A1F44] hover:text-white text-xs"
                      >
                        Vai alle FAQ
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>

              



              {/* Social Media */}
              <div className="mb-6">
                <div className="flex space-x-3 mt-6">
                  <Link
                    aria-label="Email"
                    href={`mailto:${email}`}
                    className="p-2.5 rounded-full border border-gray-200 hover:border-[#0A1F44] hover:bg-[#0A1F44] hover:text-white text-[#0A1F44] transition-all hover:-translate-y-1"
                  >
                    <Mail className="h-4 w-4" />
                  </Link>
                  <Link
                    aria-label="Twitter"
                    href="https://x.com/concoro_it"
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-full border border-gray-200 hover:border-[#0A1F44] hover:bg-[#0A1F44] hover:text-white text-[#0A1F44] transition-all hover:-translate-y-1"
                  >
                    <X className="h-4 w-4" />
                  </Link>
                  <Link
                    aria-label="Instagram"
                    href="https://www.instagram.com/concoro_it/"
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-full border border-gray-200 hover:border-[#0A1F44] hover:bg-[#0A1F44] hover:text-white text-[#0A1F44] transition-all hover:-translate-y-1"
                  >
                    <Instagram className="h-4 w-4" />
                  </Link>
                  <Link
                    aria-label="Facebook"
                    href="https://www.facebook.com/concoro"
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-full border border-gray-200 hover:border-[#0A1F44] hover:bg-[#0A1F44] hover:text-white text-[#0A1F44] transition-all hover:-translate-y-1"
                  >
                    <Facebook className="h-4 w-4" />
                  </Link>
                  <Link
                    aria-label="LinkedIn"
                    href="https://www.linkedin.com/company/concoro"
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-full border border-gray-200 hover:border-[#0A1F44] hover:bg-[#0A1F44] hover:text-white text-[#0A1F44] transition-all hover:-translate-y-1"
                  >
                    <Linkedin className="h-4 w-4" />
                  </Link>
                </div>
              </div>


            </div>
          </div>
          <form onSubmit={handleSubmit} className="mx-auto flex max-w-screen-md flex-col gap-6 rounded-lg border border-gray-200 p-10 bg-white shadow-lg">
            {status.type && (
              <div className={`p-4 rounded-lg ${status.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                {status.message}
              </div>
            )}
            
            <div className="flex gap-4">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="firstName" className="text-[#0A1F44] font-medium">Nome *</Label>
                <Input 
                  type="text" 
                  id="firstName" 
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Nome" 
                  required
                  className="border-gray-300 focus:border-[#0A1F44] focus:ring-[#0A1F44]" 
                />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="lastName" className="text-[#0A1F44] font-medium">Cognome *</Label>
                <Input 
                  type="text" 
                  id="lastName" 
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Cognome" 
                  required
                  className="border-gray-300 focus:border-[#0A1F44] focus:ring-[#0A1F44]" 
                />
              </div>
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="email" className="text-[#0A1F44] font-medium">Email *</Label>
              <Input 
                type="email" 
                id="email" 
                value={formData.email}
                onChange={handleChange}
                placeholder="la-tua-email@esempio.com" 
                required
                className="border-gray-300 focus:border-[#0A1F44] focus:ring-[#0A1F44]" 
              />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="subject" className="text-[#0A1F44] font-medium">Oggetto *</Label>
              <Input 
                type="text" 
                id="subject" 
                value={formData.subject}
                onChange={handleChange}
                placeholder="Oggetto del messaggio" 
                required
                className="border-gray-300 focus:border-[#0A1F44] focus:ring-[#0A1F44]" 
              />
            </div>
            <div className="grid w-full gap-1.5">
              <Label htmlFor="message" className="text-[#0A1F44] font-medium">Messaggio *</Label>
              <Textarea 
                placeholder="Descrivi la tua domanda o richiesta..." 
                id="message" 
                value={formData.message}
                onChange={handleChange}
                required
                className="border-gray-300 focus:border-[#0A1F44] focus:ring-[#0A1F44] min-h-[120px]" 
              />
            </div>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-[#0A1F44] hover:bg-[#0A1F44]/90 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Invio in corso...' : 'Invia messaggio'}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}; 