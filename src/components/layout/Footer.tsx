'use client';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Facebook, Instagram, Linkedin, Mail, MapPin, Phone } from 'lucide-react';

const navLinks = [
  { label: 'Home', href: '#home' },
  { label: 'Como Funciona', href: '#faq' },
  { label: 'Benefícios', href: '#beneficios' },
  { label: 'Usinas', href: '#usinas' },
  { label: 'Contato', href: '#contato' },
];

const legalLinks = [
  { label: 'Termos de Uso', href: '/termos-de-uso' },
  { label: 'Políticas de Privacidade', href: '/privacidade' },
  { label: 'Cookies', href: '/cookies' },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  // Função centralizada para scroll ao topo
  const scrollToTop = (e: React.MouseEvent) => {
    if (window.location.pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Função para scroll suave nos links de âncora
  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    // Se o link for "Home" ou o ID for #home, usamos o scrollToTop
    if (href === '#home' || href === '/') {
      scrollToTop(e);
      return;
    }

    if (href.startsWith('#')) {
      e.preventDefault();
      const targetId = href.replace('#', '');
      const elem = document.getElementById(targetId);
      if (elem) {
        elem.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <footer className="relative bg-[#000814] pt-24 pb-12 overflow-hidden border-t border-white/5">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
          
          {/* COLUNA 1: LOGO */}
          <div className="space-y-6">
            <Link 
              href="/" 
              className="inline-block"
              onClick={scrollToTop} // Agora a logo usa a função centralizada
            >
              <Image 
                src="/Solara2.svg" 
                alt="Solara Energia" 
                width={160} 
                height={48} 
                className="h-12 w-auto object-contain"
                priority
              />
            </Link>
            <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
              Transformando o consumo de energia empresarial através de inteligência e sustentabilidade.
            </p>
            <div className="flex gap-4">
              {[Instagram, Linkedin, Facebook].map((Icon, i) => (
                <Link key={i} href="#" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-yellow-500 transition-all">
                  <Icon size={18} />
                </Link>
              ))}
            </div>
          </div>

          {/* COLUNA 2: NAVEGAÇÃO - CORRIGIDA */}
          <div>
            <h4 className="text-white font-bold uppercase text-[11px] tracking-[0.3em] mb-8 text-yellow-500/80">Navegação</h4>
            <ul className="space-y-4">
              {navLinks.map((link) => (
                <li key={link.label}>
                  <Link 
                    href={link.href} 
                    onClick={(e) => handleScroll(e, link.href)} // handleScroll agora trata o #home
                    className="text-slate-500 text-sm hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* COLUNA 3: CONTATO */}
          <div>
            <h4 className="text-white font-bold uppercase text-[11px] tracking-[0.3em] mb-8 text-yellow-500/80">Contato</h4>
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-yellow-500" />
                <span className="text-slate-400 text-sm">(11) 99999-9999</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-yellow-500" />
                <span className="text-slate-400 text-sm">comercial@solara.com.br</span>
              </div>
            </div>
          </div>

          {/* COLUNA 4: MATRIZ */}
          <div>
            <h4 className="text-white font-bold uppercase text-[11px] tracking-[0.3em] mb-8 text-yellow-500/80">Matriz</h4>
            <div className="flex gap-3">
              <MapPin size={16} className="text-yellow-500 shrink-0" />
              <p className="text-slate-500 text-sm leading-relaxed">
                Av. Paulista, 1000<br />Bela Vista - São Paulo / SP
              </p>
            </div>
          </div>
        </div>

        {/* BARRA FINAL */}
        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
              © {currentYear} SOLARA ENERGIA LTDA.
            </p>
            <p className="text-[9px] font-bold text-slate-700 uppercase tracking-widest">
              CNPJ: 00.000.000/0001-00
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-8 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
            {legalLinks.map((link) => (
              <Link key={link.label} href={link.href} className="hover:text-yellow-500 transition-colors">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}