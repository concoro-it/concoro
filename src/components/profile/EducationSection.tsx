"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Pencil, Trash2 } from "lucide-react"
import Image from "next/image"
import type { Education } from "@/types"
import { EducationForm } from "./EducationForm"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog"
import { Timestamp } from "firebase/firestore"

interface EducationSectionProps {
  education: Education[]
  onUpdate: (education: Education[]) => void
}

export function EducationSection({ education, onUpdate }: EducationSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEducation, setEditingEducation] = useState<Education | null>(null)

  const handleAdd = () => {
    setEditingEducation(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (edu: Education) => {
    setEditingEducation(edu)
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    onUpdate(education.filter((edu) => edu.id !== id))
  }

  const handleSave = (edu: Education) => {
    if (editingEducation) {
      onUpdate(
        education.map((item) =>
          item.id === editingEducation.id ? edu : item
        )
      )
    } else {
      onUpdate([...education, { ...edu, id: crypto.randomUUID() }])
    }
    setIsDialogOpen(false)
  }

  return (
    <>
      <Card className="p-3 xs:p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3 xs:mb-4 sm:mb-6">
          <h2 className="text-lg xs:text-xl font-semibold">Istruzione</h2>
          <Button variant="ghost" size="sm" className="px-2 xs:px-3" onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1 xs:mr-2" />
            <span className="xs:inline">Aggiungi</span>
          </Button>
        </div>

        {education?.length ? (
          <div className="space-y-3 xs:space-y-4 sm:space-y-6">
            {education.map((edu) => (
              <div key={edu.id} className="flex items-start gap-2 xs:gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm xs:text-base truncate">{edu.schoolName}</h3>
                  <p className="text-xs xs:text-sm text-muted-foreground truncate">
                    {edu.degree} {edu.fieldOfStudy && `in ${edu.fieldOfStudy}`}
                  </p>
                  <p className="text-xs xs:text-sm text-muted-foreground truncate">
                    {edu.startDate instanceof Timestamp ? edu.startDate.toDate().toLocaleDateString() : ''} - {edu.endDate instanceof Timestamp ? edu.endDate.toDate().toLocaleDateString() : ''}
                  </p>

                </div>
                <div className="flex gap-1 xs:gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => {
                      setEditingEducation(edu)
                      setIsDialogOpen(true)
                    }}
                  >
                    <Pencil className="h-3 xs:h-4 w-3 xs:w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => handleDelete(edu.id)}
                  >
                    <Trash2 className="h-3 xs:h-4 w-3 xs:w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs xs:text-sm text-muted-foreground">
            Aggiungi la tua istruzione per mostrare la tua formazione
          </p>
        )}
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingEducation ? "Modifica istruzione" : "Aggiungi istruzione"}
            </DialogTitle>
            <DialogDescription>
              {editingEducation ? "Aggiorna i dettagli del tuo percorso di istruzione" : "Aggiungi un nuovo percorso di istruzione al tuo profilo"}
            </DialogDescription>
          </DialogHeader>
          <EducationForm
            education={editingEducation}
            onSave={handleSave}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
} 