'use client';

import React from 'react';
import Image from 'next/image';
import { m } from 'framer-motion';
import { ArrowUpRight } from "lucide-react";
import { BENEFITS } from "@/constants";

export default function Benefits() {
  return (
    <section className="relative py-24 overflow-hidden bg-slate-950" id="beneficios">
      
      
      <div className="absolute inset-0 z-0">
        <Image 
          src="/usinas/usinaparabackground.avif" 
          alt="Energia Solar Solara"
          fill
          className="object-cover opacity-100" 
          quality={80}
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/80 to-slate-950" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Cabeçalho da Seção */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
          <div className="max-w-2xl">
            <m.span 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-[10px] font-black uppercase tracking-[0.5em] text-yellow-500 block mb-4"
            >
              Vantagens Exclusivas
            </m.span>
            <m.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-black text-white leading-[1.1] uppercase tracking-tighter"
            >
              A solução definitiva para <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
                sua liberdade energética.
              </span>
            </m.h2>
          </div>
          <m.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-slate-400 text-sm md:text-base max-w-xs leading-relaxed border-l border-white/10 pl-6"
          >
            Toda a economia da inteligência fotovoltaica utilizando nossas usinas, sem precisar instalar nada no seu telhado.
          </m.p>
        </div>

        {/* Grid de Benefícios */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {BENEFITS.map((benefit, index) => {
            const Icon = benefit.icon;

            return (
              <m.div 
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -10 }}
                className="group relative p-10 rounded-[2.5rem] border border-white/5 bg-white/[0.03] backdrop-blur-md hover:bg-white/[0.07] hover:border-yellow-500/30 transition-all duration-500"
              >
                {/* Efeito de brilho no hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.5rem]" />

                <div className="flex items-center justify-between mb-10 relative z-10">
                  <div className="p-4 bg-yellow-500 text-black rounded-2xl shadow-[0_15px_30px_-5px_rgba(234,179,8,0.3)] group-hover:shadow-yellow-500/50 transition-all duration-500">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-yellow-400 transition-colors">
                    {benefit.tag}
                  </span>
                </div>

                <div className="relative z-10">
                  <h3 className="text-xl font-black text-white mb-4 uppercase tracking-tight">
                    {benefit.title}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-10 group-hover:text-slate-300 transition-colors">
                    {benefit.description}
                  </p>

                  <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-yellow-500/50 group-hover:text-yellow-500 transition-all cursor-pointer">
                    Saiba mais 
                    <div className="w-8 h-[1px] bg-yellow-500/30 group-hover:w-12 group-hover:bg-yellow-500 transition-all" />
                    <ArrowUpRight size={14} />
                  </div>
                </div>
              </m.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}