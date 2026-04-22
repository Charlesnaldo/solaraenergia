'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, LayoutDashboard, LogOut, Settings, Sun, Users } from 'lucide-react';
import '../../globals.css';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/clientes', label: 'Clientes', icon: Users },
  { href: '/admin/faturas', label: 'Boletos e Itaú', icon: FileText },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.08),_transparent_30%),linear-gradient(180deg,#020617_0%,#0f172a_100%)] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px]">
        <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-slate-950/70 px-5 py-6 backdrop-blur-xl md:flex md:flex-col">
          <div className="flex items-center gap-3 px-2">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-yellow-500 text-slate-950 shadow-[0_12px_30px_rgba(250,204,21,0.25)]">
              <Sun className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Solara</p>
              <h1 className="text-xl font-black tracking-tight">Admin</h1>
            </div>
          </div>

          <nav className="mt-10 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                    active
                      ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300'
                      : 'border-transparent text-slate-300 hover:border-white/10 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto space-y-2 pt-8">
            <Link href="/admin/settings" className="flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white">
              <Settings className="h-4 w-4" />
              Configurações
            </Link>
            <button className="flex w-full items-center gap-3 rounded-2xl border border-red-500/20 px-4 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/10 hover:text-red-200">
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/70 px-5 py-4 backdrop-blur-xl md:px-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Painel interno</p>
                <h2 className="mt-1 text-lg font-semibold text-white">Dashboard administrativo</h2>
              </div>
              <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-2">
                <div className="text-right">
                  <p className="text-xs text-slate-400">Olá, administrador</p>
                  <p className="text-sm font-semibold text-white">Acesso principal</p>
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-800 ring-1 ring-white/10">
                  <span className="text-sm font-bold text-yellow-300">A</span>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 p-5 md:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}