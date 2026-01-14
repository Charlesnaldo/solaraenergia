'use client';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Smartphone, ChevronLeft, Bell, Zap } from 'lucide-react';
import { m } from 'framer-motion'; // Importamos 'm' em vez de 'motion'

export default function AppComingSoon() {
  return (
    <div className="pt-27 min-h-screen bg-[#000814] flex flex-col items-center justify-start px-6 relative overflow-hidden">
      {/* Efeito de luz de fundo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-yellow-500/10 rounded-full blur-[120px] pointer-events-none" />

      <m.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center space-y-8 relative z-10"
      >
        {/* Ícone Animado */}
        <div className="relative inline-block">
          <div className="w-24 h-24 bg-yellow-500/10 rounded-3xl border border-yellow-500/20 flex items-center justify-center mx-auto">
            <Smartphone className="text-yellow-500 w-12 h-12" />
          </div>
          <m.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/20"
          >
            <Zap size={14} className="text-black fill-current" />
          </m.div>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-white">App Solara</h1>
          <p className="text-yellow-500 font-medium tracking-widest uppercase text-sm">Em Desenvolvimento</p>
          <p className="text-slate-400 leading-relaxed">
            Estamos construindo uma experiência completa para você gerenciar sua energia, créditos e faturas direto do seu celular.
          </p>
        </div>

        {/* Mockup de features */}
        <div className="grid grid-cols-2 gap-4 text-left">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <Bell size={18} className="text-yellow-500 mb-2" />
            <h3 className="text-white text-xs font-bold uppercase">Alertas</h3>
            <p className="text-slate-500 text-[11px]">Notificações de economia em tempo real.</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <Zap size={18} className="text-yellow-500 mb-2" />
            <h3 className="text-white text-xs font-bold uppercase">Gestão</h3>
            <p className="text-slate-500 text-[11px]">Acompanhe suas usinas e faturas.</p>
          </div>
        </div>

        <div className="pt-8 space-y-4">
          <Link 
            href="/"
            className="flex items-center justify-center gap-2 text-slate-400 hover:text-white transition-colors group"
          >
            <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            Voltar para o site
          </Link>
        </div>
      </m.div>

      {/* Badges de lojas */}
      <div className="mt-16 flex gap-6 opacity-30 grayscale">
        <Image src="/app/rnk-aplicativo-google-play.png" alt="Play Store" width={120} height={36} className="h-8 w-auto" />
        <Image src="/app/rnk-aplicativo-app-store.png" alt="App Store" width={120} height={36} className="h-8 w-auto" />
      </div>
    </div>
  );
}