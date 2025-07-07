"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DialogFooter } from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Language } from "@/types"

interface LanguagesFormProps {
  language?: Language | null
  onSave: (language: Language) => void
  onCancel: () => void
}

const PROFICIENCY_LEVELS = [
  { value: "basic", label: "Elementare" },
  { value: "intermediate", label: "Intermedio" },
  { value: "fluent", label: "Avanzato" },
  { value: "native", label: "Madrelingua" },
] as const

export function LanguagesForm({
  language,
  onSave,
  onCancel,
}: LanguagesFormProps) {
  const [formData, setFormData] = useState<Omit<Language, "id">>({
    language: language?.language ?? "",
    proficiency: language?.proficiency ?? "basic",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      id: language?.id ?? crypto.randomUUID(),
      ...formData,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="language">Lingua</Label>
            <Input
              id="language"
              value={formData.language}
              onChange={(e) =>
                setFormData({ ...formData, language: e.target.value })
              }
              placeholder="es. Italiano, Inglese, Spagnolo"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="proficiency">Livello di conoscenza</Label>
            <Select
              value={formData.proficiency}
              onValueChange={(value) =>
                setFormData({ ...formData, proficiency: value as Language["proficiency"] })
              }
            >
              <SelectTrigger id="proficiency">
                <SelectValue placeholder="Seleziona il livello di conoscenza" />
              </SelectTrigger>
              <SelectContent>
                {PROFICIENCY_LEVELS.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Annulla
        </Button>
        <Button type="submit">Salva</Button>
      </DialogFooter>
    </form>
  )
} 