'use client';

import { useState } from 'react';

interface TestResponse {
  status?: string;
  mensagem_itau?: string | null;
  erro?: string;
  payload_sanitizado?: unknown;
}

export default function AdminTestesPage() {
  const [clienteId, setClienteId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestResponse | null>(null);

  const testarBolecode = async () => {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/admin/itau/teste-bolecode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clienteId: clienteId.trim() || undefined }),
      });
      const payload = (await res.json()) as TestResponse;

      setResult({
        ...payload,
        status: res.ok ? payload.status : payload.status ?? 'erro',
      });
    } catch (error) {
      setResult({
        status: 'erro',
        erro: error instanceof Error ? error.message : 'Falha ao testar BoleCode.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.25)] sm:p-6 md:rounded-[2rem]">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-yellow-300/80">Admin &gt; Testes</p>
        <h1 className="mt-2 text-2xl font-black text-white sm:text-3xl">Testar BoleCode Simulacao</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          Executa uma chamada real ao Itau em modo Simulacao, com valor fixo de R$ 1,00, sem salvar faturamento real.
        </p>
      </section>

      <section className="rounded-[1.5rem] border border-white/10 bg-slate-950/60 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.2)] sm:p-5 md:rounded-[1.75rem]">
        <div className="grid gap-4 md:max-w-2xl">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-200">Cliente ID opcional</span>
            <input
              value={clienteId}
              onChange={(event) => setClienteId(event.target.value)}
              placeholder="Deixe vazio para usar um cliente ativo do banco"
              className="w-full rounded-xl border border-white/15 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-yellow-500"
            />
          </label>

          <button
            onClick={() => void testarBolecode()}
            disabled={loading}
            className="w-full rounded-2xl bg-yellow-500 px-5 py-3 text-sm font-black uppercase tracking-widest text-slate-950 transition hover:bg-yellow-400 disabled:opacity-60 sm:w-fit"
          >
            {loading ? 'Testando...' : 'Testar BoleCode Simulacao'}
          </button>
        </div>
      </section>

      {result && (
        <section className="rounded-[1.5rem] border border-white/10 bg-slate-950/60 p-4 sm:p-5 md:rounded-[1.75rem]">
          <div className="mb-3 flex items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${result.status === 'ok' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300'}`}>
              {result.status ?? 'erro'}
            </span>
            <p className="text-sm text-slate-300">{result.mensagem_itau ?? result.erro ?? 'Resultado do teste'}</p>
          </div>

          <pre className="max-h-[520px] overflow-auto rounded-2xl border border-white/10 bg-black/30 p-4 text-xs text-slate-200">
            {JSON.stringify(result, null, 2)}
          </pre>
        </section>
      )}
    </div>
  );
}
