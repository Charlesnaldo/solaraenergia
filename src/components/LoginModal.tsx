'use client';
import { m, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, EyeOff, Eye, ArrowRight, Smartphone } from 'lucide-react';
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
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'credentials' | 'code'>('credentials');
  const [challengeId, setChallengeId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? '';

  function getNetworkErrorMessage(err: unknown, fallback: string) {
    const message = err instanceof Error ? err.message : '';

    if (/failed to fetch/i.test(message)) {
      return 'Nao foi possivel conectar ao Supabase. Confira NEXT_PUBLIC_SUPABASE_URL, a rede e se o projeto Supabase esta online.';
    }

    return message || fallback;
  }

  const startLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

      if (authError) {
        setError(getNetworkErrorMessage(authError, 'Nao foi possivel autenticar.'));
        return;
      }

      const token = data.session?.access_token;
      if (!token) {
        throw new Error('No Supabase session returned after login.');
      }

      const res = await fetch('/api/auth/2fa/start', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = (await res.json().catch(() => ({}))) as { error?: string; challengeId?: string };
      if (!res.ok || !payload.challengeId) {
        throw new Error(payload.error ?? 'Nao foi possivel iniciar o 2FA.');
      }

      setAccessToken(token);
      setChallengeId(payload.challengeId);
      setStep('code');
    } catch (err) {
      setError(getNetworkErrorMessage(err, 'Configuracao do Supabase ou SMS ausente.'));
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!accessToken) {
        throw new Error('No Supabase session available for 2FA verification.');
      }

      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ challengeId, code }),
      });
      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(payload.error ?? 'Codigo invalido.');
      }

      onClose();
      setStep('credentials');
      setCode('');
      setChallengeId('');
      setAccessToken('');
      router.push(redirectPath);
      router.refresh();
    } catch (err) {
      setError(getNetworkErrorMessage(err, 'Codigo invalido.'));
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep('credentials');
    setChallengeId('');
    setAccessToken('');
    setCode('');
    setError('');
    onClose();
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={reset} className="fixed inset-0 bg-slate-950/60 backdrop-blur-md" />
          <m.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} transition={{ type: 'spring', duration: 0.5, bounce: 0.3 }} className="relative z-[101] w-full max-w-md">
            <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-yellow-500/20 rounded-full blur-[50px] pointer-events-none" />
              <button onClick={reset} className="absolute top-6 right-6 p-2 rounded-full text-slate-500 hover:text-white hover:bg-white/5 transition-all z-20"><X size={20} /></button>
              <div className="text-center mb-10 relative z-10">
                <div className="relative w-40 h-16 mx-auto mb-4 transition-transform duration-500 hover:scale-105">
                  <Image src="/Solara2.svg" alt="Logo Solara" fill className="object-contain" />
                </div>
                <h2 className="text-[18px] font-black text-white tracking-tight uppercase">Acesse sua conta</h2>
                <p className="text-slate-400 text-[10px] mt-2 font-bold tracking-[0.2em] uppercase opacity-60">Area Exclusiva</p>
              </div>

              {step === 'credentials' ? (
                <form className="space-y-5 relative z-10" onSubmit={startLogin}>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail corporativo</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-yellow-500 transition-colors" size={18} />
                      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@empresa.com.br" className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm outline-none focus:border-yellow-500/50 focus:bg-white/[0.05] transition-all placeholder:text-slate-600" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Senha</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-yellow-500 transition-colors" size={18} />
                      <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="********" className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-white text-sm outline-none focus:border-yellow-500/50 focus:bg-white/[0.05] transition-all placeholder:text-slate-600" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="space-y-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3">
                      <p className="text-sm text-rose-200">{error}</p>
                      <p className="break-all font-mono text-[10px] uppercase tracking-wider text-rose-300/80">
                        URL lida: {supabaseUrl || '(vazia)'}
                      </p>
                    </div>
                  )}

                  <button disabled={loading} className="group relative w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-3 overflow-hidden active:scale-[0.98] mt-6 shadow-xl shadow-yellow-500/10 disabled:opacity-60">
                    <span className="relative z-10 uppercase tracking-widest text-xs">
                      {loading ? 'Validando...' : 'Entrar no Sistema'}
                    </span>
                    <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                  </button>
                </form>
              ) : (
                <form className="space-y-5 relative z-10" onSubmit={verifyCode}>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300 flex items-start gap-3">
                    <Smartphone size={18} className="text-yellow-400 mt-0.5" />
                    <p>Enviamos um codigo SMS para o celular cadastrado. Informe o codigo para concluir o acesso.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Codigo SMS</label>
                    <input required value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" placeholder="000000" className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-4 text-white text-sm outline-none focus:border-yellow-500/50 focus:bg-white/[0.05] transition-all placeholder:text-slate-600 tracking-[0.4em] text-center" />
                  </div>

                  {error && (
                    <div className="space-y-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3">
                      <p className="text-sm text-rose-200">{error}</p>
                      <p className="break-all font-mono text-[10px] uppercase tracking-wider text-rose-300/80">
                        URL lida: {supabaseUrl || '(vazia)'}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button type="button" onClick={() => setStep('credentials')} className="flex-1 rounded-2xl border border-white/10 px-4 py-4 text-white font-semibold">Voltar</button>
                    <button disabled={loading} className="flex-1 rounded-2xl bg-yellow-500 px-4 py-4 text-black font-black uppercase tracking-widest text-xs disabled:opacity-60">
                      {loading ? 'Verificando...' : 'Confirmar'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}
