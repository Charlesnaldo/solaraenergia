'use client';
import { motion } from 'framer-motion';
import { ArrowRight, Zap } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-slate-950 overflow-hidden pt-20">
      {/* Background Decorativo */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-yellow-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">

        {/* Badge Superior */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full mb-10"
        >
          <Zap size={14} className="text-yellow-500 fill-yellow-500" />
          <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-slate-400">
            A Revolução Energética chegou
          </span>
        </motion.div>

        {/* Título Principal */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-[1.1] tracking-[-0.04em] mb-8"
        >
          Energia inteligente <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-500">
            para o seu futuro.
          </span>
        </motion.h1>

        {/* Subtítulo */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="max-w-2xl mx-auto text-sm md:text-base text-slate-400 leading-relaxed tracking-wide mb-12 px-4"
        >
          Reduza seus custos em até 95% e transforme sua empresa em uma potência sustentável com a tecnologia fotovoltaica da Solara.
        </motion.p>

        {/* Botões */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-5"
        >
          <button className="group bg-yellow-500 hover:bg-yellow-400 text-black px-10 py-4 rounded-full font-black text-xs uppercase tracking-widest transition-all flex items-center gap-3 shadow-[0_20px_40px_-15px_rgba(234,179,8,0.3)] active:scale-95">
            Solicitar Orçamento
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>

          <button className="px-10 py-4 rounded-full font-bold text-xs uppercase tracking-widest text-white border border-white/10 hover:bg-white/5 transition-all active:scale-95">
            Ver Projetos
          </button>
        </motion.div>
      </div>

      {/* Scroll Indicator Corrigido */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        // Adicionamos 'hidden' (esconde por padrão) e 'md:flex' (mostra em telas médias/grandes)
        className="hidden md:flex absolute bottom-10 left-1/2 -translate-x-1/2 flex-col items-center gap-2"
      >
        <span className="text-[10px] uppercase tracking-[0.4em] text-slate-500 font-bold">Scroll</span>
        <div className="w-[1px] h-12 bg-gradient-to-b from-yellow-500 to-transparent" />
      </motion.div>
    </section>
  );
}