'use client';
import { motion } from 'framer-motion';
import { MapPin, Zap, Layers, ArrowUpRight } from 'lucide-react';
import { PLANTS } from "@/constants/plants";

export default function PlantSection() {
  return (
    <section id="usinas" className="pt-18 pb-25 bg-slate-950 relative overflow-hidden">
      {/* Detalhe de luz de fundo para não ficar um preto "morto" */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(234,179,8,0.05),transparent_70%)]" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Cabeçalho de Seção - Agora em Branco/Cinza para contraste */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-6">
          <div className="max-w-xl">
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-yellow-500/80 block mb-4">
              Portfólio de Ativos
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-white leading-tight uppercase tracking-tighter">
              Nossas <span className="text-yellow-500">Usinas</span> <br />
              Tecnologia em escala.
            </h2>
          </div>
          <p className="text-slate-400 text-sm md:text-base max-w-xs leading-relaxed border-l border-white/10 pl-6">
            Estruturas de alta performance que garantem a máxima captação energética durante todo o ano.
          </p>
        </div>

        {/* Grid de Usinas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {PLANTS.map((plant, index) => (
            <motion.div 
              key={plant.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group bg-white/[0.03] backdrop-blur-sm rounded-[2.5rem] overflow-hidden border border-white/5 hover:border-yellow-500/30 transition-all duration-700"
            >
              {/* Imagem */}
              <div className="relative h-64 overflow-hidden">
                <img 
                  src={plant.image} 
                  alt={plant.title} 
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 grayscale-[30%] group-hover:grayscale-0"
                />
                
                {/* Status Badge - Floating */}
                <div className="absolute top-6 left-6">
                  <span className="bg-yellow-500 text-black text-[10px] font-black uppercase tracking-[0.1em] px-4 py-1.5 rounded-full shadow-xl">
                    {plant.status}
                  </span>
                </div>
              </div>

              {/* Conteúdo - Dark Mode */}
              <div className="p-8">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-1">
                      {plant.title}
                    </h3>
                    <p className="text-slate-500 text-xs flex items-center gap-1.5 font-bold uppercase tracking-widest">
                      <MapPin size={12} className="text-yellow-500" />
                      {plant.location}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white group-hover:bg-yellow-500 group-hover:text-black transition-all duration-500">
                    <ArrowUpRight size={24} />
                  </div>
                </div>

                {/* Specs Grid com Design de Painel */}
                <div className="grid grid-cols-2 gap-0 border-t border-white/5">
                  <div className="py-6 pr-4 border-r border-white/5">
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">
                      <Zap size={12} className="text-yellow-500" />
                      Potência
                    </div>
                    <p className="text-white font-black text-2xl tracking-tighter">{plant.capacity}</p>
                  </div>
                  <div className="py-6 pl-8">
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">
                      <Layers size={12} className="text-yellow-500" />
                      Painéis
                    </div>
                    <p className="text-white font-black text-2xl tracking-tighter">{plant.panels}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      
    </section>
  );
}