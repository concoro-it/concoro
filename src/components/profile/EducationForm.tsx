"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { DialogFooter } from "@/components/ui/dialog"
import { Timestamp } from "firebase/firestore"
import type { Education } from "@/types"

interface EducationFormProps {
  education?: Education | null
  onSave: (education: Education) => void
  onCancel: () => void
}

export function EducationForm({
  education,
  onSave,
  onCancel,
}: EducationFormProps) {
  const [formData, setFormData] = useState<Omit<Education, "id">>({
    schoolName: education?.schoolName ?? "",
    schoolLogoURL: education?.schoolLogoURL ?? "",
    degree: education?.degree ?? "",
    fieldOfStudy: education?.fieldOfStudy ?? "",
    startDate: education?.startDate ?? Timestamp.now(),
    endDate: education?.endDate ?? null,
    isCurrent: education?.isCurrent ?? false,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      id: education?.id ?? crypto.randomUUID(),
      ...formData,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="school">Scuola*</Label>
            <Input
              id="school"
              value={formData.schoolName}
              onChange={(e) =>
                setFormData({ ...formData, schoolName: e.target.value })
              }
              placeholder="Nome della scuola o università"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="degree">Titolo di studio</Label>
            <Input
              id="degree"
              value={formData.degree}
              onChange={(e) =>
                setFormData({ ...formData, degree: e.target.value })
              }
              placeholder="es. Laurea in Informatica"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="fieldOfStudy">Campo di studio</Label>
            <Input
              id="fieldOfStudy"
              value={formData.fieldOfStudy}
              onChange={(e) =>
                setFormData({ ...formData, fieldOfStudy: e.target.value })
              }
              placeholder="es. Informatica, Economia"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="startDate">Data di inizio</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate instanceof Timestamp ? formData.startDate.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: Timestamp.fromDate(new Date(e.target.value)) })
                }
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="endDate">Data di fine</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate instanceof Timestamp ? formData.endDate.toDate().toISOString().split('T')[0] : ''}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: formData.isCurrent ? null : Timestamp.fromDate(new Date(e.target.value)) })
                }
                disabled={formData.isCurrent}
                required={!formData.isCurrent}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="current"
              checked={formData.isCurrent}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  isCurrent: checked as boolean,
                  endDate: checked ? null : formData.endDate
                })
              }
            />
            <Label htmlFor="current">Attualmente studio qui</Label>
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