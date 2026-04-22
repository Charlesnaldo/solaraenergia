'use client';

import { useState } from 'react';

interface PortalResponse {
  cliente?: { nome: string; cpf_cnpj: string };
  assinatura?: { valor_mensal: number; dia_vencimento: number } | null;
  historicoConsumo?: Array<{ id: string; referencia: string; consumo_kwh: number }>;
  boletos?: Array<{ id: string; data_vencimento: string; valor: number; status: string; boleto_url: string | null }>;
  error?: string;
}

function money(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export default function ClientePortalPage() {
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PortalResponse | null>(null);

  const consultar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const res = await fetch('/api/cliente/consulta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cpfCnpj, token }),
    });

    const payload = (await res.json()) as PortalResponse;
    setResult(payload);
    setLoading(false);
  };

  return (
    <main className="mx-auto max-w-4xl px-4 pt-32 pb-12 text-white md:pt-36">
      <h1 className="text-3xl font-bold">Área do Cliente</h1>
      <p className="mt-2 text-slate-300">Acesse seus boletos e histórico de consumo com CPF/CNPJ + token enviado por e-mail.</p>

      <form onSubmit={consultar} className="mt-6 grid gap-3 rounded-2xl border border-white/10 bg-slate-900/50 p-4 md:grid-cols-3">
        <input required placeholder="CPF/CNPJ" value={cpfCnpj} onChange={(e) => setCpfCnpj(e.target.value)} className="rounded-lg border border-white/15 bg-slate-950 px-3 py-2" />
        <input required placeholder="Token" value={token} onChange={(e) => setToken(e.target.value)} className="rounded-lg border border-white/15 bg-slate-950 px-3 py-2" />
        <button disabled={loading} className="rounded-lg bg-yellow-500 px-4 py-2 font-semibold text-slate-950 disabled:opacity-60">{loading ? 'Consultando...' : 'Consultar'}</button>
      </form>

      {result?.error ? <p className="mt-4 text-rose-300">{result.error}</p> : null}

      {result?.cliente && !result.error ? (
        <section className="mt-8 space-y-6">
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
            <h2 className="text-xl font-semibold">{result.cliente.nome}</h2>
            <p className="text-sm text-slate-300">Documento: {result.cliente.cpf_cnpj}</p>
            {result.assinatura ? (
              <p className="mt-2 text-sm text-slate-300">
                Assinatura: {money(result.assinatura.valor_mensal)} | Vencimento dia {result.assinatura.dia_vencimento}
              </p>
            ) : null}
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
            <h3 className="mb-3 text-lg font-semibold">Boletos</h3>
            <div className="space-y-2 text-sm">
              {result.boletos?.map((boleto) => (
                <div key={boleto.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 p-3">
                  <span>
                    {boleto.data_vencimento} | {money(boleto.valor)} | {boleto.status}
                  </span>
                  {boleto.boleto_url ? (
                    <a href={boleto.boleto_url} target="_blank" rel="noreferrer" className="text-yellow-400 underline">
                      Baixar boleto
                    </a>
                  ) : (
                    <span className="text-slate-400">Sem URL</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
            <h3 className="mb-3 text-lg font-semibold">Histórico de Consumo (kWh)</h3>
            <div className="space-y-2 text-sm">
              {result.historicoConsumo?.map((item) => (
                <div key={item.id} className="rounded-lg border border-white/10 p-3">
                  {item.referencia}: {item.consumo_kwh} kWh
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
