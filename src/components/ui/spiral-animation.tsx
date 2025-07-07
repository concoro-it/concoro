import React, { useEffect, useState } from 'react';

// Individual layer components for your logo
const LogoLayer1: React.FC<{ className?: string }> = ({ className = "" }) => (
  <path className={className} d="M156.74,2.94c-8.83-1.91-17.99-2.94-27.4-2.94s-18.53,1.02-27.34,2.92c9.01-.82,18.12-1.3,27.34-1.3s18.37.48,27.4,1.31Z"/>
);

const LogoLayer2: React.FC<{ className?: string }> = ({ className = "" }) => (
  <path className={className} d="M129.34,248.48c9.66,0,18.65,2.78,26.3,7.52,3.36-.69,6.65-1.55,9.91-2.49-9.91-7.98-22.5-12.78-36.21-12.78-13.72,0-26.31,4.8-36.22,12.78,3.23.94,6.51,1.79,9.84,2.48,7.66-4.76,16.69-7.51,26.37-7.51Z"/>
);

const LogoLayer3: React.FC<{ className?: string }> = ({ className = "" }) => (
  <path className={className} d="M75.52,244.72l1.31-1.28c13.66-13.02,32.15-21.01,52.51-21.01,21.02,0,40.04,8.51,53.82,22.29l1.28,1.31c.08.08.14.17.22.25,2.57-1.22,5.08-2.52,7.55-3.9-.6-.68-1.16-1.4-1.78-2.05l-1.41-1.45c-15.27-15.27-36.37-24.71-59.66-24.71-22.57,0-43.07,8.86-58.21,23.3l-1.45,1.42c-1.12,1.12-2.13,2.33-3.19,3.51,2.48,1.38,5.01,2.69,7.59,3.92.49-.52.93-1.08,1.44-1.58Z"/>
);

const LogoLayer4: React.FC<{ className?: string }> = ({ className = "" }) => (
  <path className={className} d="M57.1,226.3c18.49-18.49,44.03-29.92,72.24-29.92,28.21,0,53.75,11.43,72.24,29.92,2,2,3.89,4.09,5.72,6.24,2.34-1.77,4.6-3.63,6.81-5.55-2.01-2.38-4.11-4.7-6.31-6.9-20.07-20.07-47.81-32.49-78.45-32.49-30.63,0-58.37,12.42-78.45,32.49-2.21,2.21-4.3,4.52-6.31,6.9,2.21,1.92,4.47,3.78,6.81,5.55,1.83-2.15,3.72-4.25,5.72-6.24Z"/>
);

const LogoLayer5: React.FC<{ className?: string }> = ({ className = "" }) => (
  <path className={className} d="M38.68,207.87l2.2-2.15c23.01-21.94,54.16-35.4,88.46-35.4,35.41,0,67.46,14.35,90.66,37.55l2.15,2.2c1.46,1.53,2.87,3.1,4.26,4.7,2.07-2.35,4.07-4.77,5.97-7.27-1.15-1.3-2.3-2.59-3.5-3.84l-2.3-2.36c-24.88-24.88-59.27-40.27-97.24-40.27-36.78,0-70.2,14.45-94.87,37.97l-2.36,2.3c-2,2-3.92,4.09-5.8,6.21,1.9,2.51,3.91,4.93,5.98,7.29,2.05-2.38,4.17-4.7,6.39-6.92Z"/>
);

const LogoLayer6: React.FC<{ className?: string }> = ({ className = "" }) => (
  <path className={className} d="M20.26,189.45l2.65-2.58c27.68-26.39,65.16-42.6,106.43-42.6,42.6,0,81.16,17.26,109.08,45.18l2.58,2.65c.3.31.58.64.87.96,1.71-3.01,3.3-6.08,4.76-9.23l-1.29-1.31c-29.69-29.69-70.71-48.06-116.01-48.06-43.89,0-83.76,17.24-113.2,45.31l-2.81,2.75c-.44.44-.84.9-1.27,1.34,1.46,3.15,3.05,6.22,4.76,9.22,1.14-1.22,2.27-2.44,3.45-3.62Z"/>
);

const LogoLayer7: React.FC<{ className?: string }> = ({ className = "" }) => (
  <path className={className} d="M129.34,118.22c47.88,0,91.36,18.69,123.65,49.14,1.14-3.71,2.11-7.49,2.92-11.34-33.67-29.92-77.98-48.13-126.57-48.13-48.59,0-92.91,18.21-126.57,48.13.8,3.84,1.78,7.61,2.91,11.31,32.29-30.44,75.79-49.11,123.66-49.11Z"/>
);

const LogoLayer8: React.FC<{ className?: string }> = ({ className = "" }) => (
  <path className={className} d="M.29,137.53c35.35-28.37,80.21-45.36,129.06-45.36,48.85,0,93.71,17.01,129.05,45.38.17-2.72.29-5.45.29-8.21,0-1.81-.06-3.61-.14-5.4-36.11-26.77-80.8-42.61-129.2-42.61-48.4,0-93.1,15.86-129.21,42.62-.07,1.79-.14,3.58-.14,5.39,0,2.75.12,5.48.29,8.19Z"/>
);

const LogoLayer9: React.FC<{ className?: string }> = ({ className = "" }) => (
  <path className={className} d="M129.34,66.12c46.8,0,90.33,13.88,126.81,37.68-1.1-5.47-2.56-10.8-4.32-16-36-20.97-77.82-33.04-122.48-33.04-44.66,0-86.49,12.07-122.48,33.04-1.76,5.19-3.22,10.51-4.32,15.97,36.47-23.79,80.01-37.64,126.8-37.64Z"/>
);

const LogoLayer10: React.FC<{ className?: string }> = ({ className = "" }) => (
  <path className={className} d="M129.34,40.07c40.4,0,78.63,9.28,112.69,25.81-3.68-6.53-7.9-12.71-12.62-18.47-30.96-12.35-64.71-19.21-100.07-19.21s-69.1,6.85-100.06,19.19c-4.74,5.78-8.97,11.99-12.66,18.54,34.07-16.54,72.3-25.86,112.72-25.86Z"/>
);

const LogoLayer11: React.FC<{ className?: string }> = ({ className = "" }) => (
  <path className={className} d="M129.34,14.02c26.04,0,51.23,3.57,75.19,10.12-14.09-10.09-30.28-17.42-47.8-21.2-9.03-.83-18.15-1.31-27.4-1.31s-18.33.47-27.34,1.3c-17.55,3.78-33.76,11.12-47.87,21.23,23.97-6.55,49.16-10.13,75.21-10.13Z"/>
);

// Layer animation component
interface LayerAnimationProps {
  size?: number;
  animationDuration?: number;
  layerDelay?: number;
  autoStart?: boolean;
  loop?: boolean;
}

const LayeredLogoAnimation: React.FC<LayerAnimationProps> = ({
  size = 200,
  animationDuration = 2000,
  layerDelay = 200,
  autoStart = true,
  loop = true
}) => {
  const [visibleLayers, setVisibleLayers] = useState<number[]>([]);
  const [enteringLayers, setEnteringLayers] = useState<number[]>([]);
  const [animationComplete, setAnimationComplete] = useState(false);

  // Logo layers ordered from bottom to top based on visual hierarchy
  const layers = [
    { component: LogoLayer2, name: "Bottom Layer" },      // Lowest/outermost
    { component: LogoLayer3, name: "Layer 3" },
    { component: LogoLayer4, name: "Layer 4" },
    { component: LogoLayer5, name: "Layer 5" },
    { component: LogoLayer6, name: "Layer 6" },
    { component: LogoLayer7, name: "Layer 7" },
    { component: LogoLayer8, name: "Layer 8" },
    { component: LogoLayer9, name: "Layer 9" },
    { component: LogoLayer10, name: "Layer 10" },
    { component: LogoLayer11, name: "Layer 11" },
    { component: LogoLayer1, name: "Top Layer" }          // Highest/innermost
  ];

  const startAnimation = () => {
    setVisibleLayers([]);
    setEnteringLayers([]);
    setAnimationComplete(false);
    
    layers.forEach((_, index) => {
      setTimeout(() => {
        // Add entering animation
        setEnteringLayers(prev => [...prev, index]);
        
        // After a short delay, make it fully visible
        setTimeout(() => {
          setVisibleLayers(prev => [...prev, index]);
          setEnteringLayers(prev => prev.filter(i => i !== index));
        }, 100);
        
        if (index === layers.length - 1) {
          setTimeout(() => {
            setAnimationComplete(true);
            
            // Reset for loop if enabled
            if (loop) {
              setTimeout(() => {
                startAnimation();
              }, 1500);
            }
          }, layerDelay + 500);
        }
      }, index * layerDelay);
    });
  };

  useEffect(() => {
    if (autoStart) {
      startAnimation();
    }
  }, [autoStart, layerDelay]);

  return (
    <div className="flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 min-h-screen relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-conic from-blue-400/5 via-purple-400/5 to-blue-400/5 rounded-full blur-3xl animate-spin" style={{animationDuration: '20s'}}></div>
      </div>
      <div className="relative z-10">
        {/* Progress indicator */}
        <div className="absolute -top-20 left-1/2 transform -translate-x-1/2">
          <div className="bg-white/20 backdrop-blur-xl rounded-2xl px-6 py-3 shadow-2xl border border-white/30">
            <div className="text-sm font-medium text-gray-800 mb-2">
              {visibleLayers.length}/{layers.length} layers
            </div>
            <div className="w-40 h-3 bg-gray-200/50 rounded-full overflow-hidden backdrop-blur-sm">
              <div 
                className="h-full bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 rounded-full transition-all duration-500 cubic-bezier(0.42, 0, 1, 1) shadow-lg"
                style={{ 
                  width: `${(visibleLayers.length / layers.length) * 100}%`,
                  boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3), 0 0 10px rgba(59, 130, 246, 0.4)'
                }}
              />
            </div>
          </div>
        </div>

        {/* Logo container */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-purple-500/20 to-blue-600/20 rounded-full blur-3xl animate-pulse"></div>
          <svg 
            width={size} 
            height={size} 
            viewBox="0 0 258.68 256" 
            xmlns="http://www.w3.org/2000/svg"
            className="relative z-10 drop-shadow-2xl"
            style={{
              filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.15)) drop-shadow(0 0 20px rgba(59, 130, 246, 0.1))'
            }}
          >
          &gt;
            <defs>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <filter id="motionBlur" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="0 2"/>
              </filter>
              <linearGradient id="layerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor:"#0f172a", stopOpacity:1}} />
                <stop offset="50%" style={{stopColor:"#1e293b", stopOpacity:1}} />
                <stop offset="100%" style={{stopColor:"#334155", stopOpacity:1}} />
              </linearGradient>
              <style>
                {`.logo-layer { 
                  fill: url(#layerGradient); 
                  opacity: 0;
                  transform-origin: center;
                  transition: all 0.8s cubic-bezier(0.42, 0, 1, 1);
                  filter: blur(8px) drop-shadow(0 4px 8px rgba(0,0,0,0.3));
                }
                .logo-layer.visible {
                  opacity: 1;
                  transform: scale(1) rotate(0deg);
                  filter: blur(0px) drop-shadow(0 8px 16px rgba(0,0,0,0.2));
                }
                .logo-layer.hidden {
                  opacity: 0;
                  transform: scale(0.7) rotate(-3deg);
                  filter: blur(12px) drop-shadow(0 2px 4px rgba(0,0,0,0.1));
                }
                .logo-layer.entering {
                  animation: layerEnter 0.8s cubic-bezier(0.42, 0, 1, 1) forwards;
                }
                @keyframes layerEnter {
                  0% {
                    opacity: 0;
                    transform: scale(0.5) rotate(-10deg) translateY(20px);
                    filter: blur(15px) drop-shadow(0 0 0 rgba(0,0,0,0));
                  }
                  50% {
                    opacity: 0.7;
                    transform: scale(1.05) rotate(1deg) translateY(-2px);
                    filter: blur(4px) drop-shadow(0 6px 12px rgba(0,0,0,0.25));
                  }
                  100% {
                    opacity: 1;
                    transform: scale(1) rotate(0deg) translateY(0px);
                    filter: blur(0px) drop-shadow(0 8px 16px rgba(0,0,0,0.2));
                  }
                }`}
              </style>
            </defs>
            
            {layers.map((Layer, index) => (
              <Layer.component
                key={index}
                className={`logo-layer ${
                  enteringLayers.includes(index) ? 'entering' :
                  visibleLayers.includes(index) ? 'visible' : 'hidden'
                }`}
              />
            ))}
          </svg>
        </div>

        {/* Controls */}
        <div className="absolute -bottom-20 left-1/2 transform -translate-x-1/2">
          <button
            onClick={startAnimation}
            className="bg-gradient-to-r from-blue-500 via-purple-600 to-blue-600 hover:from-blue-600 hover:via-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-2xl font-medium shadow-2xl transition-all duration-300 backdrop-blur-sm border border-white/20 hover:scale-105 hover:shadow-blue-500/25"
            style={{
              boxShadow: '0 8px 32px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
            }}
          >
            <span className="flex items-center gap-2">
              ✨ Restart Animation
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Fixed variant with different animation styles
const LayeredLogoVariations: React.FC = () => {
  const [currentVariation, setCurrentVariation] = useState(0);

  const variations = [
    {
      name: "Smooth Fade",
      props: { animationDuration: 2000, layerDelay: 200, loop: true }
    },
    {
      name: "Quick Build", 
      props: { animationDuration: 1000, layerDelay: 100, loop: true }
    },
    {
      name: "Slow Reveal",
      props: { animationDuration: 4000, layerDelay: 400, loop: true }
    },
    {
      name: "Rapid Fire",
      props: { animationDuration: 500, layerDelay: 50, loop: true }
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Enhanced animated background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-conic from-blue-400/5 via-purple-400/5 to-blue-400/5 rounded-full blur-3xl animate-spin" style={{animationDuration: '30s'}}></div>
      </div>
      {/* Variation selector - Enhanced with motion effects */}
      <div className="fixed top-6 left-6 z-50">
        <div className="bg-white/10 backdrop-blur-2xl rounded-2xl p-5 shadow-2xl border border-white/30" 
             style={{
               boxShadow: '0 20px 40px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.2)'
             }}>
          <h3 className="font-semibold text-gray-800 mb-4 text-lg">Animation Style</h3>
          <div className="flex flex-col gap-3">
            {variations.map((variation, index) => (
              <button
                key={index}
                onClick={() => setCurrentVariation(index)}
                className={`relative overflow-hidden px-5 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                  index === currentVariation
                    ? 'bg-gradient-to-r from-blue-500 via-purple-600 to-blue-600 text-white shadow-xl transform scale-105 border border-white/20'
                    : 'bg-white/20 text-gray-700 hover:bg-white/30 hover:shadow-lg hover:scale-102 backdrop-blur-sm border border-white/10'
                }`}
                style={{
                  boxShadow: index === currentVariation 
                    ? '0 8px 32px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                    : '0 4px 12px rgba(0,0,0,0.05)'
                }}
              >
                {index === currentVariation && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 animate-pulse"></div>
                )}
                <span className="relative z-10">
                  {variation.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Animation component */}
      <LayeredLogoAnimation 
        key={currentVariation}
        {...variations[currentVariation].props}
      />
    </div>
  );
};

export default LayeredLogoVariations;