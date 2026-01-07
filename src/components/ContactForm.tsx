'use client';
import { motion } from 'framer-motion';
import { Send, User, Mail, Phone, MessageSquare, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function ContactForm() {
  return (
    // Fundo Off-White (Slate-50) para um visual limpo e moderno
    <section className="relative py-24 bg-[#e9e9e9] overflow-hidden">
      
      {/* Detalhe de fundo - Um círculo sutil para profundidade */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Coluna de Texto: Tipografia em Slate-900 (Contraste Máximo) */}
          <div className="space-y-8">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-yellow-600 block mb-4">
                Solicite uma Análise
              </span>
              <h2 className="text-4xl md:text-6xl font-black text-slate-900 leading-[1.1] uppercase tracking-tighter">
                Engenharia <br />
                de <span className="text-yellow-500 text-shadow-sm">Precisão.</span>
              </h2>
            </div>
            
            <p className="text-slate-500 text-lg leading-relaxed max-w-md">
              Não fazemos apenas orçamentos, entregamos um estudo técnico completo de viabilidade para o seu consumo.
            </p>

            <div className="space-y-4">
              {["Análise técnica em 24h", "Projeção real de economia", "Suporte em todo o Nordeste"].map((text, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-yellow-500" />
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-700">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Coluna do Formulário: Branco Puro com Sombra Suave */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white border border-slate-200 p-8 md:p-12 rounded-[3rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)]"
          >
            <form className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome Completo</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 text-slate-900 text-sm outline-none focus:border-yellow-500 transition-all placeholder:text-slate-300"
                  placeholder="Seu nome"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">WhatsApp</label>
                  <input 
                    type="tel" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 text-slate-900 text-sm outline-none focus:border-yellow-500 transition-all placeholder:text-slate-300"
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Gasto Mensal</label>
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 text-slate-900 text-sm outline-none focus:border-yellow-500 transition-all appearance-none cursor-pointer">
                    <option>Até R$ 2.000</option>
                    <option>R$ 2.000 a R$ 10.000</option>
                    <option>Acima de R$ 10.000</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Breve Descrição</label>
                <textarea 
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 text-slate-900 text-sm outline-none focus:border-yellow-500 transition-all resize-none placeholder:text-slate-300"
                  placeholder="Como a Solara pode ajudar você hoje?"
                ></textarea>
              </div>

              <button className="w-full group bg-slate-900 hover:bg-yellow-500 text-white hover:text-black font-black py-5 rounded-2xl uppercase text-[11px] tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl">
                Enviar Mensagem
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          </motion.div>

        </div>
      </div>
    </section>
  );
}