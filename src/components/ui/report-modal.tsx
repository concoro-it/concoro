'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Flag, AlertTriangle, Clock, FileX, ExternalLink, Mail } from 'lucide-react';
import { toast } from 'sonner';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  concorsoId: string;
  concorsoTitle: string;
  concorsoEnte: string;
}

export function ReportModal({ isOpen, onClose, concorsoId, concorsoTitle, concorsoEnte }: ReportModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    issueType: '',
    description: '',
    details: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const issueTypes = [
    {
      value: 'informazioni-errate',
      label: 'Informazioni errate',
      description: 'Date, posti disponibili, requisiti o altri dettagli non corretti',
      icon: AlertTriangle,
      color: 'text-orange-500'
    },
    {
      value: 'bando-scaduto',
      label: 'Bando scaduto',
      description: 'Il concorso è già scaduto o chiuso',
      icon: Clock,
      color: 'text-red-500'
    },
    {
      value: 'link-non-funzionante',
      label: 'Link non funzionante',
      description: 'I link non portano alla pagina corretta o sono rotti',
      icon: ExternalLink,
      color: 'text-blue-500'
    },
    {
      value: 'contenuto-inappropriato',
      label: 'Contenuto inappropriato',
      description: 'Contenuto spam, duplicato o non pertinente',
      icon: FileX,
      color: 'text-purple-500'
    },
    {
      value: 'altro',
      label: 'Altro problema',
      description: 'Un problema non elencato sopra',
      icon: Flag,
      color: 'text-gray-500'
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleIssueTypeChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      issueType: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.issueType || !formData.description) {
      toast.error('Per favore compila tutti i campi obbligatori');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          concorsoId,
          concorsoTitle,
          concorsoEnte,
          timestamp: new Date().toISOString()
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Segnalazione inviata con successo. Grazie per il tuo contributo!');
        onClose();
        setFormData({
          name: '',
          email: '',
          issueType: '',
          description: '',
          details: ''
        });
      } else {
        toast.error(data.error || 'Errore durante l\'invio della segnalazione');
      }
    } catch (error) {
      toast.error('Errore di connessione. Riprova più tardi.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedIssueType = issueTypes.find(type => type.value === formData.issueType);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Flag className="w-5 h-5 text-[#0A1F44]" />
            Segnala Problema
          </DialogTitle>
        </DialogHeader>

        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-[#0A1F44] mb-1">{concorsoTitle}</h3>
          <p className="text-sm text-gray-600">{concorsoEnte}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="font-medium text-[#0A1F44]">Informazioni di Contatto</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-[#0A1F44]">Nome (opzionale)</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Il tuo nome"
                  className="border-gray-300 focus:border-[#0A1F44] focus:ring-[#0A1F44]"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-[#0A1F44]">Email (opzionale)</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="la-tua-email@esempio.com"
                  className="border-gray-300 focus:border-[#0A1F44] focus:ring-[#0A1F44]"
                />
              </div>
            </div>
          </div>

          {/* Issue Type */}
          <div className="space-y-4">
            <Label className="text-[#0A1F44] font-medium">Tipo di Problema *</Label>
            <RadioGroup value={formData.issueType} onValueChange={handleIssueTypeChange}>
              <div className="space-y-3">
                {issueTypes.map((issue) => {
                  const Icon = issue.icon;
                  return (
                    <div
                      key={issue.value}
                      className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all ${
                        formData.issueType === issue.value
                          ? 'border-[#0A1F44] bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <RadioGroupItem value={issue.value} id={issue.value} className="mt-1" />
                      <div className="flex-1">
                        <label
                          htmlFor={issue.value}
                          className="cursor-pointer flex items-start space-x-3"
                        >
                          <Icon className={`w-5 h-5 mt-0.5 ${issue.color}`} />
                          <div>
                            <div className="font-medium text-[#0A1F44]">{issue.label}</div>
                            <div className="text-sm text-gray-600">{issue.description}</div>
                          </div>
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </RadioGroup>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-[#0A1F44] font-medium">
              Descrizione del Problema *
            </Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Descrivi il problema che hai riscontrato..."
              className="border-gray-300 focus:border-[#0A1F44] focus:ring-[#0A1F44] min-h-[100px]"
              required
            />
          </div>

          {/* Additional Details */}
          <div className="space-y-2">
            <Label htmlFor="details" className="text-[#0A1F44]">Dettagli Aggiuntivi (opzionale)</Label>
            <Textarea
              id="details"
              name="details"
              value={formData.details}
              onChange={handleInputChange}
              placeholder="Aggiungi eventuali dettagli aggiuntivi che potrebbero essere utili..."
              className="border-gray-300 focus:border-[#0A1F44] focus:ring-[#0A1F44] min-h-[80px]"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Annulla
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-[#0A1F44] hover:bg-[#0A1F44]/90 text-white"
            >
              {isLoading ? 'Invio in corso...' : 'Invia Segnalazione'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 