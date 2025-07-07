"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { ExperienceForm } from "./ExperienceForm"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog"
import { Timestamp } from "firebase/firestore"
import type { Experience } from "@/types"

interface ExperienceSectionProps {
  experience: Experience[]
  onUpdate: (experience: Experience[]) => void
}

export function ExperienceSection({ experience, onUpdate }: ExperienceSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingExperience, setEditingExperience] = useState<Experience | null>(null)

  const handleAdd = () => {
    setEditingExperience(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (exp: Experience) => {
    setEditingExperience(exp)
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    const experienceArray = Array.isArray(experience) ? experience : []
    onUpdate(experienceArray.filter((exp) => exp.id !== id))
  }

  const handleSave = (exp: Experience) => {
    const experienceArray = Array.isArray(experience) ? experience : []
    if (editingExperience) {
      onUpdate(
        experienceArray.map((item) =>
          item.id === editingExperience.id ? exp : item
        )
      )
    } else {
      onUpdate([...experienceArray, { ...exp, id: crypto.randomUUID() }])
    }
    setIsDialogOpen(false)
  }

  return (
    <>
      <Card className="p-3 xs:p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3 xs:mb-4 sm:mb-6">
          <h2 className="text-lg xs:text-xl font-semibold">Esperienza</h2>
          <Button variant="ghost" size="sm" className="px-2 xs:px-3" onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1 xs:mr-2" />
            <span className="xs:inline">Aggiungi</span>
          </Button>
        </div>

        {Array.isArray(experience) && experience.length > 0 ? (
          <div className="space-y-3 xs:space-y-4 sm:space-y-6">
            {experience.map((exp) => (
              <div key={exp.id} className="flex items-start gap-2 xs:gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm xs:text-base truncate">{exp.positionTitle}</h3>
                  <p className="text-xs xs:text-sm text-muted-foreground truncate">
                    {exp.companyName} • {exp.location}
                  </p>
                  <p className="text-xs xs:text-sm text-muted-foreground truncate">
                    {exp.startDate instanceof Timestamp ? exp.startDate.toDate().toLocaleDateString() : ''} - {
                      exp.isCurrent ? 'Presente' : (exp.endDate instanceof Timestamp ? exp.endDate.toDate().toLocaleDateString() : '')
                    }
                  </p>

                </div>
                <div className="flex gap-1 xs:gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => {
                      setEditingExperience(exp)
                      setIsDialogOpen(true)
                    }}
                  >
                    <Pencil className="h-3 xs:h-4 w-3 xs:w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => handleDelete(exp.id)}
                  >
                    <Trash2 className="h-3 xs:h-4 w-3 xs:w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs xs:text-sm text-muted-foreground">
            Aggiungi la tua esperienza per mostrare il tuo percorso lavorativo
          </p>
        )}
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingExperience ? "Modifica esperienza" : "Aggiungi esperienza"}
            </DialogTitle>
            <DialogDescription>
              {editingExperience ? "Aggiorna i dettagli della tua esperienza lavorativa" : "Aggiungi una nuova esperienza lavorativa al tuo profilo"}
            </DialogDescription>
          </DialogHeader>
          <ExperienceForm
            experience={editingExperience}
            onSave={handleSave}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
} 