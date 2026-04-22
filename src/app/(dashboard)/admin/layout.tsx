'use client';

import Link from 'next/link';
import { LayoutDashboard, Users, FileText, Settings, LogOut, Sun } from 'lucide-react';
import "../../globals.css";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#020617]">
      {/* SIDEBAR */}
      <aside className="w-64 border-r border-white/10 bg-[#0a0f1e] hidden md:flex flex-col fixed h-full">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-yellow-500 rounded flex items-center justify-center">
            <Sun className="text-black w-5 h-5" />
          </div>
          <span className="text-white font-bold tracking-tight text-xl">Solara <span className="text-yellow-500 text-xs">Admin</span></span>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <Link href="/admin" className="flex items-center gap-3 px-4 py-3 text-yellow-500 bg-yellow-500/10 rounded-lg font-medium">
            <LayoutDashboard size={20} /> Dashboard
          </Link>
          <Link href="/admin/clientes" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <Users size={20} /> Clientes
          </Link>
          <Link href="/admin/faturas" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <FileText size={20} /> Boletos/Itaú
          </Link>
        </nav>

        <div className="p-4 border-t border-white/10">
          <Link href="/admin/settings" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white rounded-lg transition-colors mb-2">
            <Settings size={20} /> Configurações
          </Link>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
            <LogOut size={20} /> Sair
          </button>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="flex-1 md:ml-64 flex flex-col">
        {/* Top Header do Admin */}
        <header className="h-16 border-b border-white/10 flex items-center justify-end px-8 bg-[#020617]/50 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <span className="text-slate-400 text-sm">Olá, Administrador</span>
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10" />
          </div>
        </header>

        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
