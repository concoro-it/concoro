"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRightIcon, CheckIcon } from "@radix-ui/react-icons"
import { cn } from "@/lib/utils"

interface Feature {
  name: string
  description: string
  included: boolean
}

interface PricingTier {
  name: string
  price: {
    monthly: number
    yearly: number
  }
  description: string
  features: Feature[]
  highlight?: boolean
  badge?: string
  icon: React.ReactNode
}

interface PricingSectionProps {
  tiers: PricingTier[]
  className?: string
}

function PricingSection({ tiers, className }: PricingSectionProps) {
  const [isYearly, setIsYearly] = useState(false)

  const buttonStyles = {
    default: cn(
      "h-12 bg-white",
      "hover:bg-gray-50",
      "text-[#0A1F44]",
      "border border-gray-200",
      "hover:border-gray-300",
      "shadow-sm hover:shadow-md",
      "text-sm font-medium",
    ),
    highlight: cn(
      "h-12 bg-[#0A1F44]",
      "hover:bg-[#0A1F44]/90",
      "text-white",
      "shadow-[0_1px_15px_rgba(10,31,68,0.1)]",
      "hover:shadow-[0_1px_20px_rgba(10,31,68,0.15)]",
      "font-semibold text-base",
    ),
  }

  const badgeStyles = cn(
    "px-4 py-1.5 text-sm font-medium",
    "bg-[#0A1F44]",
    "text-white",
    "border-none shadow-lg",
  )

  return (
    <section
      className={cn(
        "relative bg-background text-foreground",
        "py-12 px-4 md:py-24 lg:py-32",
        "overflow-hidden",
        className,
      )}
    >
      <div className="w-full max-w-5xl mx-auto">
        <div className="flex flex-col items-center gap-4 mb-12 text-center">
          <h2 className="text-4xl font-bold text-[#0A1F44] mb-4">
            Semplifica la tua ricerca di lavoro pubblico
          </h2>
          <p className="text-gray-600 text-base max-w-xl">
            Dall'accesso gratuito ai bandi alla preparazione con l'AI. Scegli il piano che fa per te.
          </p>
          <div className="inline-flex items-center p-1.5 bg-white rounded-full border border-gray-200 shadow-sm">
            {["Mensile", "Annuale"].map((period) => (
              <button
                key={period}
                onClick={() => setIsYearly(period === "Annuale")}
                className={cn(
                  "px-8 py-2.5 text-sm font-medium rounded-full transition-all duration-300",
                  (period === "Annuale") === isYearly
                    ? "bg-[#0A1F44] text-white shadow-lg"
                    : "text-gray-600 hover:text-[#0A1F44]",
                )}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={cn(
                "relative group backdrop-blur-sm",
                "rounded-3xl transition-all duration-300",
                "flex flex-col",
                tier.highlight
                  ? "bg-gradient-to-b from-[#0A1F44]/5 to-transparent"
                  : "bg-white",
                "border",
                tier.highlight
                  ? "border-[#0A1F44]/20 shadow-xl"
                  : "border-gray-200 shadow-md",
                "hover:translate-y-0 hover:shadow-lg",
              )}
            >
              {tier.badge && tier.highlight && (
                <div className="absolute -top-4 left-6">
                  <Badge className={badgeStyles}>{tier.badge}</Badge>
                </div>
              )}

              <div className="p-8 flex-1">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={cn(
                      "p-3 rounded-xl",
                      tier.highlight
                        ? "bg-[#0A1F44]/10 text-[#0A1F44]"
                        : "bg-gray-100 text-gray-600",
                    )}
                  >
                    {tier.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-[#0A1F44]">
                    {tier.name}
                  </h3>
                </div>

                <div className="mb-6">
                  <div className="flex flex-col items-center gap-2">
                    {tier.highlight ? (
                      // Pro plan - Beta pricing
                      <>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-gray-400 line-through">
                            €{isYearly ? tier.price.yearly : tier.price.monthly}
                          </span>
                          <span className="text-sm text-gray-400 line-through">
                            /{isYearly ? "anno" : "mese"}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-bold text-[#0A1F44]">
                            Gratis
                          </span>
                          <span className="text-sm text-gray-500">
                            durante la beta
                          </span>
                        </div>
                      </>
                    ) : (
                      // Base plan - Regular pricing
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-[#0A1F44]">
                          €{isYearly ? tier.price.yearly : tier.price.monthly}
                        </span>
                        <span className="text-sm text-gray-500">
                          /{isYearly ? "anno" : "mese"}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-gray-600 text-center">
                    {tier.description}
                  </p>
                </div>

                <div className="space-y-4">
                  {tier.features.map((feature) => (
                    <div key={feature.name} className="flex gap-4">
                      <div
                        className={cn(
                          "mt-1 p-0.5 rounded-full transition-colors duration-200",
                          feature.included
                            ? "text-emerald-600"
                            : "text-gray-400",
                        )}
                      >
                        <CheckIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-[#0A1F44]">
                          {feature.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {feature.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-8 pt-0 mt-auto">
                <Button
                  className={cn(
                    "w-full relative transition-all duration-300",
                    tier.highlight
                      ? buttonStyles.highlight
                      : buttonStyles.default,
                  )}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {tier.highlight ? (
                      <>
                        Prova gratis ora
                        <ArrowRightIcon className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        Inizia gratis
                        <ArrowRightIcon className="w-4 h-4" />
                      </>
                    )}
                  </span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export { PricingSection } 