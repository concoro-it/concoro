"use client" 

import * as React from "react"
 
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useEffect, useState } from "react";
 
export interface MagicTextProps {
  text: string;
}
 
interface WordProps {
  children: string;
  progress: any;
  range: number[];
  isBold?: boolean;
  isMobile: boolean;
}
 
const Word: React.FC<WordProps> = ({ children, progress, range, isBold = false, isMobile }) => {
  const opacity = useTransform(progress, range, [0, 1]);
  
  const className = `relative mr-1 ${
    isMobile 
      ? `text-lg sm:text-xl md:text-2xl mt-[8px]` 
      : `text-xl sm:text-2xl md:text-3xl mt-[12px]`
  } ${isBold ? 'font-bold' : 'font-normal'}`;
 
  return (
    <span className={className}>
      <span className="absolute opacity-20">{children}</span>
      <motion.span style={{ opacity }}>{children}</motion.span>
    </span>
  );
};
 
export const MagicText: React.FC<MagicTextProps> = ({ text }) => {
  const container = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
 
  // Check if the device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Clean up
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const { scrollYProgress } = useScroll({
    target: container,
    offset: isMobile 
      ? ["start 0.95", "start 0.5"] // More aggressive animation trigger for mobile
      : ["start 0.9", "start 0.25"], // Original desktop animation trigger
  });

  // Process the input text to handle line breaks and bold sections
  const processedSections = React.useMemo(() => {
    // First, split by the literal \n\n sequence
    const paragraphs = text.split('\\n\\n');
    
    const allProcessedWords: { text: string; isBold: boolean; isBreak: boolean }[] = [];
    
    // Process each paragraph
    paragraphs.forEach((paragraph, paragraphIndex) => {
      // If not the first paragraph, add a line break
      if (paragraphIndex > 0) {
        allProcessedWords.push({ text: '', isBold: false, isBreak: true });
      }
      
      // Process bold sections in this paragraph
      const sections = paragraph.split(/\*\*(.*?)\*\*/);
      
      sections.forEach((section, index) => {
        if (section === '') return;
        
        // Even indices are regular text, odd indices are bold
        const isBold = index % 2 !== 0;
        
        // Split by spaces to get words
        const words = section.split(' ');
        
        words.forEach(word => {
          if (word) {
            allProcessedWords.push({ text: word, isBold, isBreak: false });
          }
        });
      });
    });
    
    return allProcessedWords;
  }, [text]);
 
  return (
    <p 
      ref={container} 
      className="flex flex-wrap leading-[1.5] p-4"
      style={{ minHeight: isMobile ? '50vh' : 'auto' }} // Add minimum height on mobile to ensure scroll animation works
    >
      {processedSections.map((word, i) => {
        if (word.isBreak) {
          return <span key={`break-${i}`} className="w-full h-4 md:h-8"></span>;
        }
        
        const start = i / processedSections.length;
        const end = start + 1 / processedSections.length;
 
        return (
          <Word 
            key={i} 
            progress={scrollYProgress} 
            range={[start, end]} 
            isBold={word.isBold}
            isMobile={isMobile}
          >
            {word.text}
          </Word>
        );
      })}
    </p>
  );
}; 