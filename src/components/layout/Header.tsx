'use client';
import { useState, useEffect } from 'react';
import { Menu, X, MessageSquare, LogIn } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import Button from '@/components/Button';
import LoginModal from '@/components/LoginModal';
import { HEADER_MENU_ITEMS } from "@/constants";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header className={`fixed w-full z-50 transition-all duration-500 ${scrolled ? 'top-4 px-4 md:px-8' : 'top-0 px-0'}`}>
        <div className={`max-w-7xl mx-auto transition-all duration-500 ${scrolled
          ? 'bg-black/40 backdrop-blur-md border border-white/10 rounded-full py-3 px-8 shadow-2xl'
          : 'bg-transparent py-6 px-6'} flex items-center justify-between`}>

          {/* Logo - Mantida conforme solicitado */}
          <Link href="/" aria-label="Solara Energia" className="flex items-center gap-0 group shrink-0">
            <div className="relative w-32 h-12 md:w-40 md:h-14 transition-transform duration-300 group-hover:scale-105">
              <Image src="/Solara2.svg" alt="Logo Solara Energia" fill className="object-contain" priority />
            </div>
          </Link>

          {/* Desktop Menu - Ativa apenas em telas grandes (lg: 1024px+) */}
          <nav className="hidden lg:flex items-center">
            <div className="flex items-center gap-0"> {/* Gap zero para controle total via padding */}
              {HEADER_MENU_ITEMS.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="py-2 text-white/80 hover:text-yellow-400 hover:bg-white/5 rounded-full transition-all duration-300 whitespace-nowrap
                    /* Tipografia Fluida para não ficar pequena demais */
                    text-[clamp(16px,1.2vw,16px)] 
                    font-semibold min-[1200px]:font-normal 
                    px-2 min-[1150px]:px-3 min-[1250px]:px-5 
                    tracking-tight min-[1200px]:tracking-widest"
                >
                  {item.name}
                </Link>
              ))}
            </div>

            <Button className='mx-2 scale-90 min-[1250px]:scale-100'
              variant="neon"
              label="Fale Conosco"
              href="/#contato"
              icon={MessageSquare}
            />

            {/* LOGIN - Espaçamento otimizado para tablets deitados */}
            <div className="flex items-center border-l border-white/10 pl-3 min-[1200px]:pl-6 ml-1 min-[1200px]:ml-4 mr-2">
              <button
                onClick={() => setIsLoginOpen(true)}
                className="group flex items-center gap-2 text-white/70 hover:text-yellow-400 transition-all duration-300 tracking-widest text-sm font-medium cursor-pointer"
              >
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/5 group-hover:border-yellow-500/40 group-hover:bg-yellow-500/10 transition-all">
                  <LogIn size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
                <span className="hidden min-[1150px]:inline">Login</span>
              </button>
            </div>
          </nav>

          {/* Mobile Toggle - Aparece em Tablets (abaixo de 1024px) */}
          <button 
            className="lg:hidden p-2 text-white bg-white/5 rounded-full border border-white/10" 
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {isOpen && (
          <div className="absolute top-24 left-4 right-4 bg-slate-950/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 flex flex-col gap-6 text-white lg:hidden animate-in fade-in zoom-in-95 duration-300 shadow-2xl z-[60]">
            {HEADER_MENU_ITEMS.map((item) => (
              <Link key={item.name} href={item.href} className="text-lg tracking-widest border-b border-white/5 pb-2 transition-colors hover:text-yellow-500" onClick={() => setIsOpen(false)}>
                {item.name}
              </Link>
            ))}

            <button 
              onClick={() => { setIsOpen(false); setIsLoginOpen(true); }}
              className="flex items-center justify-center gap-3 py-4 text-yellow-500 font-bold tracking-widest border border-yellow-500/20 rounded-2xl bg-yellow-500/5"
            >
              <LogIn size={12} /> Acessar Login
            </button>

            <Button variant="neon" label="Fale Conosco" href="#contato" icon={MessageSquare} onClick={() => setIsOpen(false)} className="w-full justify-center" />
          </div>
        )}
      </header>

      <LoginModal 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)} 
      />
    </>
  );
}