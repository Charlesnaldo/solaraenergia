'use client';
import { useState } from 'react';
// 1. Trocamos motion por m (AnimatePresence continua igual)
import { m, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react'; 

const faqs = [
  {
    question: "Preciso fazer algum investimento ou obra?",
    answer: "Nenhum. A Solara fornece energia limpa diretamente através da rede da concessionária. Você não precisa comprar painéis nem realizar obras no seu estabelecimento."
  },
  {
    question: "Como a economia aparece na minha conta?",
    answer: "Você continuará recebendo sua conta da concessionária, mas com o desconto aplicado referente aos créditos de energia limpa injetados pela Solara."
  },
  {
    question: "Existe fidelidade no contrato?",
    answer: "Nossa parceria é baseada na eficiência. Oferecemos modelos flexíveis que permitem que sua empresa tenha liberdade, sem as amarras dos contratos tradicionais."
  },
  {
    question: "Quais empresas podem aderir?",
    answer: "Qualquer empresa conectada em baixa ou média tensão (Grupo B ou A) que deseje reduzir custos fixos sem imobilizar capital."
  }
];

export default function Faq() {
  const [activeId, setActiveId] = useState<number | null>(null);

  return (
    <section id="faq" className="py-32 bg-[#020617] relative overflow-hidden">
      
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-500/[0.03] rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row gap-16 items-start">
          
          <div className="lg:w-2/5 lg:sticky lg:top-32">
            {/* 2. Trocado para m.div */}
            <m.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="inline-block px-4 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] font-black uppercase tracking-[0.3em] mb-6">
                Dúvidas Técnicas
              </span>
              <h2 className="text-4xl md:text-6xl font-black text-white leading-[0.9] uppercase tracking-tighter">
                Perguntas <br /> 
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-100">Frequentes</span>
              </h2>
              <p className="text-slate-400 text-base mt-8 leading-relaxed max-w-sm border-l border-yellow-500/30 pl-6">
                Tudo o que você precisa saber para digitalizar sua conta de luz e economizar.
              </p>
            </m.div>
          </div>

          <div className="lg:w-3/5 w-full space-y-4">
            {faqs.map((faq, index) => (
              /* 3. Trocado para m.div */
              <m.div 
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`group rounded-[2rem] border transition-all duration-500 ${
                  activeId === index 
                  ? 'bg-white/[0.04] border-yellow-500/30 shadow-2xl' 
                  : 'bg-white/[0.01] border-white/5 hover:border-white/10'
                }`}
              >
                <button
                  onClick={() => setActiveId(activeId === index ? null : index)}
                  className="w-full flex items-center justify-between p-7 text-left outline-none"
                >
                  <span className={`text-base md:text-lg font-bold tracking-tight transition-colors duration-300 ${
                    activeId === index ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                  }`}>
                    {faq.question}
                  </span>
                  
                  <div className={`shrink-0 ml-4 p-2 rounded-full transition-all duration-500 ${
                    activeId === index 
                    ? 'bg-yellow-500 text-black rotate-45' 
                    : 'bg-white/5 text-slate-500 rotate-0'
                  }`}>
                    <Plus size={18} />
                  </div>
                </button>

                <AnimatePresence>
                  {activeId === index && (
                    /* 4. Trocado para m.div */
                    <m.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="px-7 pb-8">
                        <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </m.div>
                  )}
                </AnimatePresence>
              </m.div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}