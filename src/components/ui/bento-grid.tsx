import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TiltedScroll } from "@/components/ui/tilted-scroll";
import { Gravity, MatterBody } from "@/components/ui/gravity";
import { InfiniteSlider } from "@/components/ui/infinite-slider";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";

const BentoGrid = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "grid w-full auto-rows-[22rem] grid-cols-3 gap-4",
        className,
      )}
    >
      {children}
    </div>
  );
};

const BentoCard = ({
  name,
  className,
  background,
  Icon,
  description,
  href,
  cta,
}: {
  name: string;
  className: string;
  background: ReactNode;
  Icon: any;
  description: string;
  href: string;
  cta: string;
}) => (
  <div
    key={name}
    className={cn(
      "group relative col-span-3 flex flex-col justify-between overflow-hidden rounded-xl",
      // light styles
      "bg-white [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]",
      className,
    )}
  >
    <div>{background}</div>
    
    {/* TiltedScroll component - at the top of "Bandi semplificati e leggibili" card */}
    {name === "Bandi semplificati e leggibili" && (
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-4">
        <TiltedScroll 
          className="scale-75 sm:scale-90 md:scale-100"
        />
      </div>
    )}

    {/* InfiniteSlider with ProgressiveBlur - at the top of "Tutti i concorsi, da fonti ufficiali" card */}
    {name === "Tutti i concorsi, da fonti ufficiali" && (
      <div className="flex-1 relative mt-8 px-4 sm:px-6 py-4">
        <div className='relative h-full w-full overflow-hidden'>
          <InfiniteSlider 
            className='flex h-full w-full items-center' 
            duration={30}
            gap={24}
          >
            {[
              {
                id: "source-1",
                logo: "/icons/ferrovie.svg",
                alt: "Ferrovie dello Stato Italiane",
              },
              {
                id: "source-2", 
                logo: "/icons/milano.svg",
                alt: "Comune di Milano",
              },
              {
                id: "source-3",
                logo: "/icons/inps.svg",
                alt: "INPS",
              },
              {
                id: "source-4",
                logo: "/icons/agenzia.svg",
                alt: "Agenzia per l'Italia Digitale",
              },
              {
                id: "source-5",
                logo: "/icons/inpa.svg",
                alt: "inPA",
              },
              {
                id: "source-6",
                logo: "/icons/roma.svg",
                alt: "Roma Capitale",
              },
            ].map((source) => (
              <div 
                key={source.id} 
                className='flex w-40 items-center justify-center bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2'
              >
                <img
                  src={source.logo}
                  alt={source.alt}
                  className="h-12 w-12 object-contain rounded mr-3"
                />
              </div>
            ))}
          </InfiniteSlider>
          <ProgressiveBlur
            className='pointer-events-none absolute top-0 left-0 h-full w-[100px]'
            direction='left'
            blurIntensity={1}
          />
          <ProgressiveBlur
            className='pointer-events-none absolute top-0 right-0 h-full w-[100px]'
            direction='right'
            blurIntensity={1}
          />
        </div>
      </div>
    )}

    {/* Gravity component - added to "Suggerimenti personalizzati per te" card */}
    {name === "Suggerimenti personalizzati per te" && (
      <div className="flex-1 relative px-4 sm:px-6 py-4">
        <Gravity gravity={{ x: 0, y: 1 }} className="w-full h-full">
          <MatterBody
            matterBodyOptions={{ friction: 0.5, restitution: 0.2 }}
            x="20%"
            y="10%"
          >
            <div className="text-sm sm:text-base rounded-full hover:cursor-pointer px-4 py-2" style={{ backgroundColor: '#2F4A5C', color: '#FFFFFF' }}>
            Personalizzazione
            </div>
          </MatterBody>
          <MatterBody
            matterBodyOptions={{ friction: 0.5, restitution: 0.2 }}
            x="60%"
            y="15%"
          >
            <div className="text-sm sm:text-base rounded-full hover:cursor-grab px-4 py-2" style={{ backgroundColor: '#4A6B7C', color: '#FFFFFF' }}>
            Compatibilità
            </div>
          </MatterBody>
          <MatterBody
            matterBodyOptions={{ friction: 0.5, restitution: 0.2 }}
            x="40%"
            y="20%"
            angle={10}
          >
            <div className="text-sm sm:text-base rounded-full hover:cursor-grab px-4 py-2" style={{ backgroundColor: '#6B8A9A', color: '#FFFFFF' }}>
            Intelligenza artificiale
            </div>
          </MatterBody>
          <MatterBody
            matterBodyOptions={{ friction: 0.5, restitution: 0.2 }}
            x="75%"
            y="10%"
          >
            <div className="text-sm sm:text-base rounded-full hover:cursor-grab px-4 py-2" style={{ backgroundColor: '#A8C5D1', color: '#2F4A5C' }}>
              Bandi Personalizzati
            </div>
          </MatterBody>
          <MatterBody
            matterBodyOptions={{ friction: 0.5, restitution: 0.2 }}
            x="30%"
            y="5%"
          >
            <div className="text-sm sm:text-base rounded-full hover:cursor-grab px-4 py-2" style={{ backgroundColor: '#D4D0C8', color: '#2F4A5C' }}>
              Notifiche Smart
            </div>
          </MatterBody>
          <MatterBody
            matterBodyOptions={{ friction: 0.5, restitution: 0.2 }}
            x="65%"
            y="25%"
          >
            <div className="text-sm sm:text-base rounded-full hover:cursor-grab px-4 py-2" style={{ backgroundColor: '#B8CDD9', color: '#2F4A5C' }}>
            Aggiornamento quotidiano
            </div>
          </MatterBody>
        </Gravity>
      </div>
    )}

    <div className="pointer-events-none z-10 flex transform-gpu flex-col gap-1 p-4 sm:p-6 transition-all duration-300">
      <Icon className="h-8 w-8 sm:h-12 sm:w-12 origin-left transform-gpu text-neutral-700 transition-all duration-300 ease-in-out group-hover:scale-75" />
      <h3 className="text-lg sm:text-xl font-semibold text-neutral-700">
        {name}
      </h3>
      <p className="max-w-lg text-sm sm:text-base text-neutral-400">{description}</p>
    </div>

    <div
      className={cn(
        "pointer-events-none absolute bottom-0 flex w-full transform-gpu flex-row items-center p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100",
      )}
    >
    </div>
    <div className="pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-black/[.03]" />
  </div>
);

export { BentoCard, BentoGrid }; 