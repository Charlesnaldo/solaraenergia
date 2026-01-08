'use client';
import { useState, useEffect } from 'react';
import { Menu, X, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import Button from '@/components/Button';

// 1. Mapeamento de IDs para evitar problemas com caracteres especiais
const menuItems = [
  { name: 'Início', href: '/#inicio' },
  { name: 'Nossas Usinas', href: '/#usinas' },
  { name: 'Sobre Nós', href: '/sobre' },
  { name: 'Simulador de Economia', href: '/simulador-economia' },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed w-full z-50 transition-all duration-500 ${scrolled
          ? 'top-4 px-4 md:px-8'
          : 'top-0 px-0'
        }`}
    >
      <div
        className={`max-w-7xl mx-auto transition-all duration-500 ${scrolled
            ? 'bg-black/40 backdrop-blur-md border border-white/10 rounded-full py-3 px-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]'
            : 'bg-transparent py-6 px-6'
          } flex items-center justify-between`}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <div className="relative w-32 h-12 md:w-40 md:h-14 transition-transform duration-300 group-hover:scale-105">
            <Image
              src="/Solara.svg"
              alt="Logo Solara"
              fill
              className="object-contain"
              priority
            />
          </div>
        </Link>

        {/* Desktop Menu */}
        <nav className="hidden md:flex items-center gap-2">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="px-5 py-2 text-sm text-white/80 hover:text-yellow-400 hover:bg-white/5 rounded-full transition-all duration-300 uppercase tracking-widest"
            >
              {item.name}
            </Link>
          ))}

          <div className="w-[1px] h-6 bg-white/10 mx-4" />

          <Button 
            variant="neon"
            label="Fale Conosco"
            href="/#contato"
            icon={MessageSquare}
            className="ml-4"
          />
        </nav>

        {/* Mobile Toggle */}
        <button
          className="md:hidden p-2 text-white bg-white/5 rounded-full border border-white/10 transition-colors hover:bg-white/10"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="absolute top-24 left-4 right-4 bg-slate-950/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 flex flex-col gap-6 text-white md:hidden animate-in fade-in zoom-in-95 duration-300 shadow-2xl z-[60]">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-lg tracking-widest border-b border-white/5 pb-2 transition-colors hover:text-yellow-500"
              onClick={() => setIsOpen(false)} // Fecha o menu ao clicar
            >
              {item.name}
            </Link>
          ))}

          <Button 
            variant="neon"
            label="Fale Conosco"
            href="#contato"
            icon={MessageSquare}
            onClick={() => setIsOpen(false)}
            className="w-full justify-center"
          />
        </div>
      )}
    </header>
  );
}