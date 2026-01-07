'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function PreLoader() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 4000); // 4 segundos para a animação do sol completar bem
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          key="preloader"
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0,
            transition: { duration: 1, ease: "easeInOut" } 
          }}
          className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center overflow-hidden"
        >
          <div className="relative w-full max-w-[300px] h-[200px] flex flex-col items-center justify-end">
            
            {/* O SOL NASCENTE */}
            <motion.div
              initial={{ y: 100, opacity: 0, scale: 0.5 }}
              animate={{ 
                y: 0, 
                opacity: 1, 
                scale: 1,
                boxShadow: [
                  "0 0 20px rgba(234, 179, 8, 0.3)",
                  "0 0 60px rgba(234, 179, 8, 0.6)",
                  "0 0 100px rgba(234, 179, 8, 0.4)"
                ]
              }}
              transition={{ 
                duration: 3, 
                ease: [0.22, 1, 0.36, 1] 
              }}
              className="w-24 h-24 bg-gradient-to-t from-yellow-600 to-yellow-400 rounded-full relative z-10"
            />

            {/* LINHA DO HORIZONTE */}
            <motion.div 
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ delay: 0.5, duration: 1.5 }}
              className="w-full h-[1px] bg-gradient-to-r from-transparent via-slate-500 to-transparent mt-[-12px] z-20"
            />

            {/* REFLEXO NO CHÃO (OPCIONAL/PREMIUM) */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.2 }}
              transition={{ delay: 1, duration: 2 }}
              className="w-32 h-12 bg-yellow-500 blur-3xl mt-2 rounded-full"
            />
          </div>

          {/* TEXTO QUE APARECE COM O SOL */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 1 }}
            className="mt-8 text-center"
          >
            <h2 className="font-title text-3xl tracking-[0.6em] uppercase text-white">
              Solara
            </h2>
            <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-yellow-500/60 mt-2">
              O amanhecer da sua economia
            </p>
          </motion.div>

          {/* FUNDO ILUMINANDO AOS POUCOS */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            transition={{ duration: 3 }}
            className="absolute inset-0 bg-yellow-900/20 radial-gradient-at-center pointer-events-none"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}