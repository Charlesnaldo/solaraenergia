'use client';
import { useState, useEffect } from 'react';
// 1. Trocamos motion por m (AnimatePresence permanece igual)
import { m, AnimatePresence } from 'framer-motion';
import { ArrowUp } from 'lucide-react';

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 400) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        // 2. Trocado para m.button
        <m.button
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-[90] p-4 rounded-full shadow-2xl transition-colors
                     bg-yellow-500 text-slate-950 dark:bg-yellow-500 dark:text-slate-950
                     hover:bg-yellow-400 border border-white/10"
          aria-label="Voltar ao topo"
        >
          <ArrowUp size={24} strokeWidth={3} />
          
          {/* 3. Trocado para m.div (Efeito de brilho pulsante) */}
          <m.div 
            animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 bg-yellow-500 rounded-full -z-10"
          />
        </m.button>
      )}
    </AnimatePresence>
  );
}