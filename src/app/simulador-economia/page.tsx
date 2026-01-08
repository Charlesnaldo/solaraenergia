'use client';
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, CheckCircle2, MessageSquare, FileUp, User, MapPin, Phone, ArrowLeft } from 'lucide-react';
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
    const meuNumero = "5585999999999";
    const msg = `*SIMULAÇÃO SOLARA*%0A*Nome:* ${formData.nome}%0A*WhatsApp:* ${formData.telefone}%0A*Cidade:* ${formData.cidade}%0A*Economia:* R$ ${mensal.toFixed(2)}/mês`;
    window.open(`https://wa.me/${meuNumero}?text=${msg}`, '_blank');
  };

  return (
    // Adicionado overflow-y-auto para permitir scroll em celulares pequenos
    <main className="relative min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 md:p-6 overflow-y-auto">

      <div className="absolute inset-0 z-0 h-[100vh] w-full overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.15, 1], // Aumenta 15% e volta ao original
          }}
          transition={{
            duration: 20, // Tempo de um ciclo completo (20 segundos para ser bem suave)
            repeat: Infinity, // Loop infinito
            ease: "linear", // Movimento constante
          }}
          className="relative w-full h-full"
        >
          <Image
            src="/usinas/beberibe.webp"
            alt="Background"
            fill
            priority
            className="object-cover opacity-50"
          />
        </motion.div>

        {/* Máscara Azul e Degradê (Mantidos para manter a identidade visual) */}
        <div className="absolute inset-0 bg-blue-900/40 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/0 via-slate-950/50 to-slate-950" />
      </div>

      {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={width < 768 ? 200 : 500} />}

      <div className="relative mt-15 z-10 w-full max-w-2xl my-8">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-yellow-500 mb-4 md:mb-6 text-[10px] font-bold uppercase tracking-widest transition-colors">
          <ArrowLeft size={12} /> Voltar
        </Link>

        {/* Ajuste de Padding: p-6 no mobile e p-10 no desktop */}
        <div className="bg-slate-900/80 border border-white/10 p-6 md:p-10 rounded-[1.5rem] md:rounded-[2rem] backdrop-blur-2xl shadow-2xl">
          <AnimatePresence mode="wait">
            {!isEnviado ? (
              <motion.form
                key="f1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onSubmit={processarSimulacao} className="space-y-4 md:space-y-5"
              >
                <div className="text-center space-y-1">
                  <h1 className="text-xl md:text-2xl font-black uppercase tracking-normal">Simulador <span className="text-yellow-500">Solara</span></h1>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">Preencha para ver sua economia</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-yellow-500 ml-1">Nome</label>
                    <input name="nome" placeholder="Seu nome" required onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 md:p-4 text-sm focus:border-yellow-500 outline-none transition-all" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-yellow-500 ml-1">WhatsApp</label>
                    <input name="telefone" placeholder="(00) 00000-0000" required onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 md:p-4 text-sm focus:border-yellow-500 outline-none transition-all" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-yellow-500 ml-1">Cidade</label>
                    <input name="cidade" placeholder="Sua cidade" required onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 md:p-4 text-sm focus:border-yellow-500 outline-none transition-all" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-yellow-500 ml-1">Valor da Fatura</label>
                    <input name="valorConta" type="number" placeholder="R$ 0,00" required onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 md:p-4 text-sm text-yellow-500 font-bold focus:border-yellow-500 outline-none transition-all" />
                  </div>
                </div>

                <div onClick={() => fileInputRef.current?.click()} className="h-16 md:h-20 border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center cursor-pointer hover:bg-white/5 transition-all">
                  <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => setArquivo(e.target.files?.[0] || null)} />
                  <span className="text-[10px] md:text-xs text-slate-400 flex items-center gap-2 px-4 text-center">
                    <FileUp size={14} /> {arquivo ? <span className="text-yellow-500 truncate max-w-[150px]">{arquivo.name}</span> : 'Anexar Fatura (Opcional)'}
                  </span>
                </div>

                <button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black py-4 rounded-xl uppercase text-xs md:text-sm tracking-widest transition-transform active:scale-95 shadow-lg shadow-yellow-500/10">
                  Calcular Agora
                </button>
              </motion.form>
            ) : (
              <motion.div key="f2" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6 py-2">
                <div className="bg-yellow-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-yellow-500/20">
                  <CheckCircle2 className="text-black" size={24} />
                </div>

                <h2 className="text-lg md:text-xl font-black uppercase italic">Economia Garantida!</h2>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
                    <p className="text-[9px] text-slate-400 uppercase font-bold tracking-tighter">Economia Mensal</p>
                    <p className="text-2xl font-bold text-yellow-500">R$ {mensal.toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
                    <p className="text-[9px] text-slate-400 uppercase font-bold tracking-tighter">Total em 25 anos</p>
                    <p className="text-2xl font-bold text-white">R$ {total25Anos.toLocaleString('pt-BR')}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <button onClick={enviarWhatsApp} className="w-full bg-green-600 hover:bg-green-500 py-4 rounded-xl font-black uppercase text-xs md:text-sm tracking-widest flex items-center justify-center gap-2 shadow-xl animate-pulse">
                    Receber no WhatsApp <MessageSquare size={18} />
                  </button>

                  <button onClick={() => setIsEnviado(false)} className="text-[10px] text-slate-500 hover:text-white uppercase font-bold tracking-widest pt-2 flex items-center justify-center gap-1 mx-auto transition-colors">
                    ← Refazer cálculo
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}