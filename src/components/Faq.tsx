'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react'; 

const faqs = [
  {
    question: "Quanto tempo leva a instalação?",
    answer: "Após a aprovação do projeto junto à concessionária, nossa equipe realiza a instalação física em média de 2 a 3 dias para sistemas residenciais."
  },
  {
    question: "Quais são as formas de pagamento?",
    answer: "Trabalhamos com financiamento bancário em até 120 meses (com carência de até 90 dias), cartão de crédito, boleto ou consórcio solar."
  },
  {
    question: "O sistema precisa de internet?",
    answer: "Sim, para que você possa acompanhar a geração de energia em tempo real pelo aplicativo no seu celular de qualquer lugar do mundo."
  },
   {
    question: "O sistema precisa de internet?",
    answer: "Sim, para que você possa acompanhar a geração de energia em tempo real pelo aplicativo no seu celular de qualquer lugar do mundo."
  }
];

export default function Faq() {
  const [activeId, setActiveId] = useState<number | null>(null);

  return (
    <section className="py-24 bg[#e9e9e9] px-6"> {/* Fundo cinza moderno */}
      <div className="max-w-4xl mx-auto">
        
        <div className="flex flex-col md:flex-row gap-12 items-start">
          
          {/* Lado Esquerdo: Título e Badge */}
          <div className="md:w-1/3">
            <span className="inline-block px-4 py-1.5 rounded-full bg-yellow-500/10 text-yellow-500 text-[10px] font-bold uppercase tracking-widest mb-4">
              Suporte Solara
            </span>
            <h2 className="font-title text-4xl md:text-5xl text-black leading-none">
              Dúvidas <br /> 
              <span className="text-slate-500 italic">Comuns</span>
            </h2>
            <p className="font-sans text-slate-400 text-sm mt-6 leading-relaxed">
              Tudo o que você precisa saber para começar a gerar sua própria energia limpa.
            </p>
          </div>

          {/* Lado Direito: Accordion */}
          <div className="md:w-2/3 w-full space-y-3">
            {faqs.map((faq, index) => (
              <div 
                key={index}
                className="group overflow-hidden rounded-2xl transition-all duration-300"
                style={{ backgroundColor: activeId === index ? '#1e293b' : '#0f172a' }} // Cinza escuro vs Cinza médio
              >
                <button
                  onClick={() => setActiveId(activeId === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className={`font-sans text-base font-semibold transition-colors duration-300 ${
                    activeId === index ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                  }`}>
                    {faq.question}
                  </span>
                  
                  <motion.div
                    animate={{ 
                      rotate: activeId === index ? 45 : 0,
                      backgroundColor: activeId === index ? '#EAB308' : 'rgba(255,255,255,0.05)'
                    }}
                    className={`p-2 rounded-full transition-colors ${
                      activeId === index ? 'text-black' : 'text-slate-500'
                    }`}
                  >
                    <Plus size={18} strokeWidth={3} />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {activeId === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                    >
                      <div className="px-6 pb-6 text-slate-400 font-sans text-sm leading-relaxed">
                        <div className="h-[1px] w-full bg-white/5 mb-4" /> {/* Divisória sutil */}
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}