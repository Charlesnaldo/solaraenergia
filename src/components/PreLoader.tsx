'use client';

import { m, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function PreLoader() {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    
    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          
          setTimeout(() => setIsComplete(true), 50); 
          return 100;
        }
        
        const increment = prev > 80 ? 2 : 6; 
        return prev + increment;
      });
    }, 15); 

    const safetyTimer = setTimeout(() => setIsComplete(true), 3500);

    return () => {
      clearInterval(interval);
      clearTimeout(safetyTimer);
    };
  }, []);

  return (
    <AnimatePresence mode="wait">
      {!isComplete && (
        <m.div
          key="ultra-preloader"
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0,
            transition: { duration: 0.3, ease: "easeIn" } 
          }}
          className="fixed inset-0 z-[9999] bg-[#020617] flex items-center justify-center touch-none select-none"
        >
          
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(255,184,0,0.02)_0%,_transparent_50%)]" />

          <div className="relative flex flex-col items-center justify-center w-full px-6">
            
            {/* LOGO SOLARA */}
            <m.svg
              width="100"
              height="100"
              viewBox="0 0 100 100"
              className="will-change-transform md:w-[120px] md:h-[120px]"
            >
              <m.path
                d="M50 10V22 M50 78V90 M90 50H78 M22 50H10 M78.28 21.72L69.8 30.2 M30.2 69.8L21.72 78.28 M78.28 78.28L69.8 69.8 M30.2 30.2L21.72 21.72"
                stroke="#FFB800"
                strokeWidth="5"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, ease: "linear" }}
              />
              <m.circle
                cx="50"
                cy="50"
                r="15"
                fill="#FFB800"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              />
            </m.svg>

            <div className="mt-6 flex flex-col items-center text-center">
              <span className="text-white/40 font-mono text-[10px] md:text-xs tracking-[0.3em]">
                {Math.round(loadingProgress)}%
              </span>
              
              <h2 className="font-poppins text-white font-bold text-2xl md:text-3xl capitalize mt-2 tracking-tight">
                Solara Energia
              </h2>
            </div>

            {/* BARRA DE PROGRESSO COM WILL-CHANGE */}
            <div className="w-48 md:w-64 h-[2px] bg-white/5 mt-10 relative overflow-hidden rounded-full">
              <m.div
                style={{ scaleX: loadingProgress / 100, originX: 0 }}
                className="absolute inset-0 bg-[#FFB800] shadow-[0_0_10px_#FFB800] will-change-transform"
              />
            </div>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}