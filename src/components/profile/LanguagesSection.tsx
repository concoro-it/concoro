"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Pencil, Trash2 } from "lucide-react"
import type { Language } from "@/types"
import { LanguagesForm } from "./LanguagesForm"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog"

interface LanguagesSectionProps {
  languages?: Language[]
  onUpdate: (languages: Language[]) => void
}

// Helper function to convert proficiency level to readable label
const getProficiencyLabel = (proficiency: Language['proficiency']): string => {
  const labels: Record<Language['proficiency'], string> = {
    'native': 'Madrelingua',
    'fluent': 'Avanzato',
    'intermediate': 'Intermedio',
    'basic': 'Elementare'
  }
  return labels[proficiency] || proficiency
}

export function LanguagesSection({
  languages = [], // Provide default empty array
  onUpdate,
}: LanguagesSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingLanguage, setEditingLanguage] = useState<Language | null>(null)

  const handleAdd = () => {
    setEditingLanguage(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (lang: Language) => {
    setEditingLanguage(lang)
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    onUpdate(languages.filter((lang) => lang.id !== id))
  }

  const handleSave = (lang: Language) => {
    if (editingLanguage) {
      onUpdate(
        languages.map((item) =>
          item.id === editingLanguage.id ? lang : item
        )
      )
    } else {
      onUpdate([...languages, { ...lang, id: crypto.randomUUID() }])
    }
    setIsDialogOpen(false)
  }

  // Sort languages by proficiency level
  const proficiencyOrder: Record<string, number> = {
    "native": 0,
    "fluent": 1,
    "intermediate": 2,
    "basic": 3
  }

  const sortedLanguages = [...languages].sort(
    (a, b) => (proficiencyOrder[a.proficiency] || 5) - (proficiencyOrder[b.proficiency] || 5)
  )

  return (
    <>
      <Card className="p-3 xs:p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3 xs:mb-4 sm:mb-6">
          <h2 className="text-lg xs:text-xl font-semibold">Lingue</h2>
          <Button variant="ghost" size="sm" className="px-2 xs:px-3" onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-1 xs:mr-2" />
            <span className="xs:inline">Aggiungi</span>
          </Button>
        </div>

        {sortedLanguages.length > 0 ? (
          <div className="space-y-3 xs:space-y-4">
            {sortedLanguages.map((lang) => (
              <div
                key={lang.id}
                className="group relative p-2 xs:p-3 sm:p-4 rounded-lg border bg-card"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm xs:text-base truncate">{lang.language}</h3>
                    <p className="text-xs xs:text-sm text-muted-foreground truncate">
                      Livello: {getProficiencyLabel(lang.proficiency)}
                    </p>
                  </div>
                  <div className="flex gap-1 xs:gap-2 shrink-0 ml-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => handleEdit(lang)}
                    >
                      <Pencil className="h-3 xs:h-4 w-3 xs:w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => handleDelete(lang.id)}
                    >
                      <Trash2 className="h-3 xs:h-4 w-3 xs:w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs xs:text-sm text-muted-foreground">
            Aggiungi le lingue che conosci per mostrare le tue competenze linguistiche
          </p>
        )}
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingLanguage ? "Modifica lingua" : "Aggiungi lingua"}
            </DialogTitle>
            <DialogDescription>
              {editingLanguage ? "Aggiorna i dettagli della lingua selezionata" : "Aggiungi una nuova lingua al tuo profilo"}
            </DialogDescription>
          </DialogHeader>
          <LanguagesForm
            language={editingLanguage}
            onSave={handleSave}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
} 