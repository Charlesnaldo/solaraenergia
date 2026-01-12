'use client';
// 1. Trocamos o import de 'motion' para 'm'
import { m } from 'framer-motion';
import { ArrowRight, Zap } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-slate-950 overflow-hidden pt-20">
      
      {/* IMAGEM DE FUNDO FIXA */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="/usinas/solar-hero.png" 
          alt="Painéis solares ao nascer do sol"
          fill
          className="object-cover object-center opacity-40"
          priority 
          quality={85}
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-850 via-slate-850/70 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">

        {/* Badge Superior - Trocado para m.div */}
        <m.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full mb-10 backdrop-blur-sm"
        >
          <Zap size={14} className="text-yellow-500 fill-yellow-500" />
          <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-slate-300">
            A Revolução Energética
          </span>
        </m.div>

        {/* Título Principal - Trocado para m.h1 e delay levemente reduzido para LCP */}
        <m.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-2xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight mb-8"
        >
          Enquanto você paga caro, <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-yellow-400 to-yellow-600 drop-shadow-[0_0_30px_rgba(234,179,8,0.3)]">
            o sol entra grátis na sua casa todos os dias.
          </span>
        </m.h1>

        {/* Subtítulo - Trocado para m.p */}
        <m.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="max-w-2xl mx-auto text-sm md:text-lg text-slate-400 leading-relaxed mb-12"
        >
          Reduza seus custos em até 95% e transforme sua empresa com a inteligência fotovoltaica da Solara.
        </m.p>

        {/* Botões - Trocado para m.div */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center mb-15 gap-6"
        >
          <button className="group relative bg-yellow-500 hover:bg-yellow-400 text-black px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all overflow-hidden active:scale-95 shadow-xl shadow-yellow-500/20">
            <span className="relative z-10 flex items-center gap-3">
              Solicitar Orçamento <ArrowRight size={18} />
            </span>
          </button>

          <Link href="/#usinas">
            <button className="px-12 py-5 rounded-2xl font-bold text-xs uppercase tracking-widest text-white border border-white/10 hover:bg-white/5 transition-all ">
              Conhecer Usinas
            </button>
          </Link>
        </m.div>
      </div>

      {/* Indicador de Scroll - Trocado para m.div */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
        <div className="w-px h-16 bg-gradient-to-b from-yellow-500/50 to-transparent relative">
          <m.div 
            animate={{ top: ["0%", "100%", "0%"] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-1/2 -translate-x-1/2 w-1 h-1 bg-yellow-400 rounded-full shadow-[0_0_10px_#eab308]"
          />
        </div>
      </div>
    </section>
  );
}