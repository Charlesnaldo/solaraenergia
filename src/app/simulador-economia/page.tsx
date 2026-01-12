'use client';
import React, { useState, useRef } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { CheckCircle2, MessageSquare, FileUp, ArrowLeft } from 'lucide-react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import Link from 'next/link';
import Image from 'next/image';

export default function SimuladorPage() {
  const { width, height } = useWindowSize();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    cidade: '',
    valorConta: ''
  });

  const [arquivo, setArquivo] = useState<File | null>(null);
  const [isEnviado, setIsEnviado] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Lógica de economia: 90% de redução na conta
  const mensal = Number(formData.valorConta) * 0.90;
  const total25Anos = mensal * 12 * 25;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const processarSimulacao = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfetti(true);
    setIsEnviado(true);
  };

  const enviarWhatsApp = () => {
    const meuNumero = "5585999999999"; // Número oficial Solara
    const msg = `*SIMULAÇÃO SOLARA*%0A*Nome:* ${formData.nome}%0A*WhatsApp:* ${formData.telefone}%0A*Cidade:* ${formData.cidade}%0A*Economia Estimada:* R$ ${mensal.toFixed(2)}/mês`;
    window.open(`https://wa.me/${meuNumero}?text=${msg}`, '_blank');
  };

  return (
    <main className="relative min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 md:p-6 overflow-x-hidden overflow-y-auto">

      {/* BACKGROUND COM ZOOM DINÂMICO */}
      <div className="absolute inset-0 z-0 h-full w-full overflow-hidden fixed">
        <m.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="relative w-full h-full"
        >
          <Image
            src="/usinas/beberibe.avif"
            alt="Background"
            fill
            priority
            className="object-cover opacity-50"
          />
        </m.div>
        <div className="absolute inset-0 bg-slate-900/40" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/0 via-transparent to-slate-950" />
      </div>

      {showConfetti && (
        <Confetti 
          width={width} 
          height={height} 
          recycle={false} 
          numberOfPieces={width < 768 ? 150 : 400} 
          colors={['#EAB308', '#FFFFFF', '#0F172A']}
        />
      )}

      <div className="relative z-10 w-full max-w-2xl my-auto py-10">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-slate-400 hover:text-yellow-500 mb-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Voltar ao Início
        </Link>

        <div className="bg-slate-900/90 border border-white/10 p-6 md:p-10 rounded-[2rem] backdrop-blur-3xl shadow-2xl overflow-hidden">
          <AnimatePresence mode="wait">
            {!isEnviado ? (
              <m.form
                key="step-form" 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 1.05 }}
                onSubmit={processarSimulacao} 
                className="space-y-6"
              >
                <div className="text-center space-y-2 mb-4">
                  <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter">
                    Simulador <span className="text-yellow-500">Solara</span>
                  </h1>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.3em]">Reduza sua conta em até 90%</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black text-yellow-500 ml-1">Seu Nome</label>
                    <input name="nome" placeholder="Ronaldo Charles" required onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:border-yellow-500 outline-none transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black text-yellow-500 ml-1">WhatsApp</label>
                    <input name="telefone" placeholder="(85) 99999-9999" required onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:border-yellow-500 outline-none transition-all" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black text-yellow-500 ml-1">Sua Cidade</label>
                    <input name="cidade" placeholder="Ex: Fortaleza" required onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:border-yellow-500 outline-none transition-all" />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black text-yellow-500 ml-1">Valor da Fatura</label>
                    <input name="valorConta" type="number" placeholder="R$ 0,00" required onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-yellow-500 font-black focus:border-yellow-500 outline-none transition-all" />
                  </div>
                </div>

                <div 
                  onClick={() => fileInputRef.current?.click()} 
                  className="group h-24 border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center cursor-pointer hover:border-yellow-500/50 hover:bg-yellow-500/5 transition-all"
                >
                  <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => setArquivo(e.target.files?.[0] || null)} />
                  <div className="flex flex-col items-center gap-2">
                    <FileUp size={20} className="text-slate-500 group-hover:text-yellow-500 transition-colors" />
                    <span className="text-[10px] text-slate-500 group-hover:text-slate-300 uppercase font-black tracking-widest">
                      {arquivo ? arquivo.name : 'Anexar Fatura (Opcional)'}
                    </span>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black py-5 rounded-2xl uppercase text-xs tracking-[0.3em] transition-all active:scale-[0.98] shadow-2xl shadow-yellow-500/20"
                >
                  Gerar Simulação Grátis
                </button>
              </m.form>
            ) : (
              <m.div 
                key="step-result" 
                initial={{ opacity: 0, y: 30 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="text-center space-y-8"
              >
                <div className="bg-yellow-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(234,179,8,0.3)]">
                  <CheckCircle2 className="text-black" size={40} />
                </div>

                <div className="space-y-2">
                  <h2 className="text-3xl font-black uppercase tracking-tighter">Economia Detectada!</h2>
                  <p className="text-slate-500 text-[10px] uppercase font-bold tracking-[0.2em]">Sua empresa pode economizar:</p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-sm">
                    <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-3">Mensalmente</p>
                    <p className="text-4xl font-black text-yellow-500 leading-none">R$ {mensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-sm">
                    <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-3">Em 25 Anos</p>
                    <p className="text-4xl font-black text-white leading-none">R$ {total25Anos.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</p>
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <button 
                    onClick={enviarWhatsApp} 
                    className="w-full bg-green-600 hover:bg-green-500 py-6 rounded-2xl font-black uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Falar com Especialista <MessageSquare size={20} />
                  </button>

                  <button 
                    onClick={() => setIsEnviado(false)} 
                    className="text-[10px] text-slate-500 hover:text-white uppercase font-black tracking-[0.2em] py-4 flex items-center justify-center gap-2 mx-auto transition-colors"
                  >
                    ← Refazer Cálculo
                  </button>
                </div>
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}