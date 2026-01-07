'use client';
import { useState } from 'react';
import { Menu, X, Sun, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed w-full z-50 transition-all duration-300 bg-transparent hover:bg-black/20 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          {/* Logo da Solara */}
          <div className="relative w-35 h-22 md:w-46 md:h-22">
            <Image
              src="/Solara.svg" // Caminho direto para a pasta public
              alt="Logo Solara"
              fill
              className="object-contain"
            />
          </div>

         </Link>
        {/* Desktop Menu */}
        <nav className="hidden md:flex items-center gap-8 text-white font-semibold">
          <Link href="#inicio" className="hover:text-yellow-400 transition">Início</Link>
          <Link href="#usinas" className="hover:text-yellow-400 transition">Usinas</Link>
          <Link href="#sobre" className="hover:text-yellow-400 transition">Sobre</Link>

          {/* Botão Fale Conosco Desktop */}
          <Link
            href="#contato"
            className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-2.5 rounded-full flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95 shadow-lg"
          >
            <MessageSquare size={18} />
            Fale Conosco
          </Link>
        </nav>

        {/* Mobile Toggle */}
        <button className="md:hidden text-white" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={32} /> : <Menu size={25} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="absolute top-20 left-0 w-full bg-slate-900/95 backdrop-blur-xl border-t border-white/10 flex flex-col p-8 gap-6 text-white md:hidden animate-in fade-in slide-in-from-top-4">
          <Link href="#inicio" className="text-xl" onClick={() => setIsOpen(false)}>Início</Link>
          <Link href="#usinas" className="text-xl" onClick={() => setIsOpen(false)}>Usinas</Link>
          <Link href="#sobre" className="text-xl" onClick={() => setIsOpen(false)}>Sobre</Link>

          {/* Botão Fale Conosco Mobile */}
          <Link
            href="#contato"
            onClick={() => setIsOpen(false)}
            className="bg-yellow-500 text-black p-4 rounded-2xl font-bold flex items-center justify-center gap-3"
          >
            <MessageSquare size={20} />
            Fale Conosco
          </Link>
        </div>
      )}
    </header>
  );
}