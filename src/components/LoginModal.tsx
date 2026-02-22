'use client';
import { m, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, EyeOff, Eye, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirectPath?: string;
}

export default function LoginModal({ isOpen, onClose, redirectPath = '/admin' }: LoginModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

      if (authError) {
        setError(authError.message);
        return;
      }

      onClose();
      router.push(redirectPath);
      router.refresh();
    } catch {
      setError('Configuração do Supabase ausente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-md"
          />

          <m.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', duration: 0.5, bounce: 0.3 }}
            className="relative z-[101] w-full max-w-md"
          >
            <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-yellow-500/20 rounded-full blur-[50px] pointer-events-none" />

              <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 rounded-full text-slate-500 hover:text-white hover:bg-white/5 transition-all z-20"
              >
                <X size={20} />
              </button>

              <div className="text-center mb-10 relative z-10">
                <div className="relative w-40 h-16 mx-auto mb-4 transition-transform duration-500 hover:scale-105">
                  <Image src="/Solara2.svg" alt="Logo Solara" fill className="object-contain" />
                </div>
                <h2 className="text-[18px] font-black text-white tracking-tight uppercase">Acesse sua conta</h2>
                <p className="text-slate-400 text-[10px] mt-2 font-bold tracking-[0.2em] uppercase opacity-60">Área Exclusiva</p>
              </div>

              <form className="space-y-5 relative z-10" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail corporativo</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-yellow-500 transition-colors" size={18} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@empresa.com.br"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm outline-none focus:border-yellow-500/50 focus:bg-white/[0.05] transition-all placeholder:text-slate-600"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Senha</label>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-yellow-500 transition-colors" size={18} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="********"
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

                {error ? <p className="text-sm text-rose-300">{error}</p> : null}

                <button disabled={loading} className="group relative w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-3 overflow-hidden active:scale-[0.98] mt-6 shadow-xl shadow-yellow-500/10 disabled:opacity-60">
                  <span className="relative z-10 uppercase tracking-widest text-xs">{loading ? 'Entrando...' : 'Entrar no Sistema'}</span>
                  <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-white/5 text-center relative z-10">
                <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold">
                  Solara &copy; 2026 - Tecnologia Fotovoltaica
                </p>
              </div>
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}
