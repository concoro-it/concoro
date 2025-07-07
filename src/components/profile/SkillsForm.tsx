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
import type { Skill } from "@/types"

interface SkillsFormProps {
  skill?: Skill | null
  onSave: (skill: Skill) => void
  onCancel: () => void
}

export function SkillsForm({
  skill,
  onSave,
  onCancel,
}: SkillsFormProps) {
  const [formData, setFormData] = useState<Omit<Skill, "id">>({
    name: skill?.name ?? "",
    proficiency: skill?.proficiency ?? "intermediate"
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      id: skill?.id ?? crypto.randomUUID(),
      ...formData,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome competenza*</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="es. React, Node.js, Python"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="proficiency">Livello di competenza*</Label>
            <Select
              value={formData.proficiency}
              onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') =>
                setFormData({ ...formData, proficiency: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleziona il livello" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Principiante</SelectItem>
                <SelectItem value="intermediate">Intermedio</SelectItem>
                <SelectItem value="advanced">Avanzato</SelectItem>
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