'use client';
import { motion } from 'framer-motion';

const logos = [
  { src: '/logos/logorickpan.png', alt: 'Cliente rickpan', scale: 'scale-150' },
  { src: '/logos/logo-comercial-freire.png', alt: 'Cliente comercial freire' },
  { src: '/logos/logo-comercial-freire.png', alt: 'Economia Farma' },
  { src: '/logos/logo-comercial-freire.png', alt: 'Cliente 4' },
  { src: '/logos/logo-comercial-freire.png', alt: 'Cliente 5' },
  { src: '/logos/logo-comercial-freire.png', alt: 'Cliente 2' },
];

export default function CompactLogos() {
  return (
    <section className="py-10 bg-[#020617] border-y border-white/5 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-8 md:gap-12">
        
        {/* Label Lateral - Ajustado para aparecer em todas as telas */}
        <div className="flex-shrink-0 relative w-full md:w-auto">
          <div className="flex items-center justify-center md:justify-start gap-3">
            <div className="w-1 h-8 bg-yellow-500 rounded-full" />
            <p className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 leading-tight">
              Junte-se <br className="hidden md:block" />
              <span className="text-white ml-1 md:ml-0">
                Aos que Confiam na Solara
              </span>
            </p>
          </div>
        </div>

        {/* Container do Carrossel */}
        <div className="relative flex-1 w-full overflow-hidden">
          {/* Gradients de máscara - Reduzidos no mobile para dar mais espaço */}
          <div className="absolute inset-y-0 left-0 w-16 md:w-32 bg-gradient-to-r from-[#020617] to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-16 md:w-32 bg-gradient-to-l from-[#020617] to-transparent z-10 pointer-events-none" />

          <motion.div 
            className="flex gap-16 md:gap-20 items-center w-max"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ 
              ease: "linear", 
              duration: 30, 
              repeat: Infinity 
            }}
          >
            {[...logos, ...logos].map((logo, index) => (
              <div key={index} className="relative group flex items-center justify-center">
                <img 
                  src={logo.src} 
                  alt={logo.alt} 
                  className={`
                    h-6 md:h-8 w-auto object-contain brightness-0 invert opacity-30 
                    group-hover:opacity-100 transition-all duration-500 
                    ${logo.scale || 'scale-100'}
                  `}
                />
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}