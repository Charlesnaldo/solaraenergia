'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  BarChart3,
  Bolt,
  CreditCard,
  FileText,
  Gauge,
  Layers3,
  PlugZap,
  ReceiptText,
  Settings,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDashboardStore } from '@/stores/dashboard-store';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: Gauge },
  { label: 'Clientes', href: '/dashboard/clientes', icon: Users },
  { label: 'Faturamentos', href: '/dashboard/faturamentos', icon: ReceiptText },
  { label: 'Cobranças', href: '/dashboard/cobrancas', icon: FileText },
  { label: 'Pagamentos', href: '/dashboard/pagamentos', icon: CreditCard },
  { label: 'Energia', href: '/dashboard/energia', icon: Bolt },
  { label: 'Relatórios', href: '/dashboard/relatorios', icon: BarChart3 },
  { label: 'Integrações', href: '/dashboard/integracoes', icon: PlugZap },
  { label: 'Usuários', href: '/dashboard/usuarios', icon: ShieldCheck },
  { label: 'Logs', href: '/dashboard/logs', icon: Activity },
  { label: 'Configurações', href: '/dashboard/configuracoes', icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const sidebarOpen = useDashboardStore((state) => state.sidebarOpen);
  const setSidebarOpen = useDashboardStore((state) => state.setSidebarOpen);

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden',
          sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-[#050814]/95 px-4 py-5 shadow-2xl shadow-black/40 backdrop-blur-xl transition-transform lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="mb-7 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <Image src="/Solara2.svg" alt="Solara Energia" width={138} height={40} className="h-10 w-auto" priority />
          </Link>
          <button
            type="button"
            className="rounded-md p-2 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Fechar navegação"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mb-5 rounded-lg border border-yellow-400/20 bg-yellow-400/10 p-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-yellow-200">
            <Layers3 size={14} />
            Solara Cloud
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            Operação financeira, energética e cobrança em tempo real.
          </p>
        </div>

        <nav className="space-y-1 overflow-y-auto pr-1">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex h-10 items-center gap-3 rounded-md px-3 text-sm font-semibold transition-colors',
                  active
                    ? 'bg-white text-slate-950 shadow-[0_0_32px_rgba(255,255,255,0.16)]'
                    : 'text-slate-400 hover:bg-white/8 hover:text-white',
                )}
              >
                <Icon size={17} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">RBAC ativo</p>
          <p className="mt-2 text-sm font-semibold text-white">Admin / Operator / Client</p>
          <p className="mt-1 text-xs text-slate-500">Rotas isoladas com auditoria e policies Supabase.</p>
        </div>
      </aside>
    </>
  );
}
