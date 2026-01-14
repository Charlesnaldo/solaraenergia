'use client';
import { useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Plus, MessageSquare } from 'lucide-react'; 
import { faqs } from "@/constants";

export default function Faq() {
  const [activeId, setActiveId] = useState<number | null>(null);

  return (
    <section id="faq" className="py-32 bg-[#020617] relative overflow-hidden">
      
      {/* Background Glows Premium */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-yellow-500/[0.02] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/[0.02] rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row gap-20 items-start">
          
          {/* Lado Esquerdo: Cabeçalho Estático */}
          <div className="lg:w-2/5 lg:sticky lg:top-32">
            <m.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px w-8 bg-yellow-500/50" />
                <span className="text-yellow-500 text-[11px] font-bold uppercase tracking-[0.4em]">
                  Suporte & FAQ
                </span>
              </div>
              
              <h2 className="text-5xl md:text-7xl font-black text-white leading-[0.85] uppercase tracking-tighter mb-8">
                Dúvidas <br /> 
                <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">Comuns</span>
              </h2>
              
              <div className="space-y-6">
                <p className="text-slate-400 text-lg leading-relaxed max-w-sm">
                  Tudo o que você precisa saber para digitalizar sua conta e economizar com a Solara.
                </p>
                
                <m.a 
                  href="#contato"
                  whileHover={{ x: 5 }}
                  className="inline-flex items-center gap-2 text-yellow-500 font-bold text-sm uppercase tracking-widest group"
                >
                  Ainda tem dúvidas? 
                  <MessageSquare size={16} className="group-hover:rotate-12 transition-transform" />
                </m.a>
              </div>
            </m.div>
          </div>

         {/* Lado Direito: Acordeão Repaginado */}
<div className="lg:w-3/5 w-full space-y-5">
  {faqs.map((faq, index) => {
    const isOpen = activeId === index;
    return (
      <m.div 
        key={index}
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1 }}
        // ADICIONADO: cursor-pointer aqui para o card todo reagir
        className={`group relative rounded-[2rem] border transition-all duration-500 cursor-pointer overflow-hidden ${
          isOpen 
          ? 'bg-white/[0.05] border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)]' 
          : 'bg-white/[0.02] border-white/5 hover:border-white/10'
        }`}
        // DICA: Clicar no card também fecha/abre
        onClick={() => setActiveId(isOpen ? null : index)}
      >
        <button
          // O onClick agora está no pai, mas mantemos o botão por acessibilidade
          aria-expanded={isOpen}
          className="w-full flex items-center justify-between p-8 text-left outline-none cursor-pointer"
        >
          <div className="flex items-center gap-6">
            <span className={`text-xs font-black font-mono transition-colors duration-500 ${
              isOpen ? 'text-yellow-500' : 'text-white/20'
            }`}>
              {String(index + 1).padStart(2, '0')}
            </span>
            
            <span className={`text-lg md:text-xl font-bold tracking-tight transition-all duration-500 ${
              isOpen ? 'text-white translate-x-1' : 'text-slate-300'
            }`}>
              {faq.question}
            </span>
          </div>
          
          <div className={`shrink-0 ml-4 w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-500 ${
            isOpen 
            ? 'bg-yellow-500 border-yellow-500 text-black rotate-[135deg]' 
            : 'bg-white/5 border-white/10 text-white rotate-0'
          }`}>
            <Plus size={20} />
          </div>
        </button>

        <AnimatePresence initial={false}>
          {isOpen && (
            <m.div
              key="content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
            >
              {/* O stopPropagation evita que o clique na resposta feche o FAQ sem querer */}
              <div 
                className="px-8 pb-10 ml-14 cursor-default" 
                onClick={(e) => e.stopPropagation()}
              >
                <div className="h-px w-12 bg-yellow-500/30 mb-6" />
                <p className="text-slate-400 text-base md:text-lg leading-relaxed max-w-prose">
                  {faq.answer}
                </p>
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </m.div>
    );
  })}
</div>
        </div>
      </div>
    </section>
  );
}