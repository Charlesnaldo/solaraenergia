'use client';
// 1. Alterado de motion para m
import { m } from 'framer-motion';

export function CurveDivider() {
  
  const words = [
    "Energia Renovável",
    "Sustentabilidade",
    "Autossuficiência",
    "Rentabilidade",
    "Independência",
    "Performance"
  ];

  return (
    <div className="py-8 bg-slate-950 overflow-hidden flex whitespace-nowrap border-y border-white/5">
      {/* 2. Trocado para m.div */}
      <m.div 
        animate={{ x: [0, -1500] }} 
        transition={{ 
          repeat: Infinity, 
          duration: 40, 
          ease: "linear" 
        }} 
        className="flex gap-12 items-center"
      >
        
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-12">
            {words.map((word, index) => (
              <div key={index} className="flex items-center gap-12">
                <span className="text-white/30 text-[10px] font-bold uppercase tracking-[0.6em]">
                  {word}
                </span>
                
                <div className="w-1 h-1 bg-yellow-500 rounded-full shadow-[0_0_8px_rgba(234,179,8,0.6)]" />
              </div>
            ))}
          </div>
        ))}
      </m.div>
    </div>
  );
}