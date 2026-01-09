'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
// Certifique-se de que a Poppins está importada no seu layout.tsx ou globals.css

export default function PreLoader() {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsComplete(true), 400); 
          return 100;
        }
        const increment = prev > 80 ? 0.5 : 2;
        return prev + increment;
      });
    }, 30);

    const safetyTimer = setTimeout(() => setIsComplete(true), 8000);

    return () => {
      clearInterval(interval);
      clearTimeout(safetyTimer);
    };
  }, []);

  return (
    <AnimatePresence>
      {!isComplete && (
        <motion.div
          key="ultra-preloader"
          initial={{ opacity: 1 }}
          exit={{ 
            y: '-100%', 
            transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] } 
          }}
          className="fixed inset-0 z-[9999] bg-[#020617] flex items-center justify-center touch-none select-none"
        >
          {/* FUNDO: Mesh Gradient */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(255,184,0,0.03)_0%,_transparent_50%)]" />

          {/* CONTAINER PRINCIPAL CENTRALIZADO */}
          <div className="relative flex flex-col items-center justify-center w-full px-6">
            
            {/* LOGO SOLARA */}
            <motion.svg
              width="100"
              height="100"
              viewBox="0 0 100 100"
              className="will-change-transform md:w-[120px] md:h-[120px]"
            >
              <motion.path
                d="M50 10V22 M50 78V90 M90 50H78 M22 50H10 M78.28 21.72L69.8 30.2 M30.2 69.8L21.72 78.28 M78.28 78.28L69.8 69.8 M30.2 30.2L21.72 21.72"
                stroke="#FFB800"
                strokeWidth="5"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, ease: "easeInOut" }}
              />
              <motion.circle
                cx="50"
                cy="50"
                r="15"
                fill="#FFB800"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 150 }}
              />
            </motion.svg>

            {/* AREA DE TEXTO CENTRALIZADA */}
            <div className="mt-6 flex flex-col items-center text-center">
              <motion.span 
                className="text-white/40 font-mono text-[10px] md:text-xs tracking-[0.3em]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {Math.round(loadingProgress)}%
              </motion.span>
              
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-poppins text-white font-bold text-2xl md:text-3xl capitalize mt-2 tracking-tight"
              >
                Solara Energia
              </motion.h2>
            </div>

            {/* BARRA DE PROGRESSO */}
            <div className="w-48 md:w-64 h-[2px] bg-white/5 mt-10 relative overflow-hidden rounded-full">
              <motion.div
                style={{ scaleX: loadingProgress / 100, originX: 0 }}
                className="absolute inset-0 bg-[#FFB800] shadow-[0_0_15px_#FFB800]"
                transition={{ type: "spring", stiffness: 50, damping: 20 }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}