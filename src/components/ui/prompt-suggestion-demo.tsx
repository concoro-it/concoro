"use client"

import {
  PromptInput,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/ui/prompt-input"
import { Button } from "@/components/ui/button"
import { ArrowUpIcon, Sparkles } from "lucide-react"
import { useState } from "react"

/**
 * Card-like prompt suggestion that mimics the screenshot design
 */
function PromptCard({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="bg-slate-50 p-6 rounded-xl text-left hover:bg-slate-100 transition-colors text-sm font-normal h-full"
    >
      {children}
    </button>
  )
}

/**
 * Chess themed prompt suggestions with card-like styling
 */
export function PromptSuggestionBasic() {
  const [inputValue, setInputValue] = useState("")

  const handleSend = () => {
    if (inputValue.trim()) {
      setInputValue("")
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value)
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Main content area with cards */}
      <div className="flex-grow">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <PromptCard onClick={() => setInputValue("Giochiamo a scacchi! Inizio con e4.")}>
            Giochiamo a scacchi! Inizio con e4.
          </PromptCard>

          <PromptCard onClick={() => setInputValue("Sei un personaggio napoleonico esagerato. Giochiamo a scacchi. Inizio con d4.")}>
            Sei un personaggio napoleonico esagerato. Giochiamo a scacchi. Inizio con d4.
          </PromptCard>

          <PromptCard onClick={() => setInputValue("La mia mossa è e4. Commenta la partita come Sherlock Holmes.")}>
            La mia mossa è e4. Commenta la partita come Sherlock Holmes.
          </PromptCard>

          <PromptCard onClick={() => setInputValue("Pedone in d4.")}>
            Pedone in d4.
          </PromptCard>
        </div>
      </div>

      {/* Footer with info banner and input - fixed at bottom */}
      <div className="sticky bottom-0 pt-16 pb-8 bg-white">
        {/* Info banner */}
        <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-700 flex items-center mb-4">
          <span>Gli esperimenti potrebbero avere risultati inaspettati. Condividi il tuo feedback.</span>
          <a href="#" className="ml-auto text-gray-500 hover:text-gray-700 underline text-xs">Scopri di più</a>
        </div>

        {/* Input */}
        <PromptInput
          className="border-input bg-background border shadow-md rounded-full"
          value={inputValue}
          onChange={handleChange}
          onSubmit={handleSend}
        >
          <PromptInputTextarea placeholder="Inserisci una mossa di scacchi..." />
          <PromptInputActions className="justify-end">
            <Button
              size="sm"
              className="size-9 cursor-pointer rounded-full"
              onClick={handleSend}
              disabled={!inputValue.trim()}
              aria-label="Send"
            >
              <ArrowUpIcon className="h-4 min-h-4 min-w-4 w-4" />
            </Button>
          </PromptInputActions>
        </PromptInput>
      </div>
    </div>
  )
} 