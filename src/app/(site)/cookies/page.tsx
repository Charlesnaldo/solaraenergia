import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Cookie, Lock, ShieldCheck } from 'lucide-react';
import CookiePreferencesButton from '@/components/CookiePreferencesButton';

export const metadata: Metadata = {
  title: 'Política de Cookies | Solara Energia',
  description: 'Entenda como a Solara usa cookies e tecnologias similares em conformidade com a LGPD.',
};

const cookieGroups = [
  {
    title: 'Cookies essenciais',
    description:
      'Mantêm recursos básicos do site, como segurança, autenticação e preferências técnicas. Eles permanecem ativos porque são necessários para a operação do serviço.',
  },
  {
    title: 'Medição de uso',
    description:
      'Ajudam a entender navegação, páginas acessadas e desempenho do site para aprimorar a experiência digital da Solara.',
  },
  {
    title: 'Comunicação e marketing',
    description:
      'Podem ser usados para personalizar conteúdos, campanhas e comunicações sobre economia de energia e soluções solares.',
  },
];

export default function CookiesPage() {
  return (
    <main className="min-h-screen bg-[#020617] px-6 pb-20 pt-32 text-slate-300">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="mb-12 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 transition-colors hover:text-yellow-500"
        >
          <ArrowLeft size={14} />
          Voltar ao início
        </Link>

        <header className="mb-12">
          <p className="mb-4 text-xs font-black uppercase tracking-[0.28em] text-yellow-500">
            Privacidade e LGPD
          </p>
          <h1 className="text-4xl font-black uppercase tracking-tight text-white md:text-6xl">
            Política de Cookies
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-slate-400">
            Esta página explica como usamos cookies e tecnologias similares para operar o site, medir desempenho e,
            quando autorizado, personalizar comunicações. Você pode revisar suas preferências a qualquer momento.
          </p>
        </header>

        <section className="mb-8 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-yellow-500 text-slate-950">
                <Cookie size={22} />
              </div>
              <div>
                <h2 className="font-black uppercase tracking-tight text-white">Gerencie sua permissão</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  Reabra o painel de consentimento para aceitar, recusar ou alterar categorias opcionais.
                </p>
              </div>
            </div>
            <CookiePreferencesButton />
          </div>
        </section>

        <div className="grid gap-5">
          {cookieGroups.map((group, index) => (
            <section key={group.title} className="rounded-lg border border-white/10 bg-white/[0.03] p-6">
              <div className="mb-4 flex items-center gap-3">
                {index === 0 ? (
                  <Lock size={20} className="text-yellow-500" />
                ) : (
                  <ShieldCheck size={20} className="text-yellow-500" />
                )}
                <h2 className="text-lg font-black uppercase tracking-tight text-white">{group.title}</h2>
              </div>
              <p className="text-sm leading-relaxed text-slate-400">{group.description}</p>
            </section>
          ))}
        </div>

        <section className="mt-8 rounded-lg border border-white/10 bg-white/[0.03] p-6">
          <h2 className="mb-3 text-lg font-black uppercase tracking-tight text-white">Base de privacidade</h2>
          <p className="text-sm leading-relaxed text-slate-400">
            O consentimento para categorias opcionais é registrado no seu navegador. Para mais detalhes sobre coleta,
            uso, retenção e direitos dos titulares, consulte a{' '}
            <Link href="/privacidade" className="font-bold text-yellow-500 hover:text-yellow-400">
              Política de Privacidade
            </Link>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
