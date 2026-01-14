'use client';

import { m } from 'framer-motion';
import Image from 'next/image';

const logos = [
  { src: '/logos/logorickpan.avif', alt: 'Cliente rickpan', scale: 'scale-[1.5]' },
  { src: '/logos/logo-comercial-freire.avif', alt: 'Cliente comercial freire', scale: 'scale-110' },
  { src: '/logos/shark.png', alt: 'Shark', scale: 'scale-180' }, 
  { src: '/logos/economiafarma.png', alt: 'Economia Farma', scale: 'scale-300' },
  
  { src: '/logos/logorickpan.avif', alt: 'Cliente rickpan', scale: 'scale-[1.5]' },
  { src: '/logos/logo-comercial-freire.avif', alt: 'Cliente comercial freire', scale: 'scale-110' },
  { src: '/logos/shark.png', alt: 'Shark', scale: 'scale-180' }, 
   { src: '/logos/economiafarma.png', alt: 'Economia Farma', scale: 'scale-300' },
  
];

export default function CompactLogos() {
  return (
    <section className="py-10 bg-[#020617] border-y border-white/5 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-8 md:gap-12">
        
        {/* Label Lateral */}
        <div className="flex-shrink-0 relative w-full md:w-auto">
          <div className="flex items-center justify-center md:justify-start gap-3">
            <div className="w-1 h-8 bg-yellow-500 rounded-full" />
            <p className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 leading-tight">
              Junte-se <br className="hidden md:block" />
              <span className="text-white ml-1 md:ml-0">
                Aos que Confiam na Solara
              </span>
            </p>
          </div>
        </div>

        {/* Container do Carrossel */}
        <div className="relative flex-1 w-full overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-16 md:w-32 bg-gradient-to-r from-[#020617] to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-16 md:w-32 bg-gradient-to-l from-[#020617] to-transparent z-10 pointer-events-none" />

          {/* 2. Trocado para m.div */}
          <m.div 
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
                {/* 3. Trocado para Image do Next.js para melhor compressão */}
                <Image 
                  src={logo.src} 
                  alt={logo.alt} 
                  width={120} // Largura base para o Next.js otimizar
                  height={32}  // Altura base
                  className={`
                    h-6 md:h-8 w-auto object-contain brightness-0 invert opacity-30 
                    group-hover:opacity-100 transition-all duration-500 
                    ${logo.scale || 'scale-100'}
                  `}
                />
              </div>
            ))}
          </m.div>
        </div>
      </div>
    </section>
  );
}