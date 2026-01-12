'use client';
// 1. Trocamos motion por m
import { m } from 'framer-motion';
import { MapPin, Zap, Layers, ArrowUpRight } from 'lucide-react';
import { PLANTS } from "@/constants/plants";
import Image from 'next/image';

export default function PlantSection() {
  return (
    <section id="usinas" className="pt-20 pb-28 bg-slate-950 relative overflow-hidden">

      {/* Fundo de Pontos */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle fill='%23ffffff' cx='1' cy='1' r='1'/%3E%3C/svg%3E")`,
            maskImage: 'radial-gradient(circle at center, white, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(circle at center, white, transparent 80%)'
          }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">

        {/* Cabeçalho de Seção */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-6">
          <div className="max-w-xl">
            <span className="text-[10px] font-bold uppercase tracking-normal text-yellow-500/80 block mb-4">
              Portfólio de Ativos
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-white leading-tight uppercase tracking-normal">
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
            /* 2. Trocado para m.div */
            <m.div
              key={plant.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }} // Ativa um pouco antes de entrar totalmente na tela
              transition={{ delay: index * 0.1 }}
              className="group bg-white/[0.03] backdrop-blur-sm rounded-[2.5rem] overflow-hidden border border-white/5 hover:border-yellow-500/30 transition-all duration-700"
            >
              {/* Imagem com Next.js Image Component */}
              <div className="relative h-64 overflow-hidden">
                <Image
                  src={plant.image}
                  alt={plant.title}
                  fill
                  className="object-cover transition-transform duration-1000 group-hover:scale-110 grayscale-[30%] group-hover:grayscale-0"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  // Removido o priority aqui, pois as usinas costumam ficar abaixo da dobra (Below the fold)
                />

                <div className="absolute top-6 left-6">
                  <span className="bg-yellow-500 text-black text-[10px] font-black uppercase tracking-normal px-4 py-1.5 rounded-full shadow-xl">
                    {plant.status}
                  </span>
                </div>
              </div>

              {/* Conteúdo */}
              <div className="p-8">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-normal mb-1">
                      {plant.title}
                    </h3>
                    <p className="text-slate-500 text-xs flex items-center gap-1.5 font-bold uppercase tracking-normal">
                      <MapPin size={12} className="text-yellow-500" />
                      {plant.location}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white group-hover:bg-yellow-500 group-hover:text-black transition-all duration-500">
                    <ArrowUpRight size={24} />
                  </div>
                </div>

                {/* Specs Grid */}
                <div className="grid grid-cols-2 gap-0 border-t border-white/5">
                  <div className="py-6 pr-4 border-r border-white/5">
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase font-black tracking-normal mb-2">
                      <Zap size={12} className="text-yellow-500" />
                      Potência
                    </div>
                    <p className="text-white font-black text-2xl tracking-normal">{plant.capacity}</p>
                  </div>
                  <div className="py-6 pl-8">
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase font-black tracking-normal mb-2">
                      <Layers size={12} className="text-yellow-500" />
                      Painéis
                    </div>
                    <p className="text-white font-black text-2xl tracking-normal">{plant.panels}</p>
                  </div>
                </div>
              </div>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}