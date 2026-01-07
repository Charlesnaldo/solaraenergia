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

export default function LogosCarousel() {
  const doubleLogos = [...logos, ...logos];

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Título com a linha (Divider Estilo Elementor) */}
        <div className="flex items-center gap-4 mb-8">
          <span className="text-sm font-bold upercase tracking-widest text-slate-400 whitespace-nowrap">
            Junte-se aos que confiam na Solara
          </span>
          <div className="h-[1px] w-full bg-slate-100"></div>
        </div>

        {/* Container Limitado com Máscara de Degradê nas Bordas */}
        <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)]">
          <motion.div 
            className="flex flex-nowrap gap-16 items-center w-max"
            animate={{ x: [0, -1000] }}
            transition={{ 
              duration: 25, 
              repeat: Infinity, 
              ease: "linear" 
            }}
          >
            {doubleLogos.map((logo, index) => (
              <div key={index} className="flex-shrink-0 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all">
                <img 
                  src={logo.src} 
                  alt={logo.alt} 
                  className="h-10 w-auto object-contain"
                />
              </div>
            ))}
          </motion.div>
        </div>
        
      </div>
    </section>
  );
}