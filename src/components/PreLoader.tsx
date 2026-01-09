'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function PreLoader() {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // 1. Simulação de carregamento inteligente (Integrável com sua API/Assets)
    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          // Pequeno delay para o usuário ver o 100% antes de sumir
          setTimeout(() => setIsComplete(true), 400); 
          return 100;
        }
        // Incremento orgânico: mais rápido no início, lento no fim (efeito psicológico)
        const increment = prev > 80 ? 0.5 : 2;
        return prev + increment;
      });
    }, 30);

    // 2. Fallback de segurança (Não deixa o usuário preso para sempre)
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
          className="fixed inset-0 z-[9999] bg-[#020617] flex flex-col items-center justify-center touch-none select-none"
        >
          {/* FUNDO: Mesh Gradient estático (0% CPU/GPU overhead) */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(255,184,0,0.03)_0%,_transparent_50%)]" />

          <div className="relative flex flex-col items-center">
            
            {/* LOGO SOLARA: Animada via CSS Variables para performance máxima */}
            <motion.svg
              width="120"
              height="120"
              viewBox="0 0 100 100"
              className="will-change-transform"
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

            {/* CONTADOR DE PORCENTAGEM (Feedback real para o usuário) */}
            <div className="mt-6 flex flex-col items-center">
              <motion.span 
                className="text-white/40 font-mono text-xs tracking-widest"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {Math.round(loadingProgress)}%
              </motion.span>
              
              {/* NOME DA MARCA */}
              <motion.h2
                initial={{ opacity: 0, letterSpacing: '0.2em' }}
                animate={{ opacity: 1, letterSpacing: '0.8em' }}
                className="font-poppins text-white font-bold text-3xl uppercase mt-2 ml-[0.8em]"
              >
                Solara Energia
              </motion.h2>
            </div>

            {/* BARRA DE PROGRESSO COM GLOW (Aceleração por Transform) */}
            <div className="w-64 h-[2px] bg-white/5 mt-10 relative overflow-hidden rounded-full">
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