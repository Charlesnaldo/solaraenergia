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
  return (
    <section className="relative py-32 bg-[#e9e9e9] overflow-hidden">
      
      {/* FUNDO DINÂMICO (MESH GRADIENT) */}
      <div className="absolute inset-0 z-0">
        {/* Círculo de luz amarela suave */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0] 
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[70%] -left-[0%] w-[120%] h-[90%] bg-yellow-500/30 rounded-full blur-[150px]" 
        />
        {/* Círculo de luz azulada (energia) */}
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            x: [0, -40, 0],
            y: [0, -50, 0] 
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[70%] bg-blue-100/40 rounded-full blur-[100px]" 
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
        
        {/* Título Flutuante */}
        <div className="mb-20">
          <span className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 mb-4 block">
            Nossa Rede de Confiança
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter">
            Grandes parceiros, <br />
            <span className="text-yellow-600">grandes economias.</span>
          </h2>
        </div>

        {/* Grid de "Ilhas" de Vidro */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {logos.map((logo, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="group relative h-40 bg-white/40 backdrop-blur-md border border-white/60 rounded-[2rem] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] flex items-center justify-center p-10 transition-all duration-500 hover:bg-white hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)]"
            >
              {/* Brilho na borda superior (Inner Glow) */}
              <div className="absolute inset-0 rounded-[2rem] border border-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              
              <img 
                src={logo.src} 
                alt={logo.alt} 
                className="max-h-12 w-auto object-contain grayscale group-hover:grayscale-0 transition-all duration-700"
              />
            </motion.div>
          ))}
        </div>

        {/* Call to Action Sutil */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="mt-20 inline-flex items-center gap-3 px-6 py-3 bg-slate-900 rounded-full text-white cursor-pointer hover:bg-yellow-500 hover:text-black transition-all group"
        >
          <span className="text-[10px] font-black uppercase tracking-widest">Seja um parceiro Solara</span>
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-black/10">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.5 6H9.5M9.5 6L6.5 3M9.5 6L6.5 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </motion.div>
        
      </div>
    </section>
  );
}