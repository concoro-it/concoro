"use client"

import { useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Icons } from "@/components/ui/icons"
import { motion } from "framer-motion"
import { TestimonialsColumn } from "@/components/ui/testimonials-columns-1"

// Importing the type from testimonials-columns-1 to avoid conflicts
import type { Testimonial as ColumnTestimonial } from "@/components/ui/testimonials-columns-1"

interface Testimonial {
  image: string
  name: string
  username?: string
  role?: string
  text: string
  social?: string
}

interface TestimonialsProps {
  testimonials: Testimonial[]
  className?: string
  title?: string
  description?: string
  maxDisplayed?: number
  animated?: boolean
}

export function Testimonials({
  testimonials,
  className,
  title = "La voce dei nostri utenti",
  description = "Scopri come Concoro sta aiutando migliaia di persone a trovare il loro posto ideale nel settore pubblico",
  maxDisplayed = 6,
  animated = false,
}: TestimonialsProps) {
  const [showAll, setShowAll] = useState(false)

  const openInNewTab = (url: string) => {
    window.open(url, "_blank")?.focus()
  }

  // Split testimonials into columns for the animated version
  // Convert our testimonial format to the columns format
  const convertToColumnFormat = (t: Testimonial): ColumnTestimonial => ({
    image: t.image,
    name: t.name,
    role: t.role || t.username || "",
    text: t.text
  })

  const firstColumn = testimonials.slice(0, Math.ceil(testimonials.length / 3)).map(convertToColumnFormat)
  const secondColumn = testimonials.slice(Math.ceil(testimonials.length / 3), Math.ceil(testimonials.length / 3) * 2).map(convertToColumnFormat)
  const thirdColumn = testimonials.slice(Math.ceil(testimonials.length / 3) * 2).map(convertToColumnFormat)

  if (animated) {
    return (
      <div className={className}>
        <div className="flex flex-col items-center justify-center pt-5">
          <div className="flex flex-col gap-5 mb-8">
            <h2 className="text-4xl font-bold text-center text-[#0A1F44] mb-2">{title}</h2>
            <p className="text-center text-gray-600 max-w-2xl mx-auto">
              {description.split("<br />").map((line, i) => (
                <span key={i}>
                  {line}
                  {i !== description.split("<br />").length - 1 && <br />}
                </span>
              ))}
            </p>
          </div>
        </div>
        
        <div className="flex justify-center gap-6 mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[740px] overflow-hidden">
          <TestimonialsColumn testimonials={firstColumn} duration={15} />
          <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={19} />
          <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={17} />
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="flex flex-col items-center justify-center pt-5">
        <div className="flex flex-col gap-5 mb-8">
          <h2 className="text-4xl font-bold text-center text-[#0A1F44] mb-16">{title}</h2>
          <p className="text-muted-foreground max-w-lg mx-auto my-2 text-sm text-center relative z-10">
            {description.split("<br />").map((line, i) => (
              <span key={i}>
                {line}
                {i !== description.split("<br />").length - 1 && <br />}
              </span>
            ))}
          </p>
        </div>
      </div>

      <div className="relative">
        <div
          className={cn(
            "flex justify-center items-center gap-5 flex-wrap",
            !showAll &&
              testimonials.length > maxDisplayed &&
              "max-h-[720px] overflow-hidden",
          )}
        >
          {testimonials
            .slice(0, showAll ? undefined : maxDisplayed)
            .map((testimonial, index) => (
              <Card
                key={index}
                className="w-80 h-auto p-5 relative bg-white border-border"
              >
                <div className="flex items-center">
                  <Image
                    src={testimonial.image}
                    alt={testimonial.name}
                    width={50}
                    height={50}
                    className="rounded-full"
                  />
                  <div className="flex flex-col pl-4">
                    <span className="font-semibold text-base">
                      {testimonial.name}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {testimonial.username || testimonial.role}
                    </span>
                  </div>
                </div>
                <div className="mt-5 mb-5">
                  <p className="text-foreground font-medium">
                    {testimonial.text}
                  </p>
                </div>
                {testimonial.social && (
                  <button
                    onClick={() => openInNewTab(testimonial.social!)}
                    className="absolute top-4 right-4 hover:opacity-80 transition-opacity"
                  >
                    <Icons.twitter className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </Card>
            ))}
        </div>

        {testimonials.length > maxDisplayed && !showAll && (
          <>
            <div className="absolute bottom-0 left-0 w-full h-20 " />
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-20">
              <Button variant="secondary" onClick={() => setShowAll(true)}>
                Mostra altri
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
} 