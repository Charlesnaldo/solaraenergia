'use client';
import { motion } from 'framer-motion';

const logos = [
  { src: 'https://goener.com.br/wp-content/uploads/2023/09/Picture2.png', alt: 'Cliente 1' },
  { src: 'https://goener.com.br/wp-content/uploads/2023/09/Picture3.png.webp', alt: 'Cliente 2' },
  { src: 'https://goener.com.br/wp-content/uploads/2025/04/Brisanet_logo.svg', alt: 'Brisanet' },
  { src: 'https://goener.com.br/wp-content/uploads/2023/09/Picture4.png.webp', alt: 'Cliente 4' },
  { src: 'https://goener.com.br/wp-content/uploads/2023/09/Picture5.png.webp', alt: 'Cliente 5' },
  { src: 'https://goener.com.br/wp-content/uploads/2023/09/Picture7.png.webp', alt: 'Cliente 6' },
];

export default function CompactLogos() {
  return (
    <section className="py-12 bg-white border-y border-slate-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-10">
        
        {/* Título Lateral Compacto */}
        <div className="flex-shrink-0 text-center md:text-left border-r border-slate-100 pr-10 hidden md:block">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900">
            Parceiros <br /> de Peso
          </p>
        </div>

        {/* Carrossel Infinito */}
        <div className="relative flex-1 overflow-hidden">
          {/* Efeito de desfoque nas bordas */}
          <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-white to-transparent z-10" />
          <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-white to-transparent z-10" />

          <motion.div 
            className="flex gap-16 items-center"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ 
              ease: "linear", 
              duration: 20, 
              repeat: Infinity 
            }}
          >
            {[...logos, ...logos].map((logo, index) => (
              <img 
                key={index}
                src={logo.src} 
                alt={logo.alt} 
                className="h-6 md:h-7 w-auto object-contain grayscale opacity-30 hover:opacity-100 transition-opacity"
              />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}