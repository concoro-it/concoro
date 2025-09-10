"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { UserProfile } from "@/types"

interface EditProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: UserProfile
  onUpdate: (updates: Partial<UserProfile>) => void
}

export function EditProfileDialog({
  open,
  onOpenChange,
  profile,
  onUpdate,
}: EditProfileDialogProps) {
  const [formData, setFormData] = useState({
    firstName: profile.firstName || '',
    lastName: profile.lastName || '',
    region: profile.region || '',
    city: profile.city || '',
    postalCode: profile.postalCode || ''
  })

  // Update form data when profile changes
  useEffect(() => {
    
    setFormData({
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      region: profile.region || '',
      city: profile.city || '',
      postalCode: profile.postalCode || ''
    });
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Log the form data before processing
    
    
    // Create updates object with all fields
    const updates: Partial<UserProfile> = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      displayName: `${formData.firstName} ${formData.lastName}`.trim(),
      city: formData.city.trim(),
      region: formData.region.trim(),
      postalCode: formData.postalCode.trim()
    };
    
    // Log the updates being sent
    
    
    try {
      await onUpdate(updates);
      
      onOpenChange(false);
    } catch (error) {
      console.error('EditProfileDialog - Error updating profile:', error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Modifica profilo</DialogTitle>
          <DialogDescription>
            Compila i campi sottostanti per aggiornare il tuo profilo
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Name Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nome*</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  required
                  onFocus={(e) => {
                    // On iOS, scroll the element into view with additional padding
                    setTimeout(() => {
                      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 300);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Cognome*</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  required
                  onFocus={(e) => {
                    setTimeout(() => {
                      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 300);
                  }}
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-4">
              <h3 className="font-medium">Località</h3>
              <div className="space-y-2">
                <Label htmlFor="city">Città</Label>
                <Input
                  id="city"
                  placeholder="es. Palermo"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  onFocus={(e) => {
                    setTimeout(() => {
                      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 300);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="region">Regione</Label>
                <Input
                  id="region"
                  placeholder="es. Sicilia"
                  value={formData.region}
                  onChange={(e) =>
                    setFormData({ ...formData, region: e.target.value })
                  }
                  onFocus={(e) => {
                    setTimeout(() => {
                      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 300);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">CAP</Label>
                <Input
                  id="postalCode"
                  placeholder="es. 90021"
                  value={formData.postalCode}
                  onChange={(e) =>
                    setFormData({ ...formData, postalCode: e.target.value })
                  }
                  onFocus={(e) => {
                    setTimeout(() => {
                      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 300);
                  }}
                />
              </div>
              <div className="text-sm text-muted-foreground">
                Paese: Italia
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6 pb-4">
            <Button type="submit" className="w-full sm:w-auto">
              Salva
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 