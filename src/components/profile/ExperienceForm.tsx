"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Timestamp } from "firebase/firestore"
import type { Experience } from "@/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ExperienceFormProps {
  experience?: Experience | null
  onSave: (experience: Experience) => void
  onCancel: () => void
}

export function ExperienceForm({
  experience,
  onSave,
  onCancel,
}: ExperienceFormProps) {
  const [formData, setFormData] = useState({
    positionTitle: "",
    companyName: "",
    location: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
    skills: [] as string[],
  })

  useEffect(() => {
    if (experience) {
      setFormData({
        positionTitle: experience.positionTitle || "",
        companyName: experience.companyName || "",
        location: experience.location || "",
        startDate: experience.startDate instanceof Timestamp 
          ? experience.startDate.toDate().toISOString().split('T')[0] 
          : "",
        endDate: experience.endDate instanceof Timestamp 
          ? experience.endDate.toDate().toISOString().split('T')[0] 
          : "",
        isCurrent: experience.isCurrent || false,
        skills: experience.skills || [],
      })
    }
  }, [experience])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const experienceData: Experience = {
      id: experience?.id || crypto.randomUUID(),
      positionTitle: formData.positionTitle,
      companyName: formData.companyName,
      location: formData.location,
      startDate: formData.startDate ? Timestamp.fromDate(new Date(formData.startDate)) : Timestamp.now(),
      endDate: formData.isCurrent || !formData.endDate 
        ? null 
        : Timestamp.fromDate(new Date(formData.endDate)),
      isCurrent: formData.isCurrent,
      skills: formData.skills,
    }

    onSave(experienceData)
  }

  const handleInputChange = (field: string, value: string | boolean | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="positionTitle">Titolo del lavoro*</Label>
            <Input
              id="positionTitle"
              value={formData.positionTitle}
              onChange={(e) => handleInputChange("positionTitle", e.target.value)}
              placeholder="Es. Sviluppatore Software"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="companyName">Azienda*</Label>
            <Input
              id="companyName"
              value={formData.companyName}
              onChange={(e) => handleInputChange("companyName", e.target.value)}
              placeholder="Es. Google"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="location">Località</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
              placeholder="Es. Milano, Italia"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="startDate">Data di inizio*</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange("startDate", e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="endDate">Data di fine</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange("endDate", e.target.value)}
                disabled={formData.isCurrent}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isCurrent"
              checked={formData.isCurrent}
              onCheckedChange={(checked) => {
                handleInputChange("isCurrent", checked as boolean)
                if (checked) {
                  handleInputChange("endDate", "")
                }
              }}
            />
            <Label htmlFor="isCurrent" className="text-sm">
              Lavoro ancora qui
            </Label>
          </div>


        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annulla
        </Button>
        <Button type="submit">
          {experience ? "Aggiorna" : "Aggiungi"}
        </Button>
      </div>
    </form>
  )
} 