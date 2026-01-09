'use client';
import { motion } from 'framer-motion';
import { ShieldCheck, TrendingDown, Leaf, ArrowUpRight } from "lucide-react";
import Image from 'next/image';

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
    <section className="relative py-24 overflow-hidden bg-slate-950" id="beneficios">
      
      {/* IMAGEM DE FUNDO COM OVERLAY */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="/usinas/usinaparabackground.avif" // Imagem de painéis solares no pôr do sol
          alt="Energia Solar"
          fill
          className="object-cover opacity-100" // Opacidade baixa para não brigar com o texto
          priority
        />
        {/* Gradiente para suavizar a imagem e focar no conteúdo */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/80 to-slate-950" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Cabeçalho da Seção */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
          <div className="max-w-2xl">
            <motion.span 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="text-[10px] font-black uppercase tracking-[0.5em] text-yellow-500 block mb-4"
            >
              Vantagens Exclusivas
            </motion.span>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-black text-white leading-[1.1] uppercase tracking-tighter"
            >
              A solução definitiva para <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
                sua liberdade energética.
              </span>
            </motion.h2>
          </div>
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-slate-400 text-sm md:text-base max-w-xs leading-relaxed border-l border-white/10 pl-6"
          >
            Combinamos tecnologia de ponta com engenharia de precisão para entregar resultados mensuráveis e sustentáveis.
          </motion.p>
        </div>

        {/* Grid de Benefícios */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {benefits.map((benefit, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              className="group relative p-10 rounded-[2.5rem] border border-white/5 bg-white/[0.03] backdrop-blur-md hover:bg-white/[0.07] hover:border-yellow-500/30 transition-all duration-500"
            >
              {/* Glow effect interno no hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.5rem]" />

              {/* Icon & Tag */}
              <div className="flex items-center justify-between mb-10 relative z-10">
                <div className="p-4 bg-yellow-500 text-black rounded-2xl shadow-[0_15px_30px_-5px_rgba(234,179,8,0.3)] group-hover:shadow-yellow-500/50 transition-all duration-500">
                  {benefit.icon}
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-yellow-400 transition-colors">
                  {benefit.tag}
                </span>
              </div>

              {/* Texto */}
              <div className="relative z-10">
                <h3 className="text-xl font-black text-white mb-4 uppercase tracking-tight">
                  {benefit.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-10 group-hover:text-slate-300 transition-colors">
                  {benefit.description}
                </p>

                {/* Link decorativo */}
                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-yellow-500/50 group-hover:text-yellow-500 transition-all">
                  Explorar benefício 
                  <div className="w-8 h-[1px] bg-yellow-500/30 group-hover:w-12 group-hover:bg-yellow-500 transition-all" />
                  <ArrowUpRight size={14} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}