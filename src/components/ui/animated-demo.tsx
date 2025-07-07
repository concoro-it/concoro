"use client"

import { 
  ContainerAnimated,
  ContainerInset,
  ContainerScroll,
  ContainerSticky,
  HeroButton,
  HeroImage 
} from "@/components/ui/animated-image-on-scroll"
import Link from "next/link"

export const HeroAnimatedDemo = () => {
  return (
    <section>
      <ContainerScroll className="h-[350vh]">
        <ContainerSticky
          style={{
            background:
              "radial-gradient(40% 40% at 50% 20%, #142f6a 0%, #0A1F44 22.92%, #091838 42.71%, #060e24 88.54%)", 
          }}
          className="bg-stone-900 px-4 sm:px-6 md:px-10 py-16 md:py-20 text-slate-50 flex flex-col items-center justify-center min-h-screen"
        >
          <div className="container max-w-6xl mx-auto grid gap-8 md:gap-12">
            <ContainerAnimated 
              className="text-center max-w-2xl mx-auto"
              transition={{ delay: 0.1 }}
              outputRange={[-40, 0]}
              inputRange={[0.2, 0.8]}
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-tighter mb-4">
                Trova il tuo futuro
              </h1>
              <p className="text-base sm:text-lg md:text-xl opacity-80 max-w-[42ch] mx-auto">
                Scopri opportunità nel settore pubblico che ti permetteranno di fare la differenza nella società
              </p>
            </ContainerAnimated>

            <ContainerAnimated
              transition={{ delay: 0.2 }}
              outputRange={[-60, 0]}
              inputRange={[0.2, 0.8]}
              className="w-full max-w-4xl mx-auto px-4 sm:px-6"
            >
              <ContainerInset className="aspect-[16/9] w-full">
                <HeroImage
                  src="/icon.svg"
                  alt="Concorso pubblico - persone che collaborano"
                  width={1600}
                  height={900}
                  className="w-full h-full"
                />
              </ContainerInset>
            </ContainerAnimated>

            <ContainerAnimated
              transition={{ delay: 0.3 }}
              outputRange={[-40, 0]}
              inputRange={[0.2, 0.8]}
              className="flex justify-center items-center"
            >
              <Link href="/signup">
                <HeroButton className="text-lg">Inizia ora</HeroButton>
              </Link>
            </ContainerAnimated>
          </div>
        </ContainerSticky>
      </ContainerScroll>
    </section>
  )
} 