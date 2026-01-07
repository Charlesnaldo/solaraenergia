'use client';
import Image from 'next/image';
// 1. Importe a sua imagem aqui (ajuste o nome do arquivo se necessário)
import fotoHero from '@/assents/hero.png'; 

export default function Hero() {
  return (
    <section className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden">
      
      {/* Container da Imagem com Zoom e Camada Amarela */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        
        {/* 2. Substituímos a div com style por uma div que contém o componente Image */}
        <div className="absolute inset-0 animate-zoom-slow">
          <Image
            src={fotoHero}
            alt="Fundo Solara"
            fill
            priority
            className="object-cover"
          />
        </div>

        {/* Camada Amarela (Overlay) - Mantida conforme seu código */}
        <div className="absolute inset-0 bg-yellow-200/40 mix-blend-multiply" />

        {/* Gradiente extra - Mantido conforme seu código */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      </div>

      {/* Conteúdo Central - Mantido exatamente como o seu */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 text-center text-white">
        <div className="mb-8 flex justify-center">
          <span className="px-4 py-1.5 rounded-full border border-solara-yellow/50 bg-solara-yellow/10 text-solara-yellow text-sm font-bold uppercase tracking-widest backdrop-blur-sm">
            Energia Inteligente
          </span>
        </div>

        <h1 className="text-6xl md:text-8xl font-black mb-8 tracking-tighter leading-[0.9]">
          O SOL TRABALHA <br />
          <span className="text-solara-yellow drop-shadow-2xl">PARA VOCÊ</span>
        </h1>

        <p className="text-lg md:text-2xl text-gray-200 max-w-3xl mx-auto mb-12 font-light leading-relaxed">
          Usinas solares de alta performance que transformam luz em
          liberdade financeira para sua empresa ou residência.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <button className="group relative bg-solara-yellow text-solara-dark px-12 py-5 rounded-full font-black text-xl hover:scale-105 transition-all shadow-[0_0_20px_rgba(251,191,36,0.4)]">
            QUERO ECONOMIZAR AGORA
          </button>

          <button className="group flex items-center gap-3 text-white font-bold text-lg hover:text-solara-yellow transition-colors">
            <span className="w-12 h-12 rounded-full border border-white/30 flex items-center justify-center group-hover:border-solara-yellow transition-colors">
              ▶
            </span>
            Ver nossas usinas 
          </button>
        </div>
      </div>

      {/* Indicador de scroll */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center p-1">
          <div className="w-1 h-2 bg-white rounded-full" />
        </div>
      </div>
    </section>
  );
}