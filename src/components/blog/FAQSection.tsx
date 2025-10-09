"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { FAQ } from "@/types/articolo"
import { removeEmojis as removeEmojisUtil, convertMarkdownBoldToH2 } from "@/lib/utils/text-utils"

interface FAQSectionProps {
  faqs: FAQ[]
  title?: string
  articleUrl: string
}

export function FAQSection({ faqs, title = "Domande Frequenti", articleUrl }: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number>(0) // First FAQ open by default

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? -1 : index)
  }

  // Format FAQ answer with markdown support
  const formatAnswer = (text: string | undefined | null): string => {
    if (!text || typeof text !== 'string') return '';
    
    // Remove emojis
    const cleanText = removeEmojisUtil(text);
    
    // Convert markdown (bold, lists)
    const formatted = convertMarkdownBoldToH2(cleanText);
    
    return formatted;
  }

  // Generate FAQ structured data for rich snippets
  useEffect(() => {
    if (faqs && faqs.length > 0) {
      const faqStructuredData = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map(faq => ({
          "@type": "Question",
          "name": removeEmojisUtil(faq.domanda),
          "acceptedAnswer": {
            "@type": "Answer",
            "text": removeEmojisUtil(faq.risposta)
          }
        }))
      }

      // Remove existing FAQ structured data
      const existingScript = document.querySelector('script[type="application/ld+json"][data-faq]')
      if (existingScript) {
        existingScript.remove()
      }

      // Add new FAQ structured data
      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.setAttribute('data-faq', 'true')
      script.textContent = JSON.stringify(faqStructuredData)
      document.head.appendChild(script)

      // Cleanup on unmount
      return () => {
        const scriptToRemove = document.querySelector('script[type="application/ld+json"][data-faq]')
        if (scriptToRemove) {
          scriptToRemove.remove()
        }
      }
    }
  }, [faqs])

  if (!faqs || faqs.length === 0) {
    return null
  }

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{title}</h2>
      <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index}
              className="border-b border-gray-200 last:border-0 pb-4 last:pb-0"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="flex items-center justify-between w-full text-left group"
              >
                <h3 className="text-lg font-semibold text-gray-900 pr-4 group-hover:text-blue-600 transition-colors">
                  {removeEmojisUtil(faq.domanda) || faq.domanda || 'Domanda'}
                </h3>
                <div className="flex-shrink-0">
                  {openIndex === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-500 group-hover:text-blue-600 transition-colors" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500 group-hover:text-blue-600 transition-colors" />
                  )}
                </div>
              </button>
              <div
                className={cn(
                  "overflow-hidden transition-all duration-300 ease-in-out",
                  openIndex === index ? "max-h-[2000px] opacity-100 mt-3" : "max-h-0 opacity-0"
                )}
              >
                <div 
                  className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: formatAnswer(faq.risposta) || faq.risposta || 'Nessuna risposta disponibile' }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
