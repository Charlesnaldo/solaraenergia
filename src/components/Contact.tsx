'use client';
import { m } from 'framer-motion';
import { MessageSquare, ArrowRight, ShieldCheck, CheckCircle2, Zap } from 'lucide-react';
import Image from 'next/image';

export default function ContactUnified() {
  const whatsappNumber = "5585999999999"; 
  const message = encodeURIComponent("Olá! Gostaria de uma análise de viabilidade para minha empresa através da Solara.");

  return (
    <section id="contato" className="relative py-24 md:py-32 bg-[#020617] overflow-hidden">
      
      {/* --- FUNDO OTIMIZADO --- */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(234,179,8,0.08),transparent_50%),radial-gradient(circle_at_80%_70%,rgba(234,179,8,0.08),transparent_50%)]" />
        
        <m.div 
          initial={{ scale: 1.1, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 0.15 }}
          viewport={{ once: true }}
          transition={{ duration: 2 }}
          className="absolute inset-0 grayscale brightness-50"
        >
          <Image 
            src="/usinas/torre.avif" 
            alt="Torre de transmissão de energia ao entardecer"
            fill
            className="object-cover"
            sizes="100vw"
            quality={60}
          />
        </m.div>

        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-transparent to-[#020617]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* LADO ESQUERDO */}
          <div className="space-y-10">
            <m.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-6">
                <ShieldCheck size={16} className="text-yellow-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-yellow-500">
                  Gestão Energética B2B
                </span>
              </div>
              <h2 className="text-5xl md:text-7xl font-black text-white leading-[0.9] uppercase tracking-tighter">
                Reduza seus <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 italic">Custos Fixos.</span>
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed mt-8 max-w-md border-l-2 border-yellow-500/30 pl-6">
                Ative sua assinatura de energia limpa e economize mensalmente <span className="text-white font-bold">sem precisar de obras ou investimentos.</span>
              </p>
            </m.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {["Zero investimento", "Sem obras físicas", "Economia em contrato", "Energia 100% Verde"].map((text, i) => (
                <div key={i} className="flex items-center gap-3 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm">
                  <CheckCircle2 size={16} className="text-yellow-500" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">{text}</span>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <a 
                href={`https://wa.me/${whatsappNumber}?text=${message}`}
                aria-label="Falar com um consultor Solara via WhatsApp"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 text-yellow-500 font-bold uppercase text-[11px] tracking-widest hover:text-white transition-colors"
              >
                <MessageSquare size={18} />
                Ou fale com um consultor via WhatsApp
                <ArrowRight size={14} />
              </a>
            </div>
          </div>

          {/* LADO DIREITO: Formulário */}
          <m.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute -inset-1 bg-yellow-500/10 rounded-[3rem] blur-2xl" />
            
            <div className="relative bg-[#0a0f1e]/80 backdrop-blur-3xl border border-white/10 p-8 md:p-12 rounded-[3rem] shadow-2xl">
              <div className="mb-8">
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">Solicitar Análise de Viabilidade</h3>
                <p className="text-slate-400 text-xs mt-2 uppercase tracking-widest">Respostas em até 24 horas úteis</p>
              </div>

              <form className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="empresa" className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Razão Social ou CNPJ</label>
                  <input 
                    id="empresa"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm outline-none focus:border-yellow-500 focus:bg-white/10 transition-all placeholder:text-slate-600"
                    placeholder="Identificação da empresa"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label htmlFor="contato-whats" className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">WhatsApp Responsável</label>
                    <input 
                      id="contato-whats"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm outline-none focus:border-yellow-500 focus:bg-white/10 transition-all placeholder:text-slate-600"
                      placeholder="(00) 00000-0000"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="consumo" className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Média de Consumo (R$)</label>
                    <div className="relative">
                      {/* CORREÇÃO: Usando defaultValue no select em vez de 'selected' na option */}
                      <select 
                        id="consumo"
                        defaultValue=""
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm outline-none focus:border-yellow-500 transition-all appearance-none cursor-pointer"
                        required
                      >
                        <option value="" disabled className="bg-slate-900 text-slate-600">Selecione uma faixa</option>
                        <option value="5000" className="bg-slate-900">Até R$ 5.000</option>
                        <option value="20000" className="bg-slate-900">R$ 5.000 a R$ 20.000</option>
                        <option value="plus" className="bg-slate-900">Acima de R$ 20.000</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="mensagem" className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Mensagem (Opcional)</label>
                  <textarea 
                    id="mensagem"
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm outline-none focus:border-yellow-500 focus:bg-white/10 transition-all resize-none placeholder:text-slate-600"
                    placeholder="Diga-nos como podemos ajudar"
                  ></textarea>
                </div>

                <button 
                  type="submit"
                  className="w-full group bg-yellow-500 hover:bg-yellow-400 text-black font-black py-6 rounded-2xl uppercase text-[11px] tracking-[0.3em] transition-all flex items-center justify-center gap-3 shadow-[0_20px_40px_-10px_rgba(234,179,8,0.3)] active:scale-95"
                >
                  <Zap size={16} fill="black" />
                  Ativar Meu Desconto
                  <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                </button>
              </form>
            </div>
          </m.div>

        </div>
      </div>
    </section>
  );
}