'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, EyeOff, Eye, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';

export default function LoginModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay de fundo */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-md"
          />

          {/* Container do Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-md p-4"
          >
            <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] relative overflow-hidden">
              
              {/* Brilho decorativo atrás da logo */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-yellow-500/20 rounded-full blur-[50px] pointer-events-none" />

              {/* Botão Fechar */}
              <button 
                onClick={onClose} 
                className="absolute top-6 right-6 p-2 rounded-full text-slate-500 hover:text-white hover:bg-white/5 transition-all"
              >
                <X size={20} />
              </button>

              {/* Cabeçalho com a LOGO */}
              <div className="text-center mb-10">
                <div className="relative w-40 h-16 mx-auto mb-4 transition-transform duration-500 hover:scale-110">
                  <Image 
                    src="/Solara2.svg" 
                    alt="Logo Solara" 
                    fill 
                    className="object-contain"
                  />
                </div>
                <h2 className="text-[18px] font-black text-white font-poppins tracking-tight uppercase">Acesse sua conta</h2>
                <p className="text-slate-400 text-[10px] mt-2 font-bold tracking-[0.2em] uppercase opacity-60">Área Exclusiva</p>
              </div>

              {/* Formulário */}
              <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                
                {/* Campo E-mail */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">E-mail corporativo</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-yellow-500 transition-colors" size={18} />
                    <input 
                      type="email" 
                      placeholder="email@empresa.com.br" 
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm outline-none focus:border-yellow-500/50 focus:bg-white/[0.05] transition-all placeholder:text-slate-600" 
                    />
                  </div>
                </div>

                {/* Campo Senha */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Senha secreta</label>
                    <button type="button" className="text-[10px] font-black text-yellow-500/60 hover:text-yellow-500 uppercase tracking-widest transition-colors">Esqueceu?</button>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-yellow-500 transition-colors" size={18} />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-white text-sm outline-none focus:border-yellow-500/50 focus:bg-white/[0.05] transition-all placeholder:text-slate-600" 
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Botão Entrar */}
                <button className="group relative w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-3 overflow-hidden active:scale-[0.98] mt-6">
                  <span className="relative z-10 uppercase tracking-widest text-xs">Entrar no Sistema</span>
                  <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
                </button>
              </form>

              {/* Rodapé */}
              <div className="mt-8 pt-6 border-t border-white/5 text-center">
                <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">
                  Solara &copy; 2026 - Tecnologia Fotovoltaica
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}