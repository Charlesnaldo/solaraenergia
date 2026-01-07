'use client';
import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Calculator, Send, Zap, CheckCircle2, MessageSquare, FileUp, User, MapPin, Phone } from 'lucide-react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import Link from 'next/link';

export default function SimuladorPage() {
  const { width, height } = useWindowSize();
  
  // Estados dos Campos
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    cidade: '',
    valorConta: ''
  });
  
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [isEnviado, setIsEnviado] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lógica de cálculo
  const mensal = Number(formData.valorConta) * 0.90;
  const total25Anos = mensal * 12 * 25;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setArquivo(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfetti(true);
    setIsEnviado(true);
    setTimeout(() => setShowConfetti(false), 5000);
  };

  const enviarWhatsApp = () => {
    const numero = "5585999999999"; // Seu número da Solara
    const temArquivo = arquivo ? "Sim (Cliente possui a fatura)" : "Não anexado";

    const msg = `*NOVA SIMULAÇÃO SOLARA*%0A%0A` +
      `• *Nome:* ${formData.nome}%0A` +
      `• *Telefone:* ${formData.telefone}%0A` +
      `• *Cidade:* ${formData.cidade}%0A` +
      `• *Conta Mensal:* R$ ${formData.valorConta}%0A` +
      `• *Economia Estimada:* R$ ${mensal.toFixed(2)}/mês%0A` +
      `• *Acumulado 25 anos:* R$ ${total25Anos.toFixed(2)}%0A` +
      `• *Fatura Anexada:* ${temArquivo}%0A%0A` +
      `Olá! Acabei de simular no site e gostaria de um orçamento detalhado.`;

    window.open(`https://wa.me/${numero}?text=${msg}`, '_blank');
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 py-20">
      {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={400} colors={['#EAB308', '#000', '#fff']} />}

      <div className="max-w-3xl w-full">
        <Link href="/" className="text-slate-500 hover:text-yellow-500 mb-8 inline-block transition-colors text-[10px] tracking-[0.3em]">
          ← VOLTAR PARA A HOME
        </Link>

        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-3xl font-black uppercase tracking-tighter">
            SIMULADOR <span className="text-yellow-500 text-glow">SOLARA</span>
          </h1>
        </div>

        <div className="bg-white/5 border border-white/10 p-8 md:p-12 rounded-[2.5rem] backdrop-blur-xl shadow-2xl">
          {!isEnviado ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* NOME E TELEFONE */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-yellow-500 flex items-center gap-2">
                    <User size={12}/> Nome Completo
                  </label>
                  <input
                    type="text"
                    name="nome"
                    required
                    value={formData.nome}
                    onChange={handleInputChange}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-sm font-medium outline-none focus:border-yellow-500 transition-all"
                    placeholder="Ex: Ronaldo Charles"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-yellow-500 flex items-center gap-2">
                    <Phone size={12}/> WhatsApp
                  </label>
                  <input
                    type="tel"
                    name="telefone"
                    required
                    value={formData.telefone}
                    onChange={handleInputChange}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-sm font-medium outline-none focus:border-yellow-500 transition-all"
                    placeholder="(85) 99999-9999"
                  />
                </div>
              </div>

              {/* CIDADE E VALOR CONTA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-yellow-500 flex items-center gap-2">
                    <MapPin size={12}/> Sua Cidade
                  </label>
                  <input
                    type="text"
                    name="cidade"
                    required
                    value={formData.cidade}
                    onChange={handleInputChange}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-sm font-medium outline-none focus:border-yellow-500 transition-all"
                    placeholder="Ex: Fortaleza"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-yellow-500 flex items-center gap-2">
                    <Zap size={12}/> Valor da Conta (R$)
                  </label>
                  <input
                    type="number"
                    name="valorConta"
                    required
                    value={formData.valorConta}
                    onChange={handleInputChange}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-sm font-black outline-none focus:border-yellow-500 transition-all text-yellow-500"
                    placeholder="0,00"
                  />
                </div>
              </div>

              {/* CAMPO: UPLOAD DE ARQUIVO */}
              <div className="space-y-4 pt-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-yellow-500">Anexar Fatura (Opcional)</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`group relative h-28 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                    arquivo ? 'border-yellow-500 bg-yellow-500/5' : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,.pdf" />

                  {arquivo ? (
                    <div className="flex flex-col items-center gap-1">
                      <CheckCircle2 className="text-yellow-500" size={20} />
                      <span className="text-xs font-bold text-white">{arquivo.name}</span>
                      <button type="button" onClick={(e) => { e.stopPropagation(); setArquivo(null); }} className="text-[9px] uppercase font-black text-red-400">Remover</button>
                    </div>
                  ) : (
                    <>
                      <FileUp className="text-slate-500 mb-1" size={24} />
                      <span className="text-slate-400 text-xs font-medium">PDF ou Imagem da conta</span>
                    </>
                  )}
                </div>
              </div>

              <button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black py-5 rounded-2xl uppercase tracking-widest flex items-center justify-center gap-3 transition-transform active:scale-95 shadow-[0_0_30px_rgba(234,179,8,0.2)]">
                SIMULAR AGORA <Calculator size={20} />
              </button>
            </form>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-8 py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-500 rounded-full">
                <CheckCircle2 size={32} className="text-black" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                  <p className="text-slate-400 text-[9px] font-black uppercase mb-1">Economia Mensal</p>
                  <p className="text-2xl font-black text-yellow-500 text-glow">R$ {mensal.toLocaleString('pt-BR')}</p>
                </div>
                <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                  <p className="text-slate-400 text-[9px] font-black uppercase mb-1">Total em 25 Anos</p>
                  <p className="text-2xl font-black text-white">R$ {total25Anos.toLocaleString('pt-BR')}</p>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-slate-400 text-sm italic">Parabéns {formData.nome.split(' ')[0]}! Sua economia está garantida.</p>
                <button
                  onClick={enviarWhatsApp}
                  className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-5 rounded-2xl uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-[0_10px_30px_rgba(22,163,74,0.3)]"
                >
                  ENVIAR NO WHATSAPP <MessageSquare size={20} />
                </button>

                <button
                  onClick={() => setIsEnviado(false)}
                  className="text-slate-400 hover:text-yellow-500 text-sm uppercase font-black tracking-widest transition-colors flex items-center justify-center gap-2 mx-auto mt-6"
                >
                  ← Refazer o cálculo
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </main>
  );
}