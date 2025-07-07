"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Pencil, Trash2 } from "lucide-react"
import type { Skill } from "@/types"
import { SkillsForm } from "./SkillsForm"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog"

interface SkillsSectionProps {
  skills?: Skill[]
  onUpdate: (skills: Skill[]) => void
}

const PROFICIENCY_LABELS = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzato"
} as const;

export function SkillsSection({
  skills = [], // Provide default empty array
  onUpdate,
}: SkillsSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null)

  const handleAdd = () => {
    setEditingSkill(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (skill: Skill) => {
    setEditingSkill(skill)
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    onUpdate(skills.filter((skill) => skill.id !== id))
  }

  const handleSave = (skill: Skill) => {
    if (editingSkill) {
      onUpdate(
        skills.map((item) =>
          item.id === editingSkill.id ? skill : item
        )
      )
    } else {
      onUpdate([...skills, { ...skill, id: crypto.randomUUID() }])
    }
    setIsDialogOpen(false)
  }

  // Group skills by proficiency level
  const groupedSkills = skills.reduce((acc, skill) => {
    const level = skill.proficiency;
    if (!acc[level]) {
      acc[level] = [];
    }
    acc[level].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  return (
    <>
      <Card className="p-3 xs:p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3 xs:mb-4 sm:mb-6">
          <h2 className="text-lg xs:text-xl font-semibold">Competenze</h2>
          <Button variant="ghost" size="sm" className="px-2 xs:px-3" onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-1 xs:mr-2" />
            <span className="xs:inline">Aggiungi</span>
          </Button>
        </div>

        {skills.length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedSkills).map(([level, levelSkills]) => (
              <div key={level} className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  {PROFICIENCY_LABELS[level as keyof typeof PROFICIENCY_LABELS]}
                </h3>
                <div className="flex flex-wrap gap-1 xs:gap-2">
                  {levelSkills.map((skill) => (
                    <div
                      key={skill.id}
                      className="group relative inline-flex items-center rounded-full bg-secondary px-2 xs:px-3 py-1 text-xs xs:text-sm font-medium text-secondary-foreground"
                    >
                      {skill.name}
                      <div className="absolute -right-1 -top-1 hidden group-hover:flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 xs:h-6 w-5 xs:w-6 p-0"
                          onClick={() => handleEdit(skill)}
                        >
                          <Pencil className="h-2 xs:h-3 w-2 xs:w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 xs:h-6 w-5 xs:w-6 p-0"
                          onClick={() => handleDelete(skill.id)}
                        >
                          <Trash2 className="h-2 xs:h-3 w-2 xs:w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs xs:text-sm text-muted-foreground">
            Aggiungi le tue competenze per mostrare le tue capacità
          </p>
        )}
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingSkill ? "Modifica competenza" : "Aggiungi competenza"}
            </DialogTitle>
            <DialogDescription>
              {editingSkill ? "Modifica i dettagli della competenza selezionata" : "Inserisci una nuova competenza al tuo profilo"}
            </DialogDescription>
          </DialogHeader>
          <SkillsForm
            skill={editingSkill}
            onSave={handleSave}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
} 