'use client';

import { useRouter } from 'next/navigation';
import { Bell, LogOut, Menu, Moon, Search, Sun, UserCircle2, Wifi } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useDashboardStore } from '@/stores/dashboard-store';

export function DashboardTopbar() {
  const router = useRouter();
  const { data } = useDashboardData();
  const globalSearch = useDashboardStore((state) => state.globalSearch);
  const setGlobalSearch = useDashboardStore((state) => state.setGlobalSearch);
  const setSidebarOpen = useDashboardStore((state) => state.setSidebarOpen);
  const theme = useDashboardStore((state) => state.theme);
  const toggleTheme = useDashboardStore((state) => state.toggleTheme);
  const role = useDashboardStore((state) => state.role);

  const itauOnline = data?.itauStatus.token === 'online' && data?.itauStatus.webhook === 'online';

  async function logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
    } catch {
      // The server logout is enough when Supabase env vars are not available locally.
    } finally {
      router.push('/');
      router.refresh();
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[color:var(--dash-border)] bg-[color:var(--dash-bg-soft)]/90 backdrop-blur-xl">
      <div className="flex min-h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setSidebarOpen(true)}
          aria-label="Abrir navegação"
        >
          <Menu size={18} />
        </Button>

        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--dash-muted)]" size={17} />
          <Input
            value={globalSearch}
            onChange={(event) => setGlobalSearch(event.target.value)}
            placeholder="Buscar clientes, faturas, Pix, logs..."
            className="pl-10"
          />
        </div>

        <Badge tone={itauOnline ? 'green' : 'yellow'} className="hidden gap-2 whitespace-nowrap md:inline-flex">
          <Wifi size={13} />
          Itaú API {itauOnline ? 'online' : 'atenção'}
        </Badge>

        <Button type="button" variant="ghost" size="icon" onClick={toggleTheme} aria-label="Alternar tema">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </Button>

        <Button type="button" variant="ghost" size="icon" aria-label="Notificações">
          <Bell size={18} />
        </Button>

        <Button type="button" variant="ghost" size="icon" onClick={() => void logout()} aria-label="Sair">
          <LogOut size={18} />
        </Button>

        <div className="hidden items-center gap-3 rounded-md border border-[color:var(--dash-border)] bg-[color:var(--dash-surface)] px-3 py-2 sm:flex">
          <UserCircle2 size={20} className="text-yellow-300" />
          <div className="leading-tight">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[color:var(--dash-muted)]">{role}</p>
            <p className="text-sm font-semibold text-[color:var(--dash-fg)]">Solara Ops</p>
          </div>
        </div>
      </div>
    </header>
  );
}
