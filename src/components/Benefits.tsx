'use client';
import { motion } from 'framer-motion';
import { ShieldCheck, TrendingDown, Leaf, ArrowUpRight } from "lucide-react";

const benefits = [
  {
    icon: <TrendingDown className="w-6 h-6" />,
    title: "Economia Real",
    tag: "Financeiro",
    description: "Redução imediata de até 95% na sua fatura de energia mensal com payback acelerado."
  },
  {
    icon: <Leaf className="w-6 h-6" />,
    title: "Sustentabilidade",
    tag: "Ambiental",
    description: "Energia 100% limpa vinda de fontes renováveis, eliminando sua pegada de carbono."
  },
  {
    icon: <ShieldCheck className="w-6 h-6" />,
    title: "Segurança Total",
    tag: "Operacional",
    description: "Monitoramento 24h e manutenção preventiva inclusa em todas as nossas usinas."
  }
];

export default function Benefits() {
  return (
    <section className="pt-18 pb-25 bg-[#e9e9e9]" id="beneficios">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Cabeçalho da Seção */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-6">
          <div className="max-w-xl">
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400 block mb-4">
              Por que escolher a Solara
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight uppercase tracking-tighter">
              A solução definitiva para <br />
              <span className="text-yellow-500">sua liberdade energética.</span>
            </h2>
          </div>
          <p className="text-slate-500 text-sm md:text-base max-w-xs leading-relaxed">
            Combinamos tecnologia de ponta com engenharia de precisão para entregar resultados mensuráveis.
          </p>
        </div>

        {/* Grid de Benefícios */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="group relative p-8 rounded-3xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] transition-all duration-500"
            >
              {/* Icon & Tag */}
              <div className="flex items-center justify-between mb-8">
                <div className="p-3 bg-yellow-500 text-black rounded-2xl shadow-[0_10px_20px_-5px_rgba(234,179,8,0.4)] transition-transform duration-500 group-hover:scale-110">
                  {benefit.icon}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 group-hover:text-yellow-600 transition-colors">
                  {benefit.tag}
                </span>
              </div>

              {/* Texto */}
              <h3 className="text-xl font-black text-slate-900 mb-4 uppercase tracking-tighter">
                {benefit.title}
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-8">
                {benefit.description}
              </p>

              {/* Botão de Saiba Mais (Sutil) */}
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 group-hover:text-black transition-colors">
                Saiba mais 
                <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}