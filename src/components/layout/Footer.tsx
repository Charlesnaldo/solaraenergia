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

const socialLinks = [
  { Icon: Instagram, href: '#', label: 'Siga-nos no Instagram' },
  { Icon: Linkedin, href: '#', label: 'Conecte-se no Linkedin' },
  { Icon: Facebook, href: '#', label: 'Curta nossa página no Facebook' },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const scrollToTop = (e: React.MouseEvent) => {
    if (window.location.pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
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
          
          {/* COLUNA 1: LOGO E REDES */}
          <div className="space-y-6">
            <Link 
              href="/" 
              aria-label="Solara Energia - Voltar ao topo"
              className="inline-block"
              onClick={scrollToTop}
            >
              <Image 
                src="/Solara2.svg" 
                alt="Logo Solara Energia" 
                width={160} 
                height={48} 
                className="h-12 w-auto object-contain"
                priority
              />
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              Transformando o consumo de energia empresarial através de inteligência e sustentabilidade.
            </p>
            <div className="flex gap-4">
              {socialLinks.map(({ Icon, href, label }, i) => (
                <Link 
                  key={i} 
                  href={href} 
                  aria-label={label}
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-yellow-500 transition-all"
                >
                  <Icon size={18} />
                </Link>
              ))}
            </div>
          </div>

          {/* COLUNA 2: NAVEGAÇÃO */}
          <div>
            <h4 className="text-white font-bold uppercase text-[11px] tracking-[0.3em] mb-8 text-yellow-500">Navegação</h4>
            <ul className="space-y-4">
              {navLinks.map((link) => (
                <li key={link.label}>
                  <Link 
                    href={link.href} 
                    onClick={(e) => handleScroll(e, link.href)}
                    className="text-slate-400 text-sm hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* COLUNA 3: CONTATO */}
          <div>
            <h4 className="text-white font-bold uppercase text-[11px] tracking-[0.3em] mb-8 text-yellow-500">Contato</h4>
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-slate-400">
                <Phone size={16} className="text-yellow-500" />
                <span className="text-sm">(85) 99999-9999</span>
              </div>
              <div className="flex items-center gap-3 text-slate-400">
                <Mail size={16} className="text-yellow-500" />
                <span className="text-sm">comercial@solara.com.br</span>
              </div>
            </div>
          </div>

          {/* COLUNA 4: MATRIZ CEARÁ */}
          <div>
            <h4 className="text-white font-bold uppercase text-[11px] tracking-[0.3em] mb-8 text-yellow-500">Matriz</h4>
            <div className="flex gap-3">
              <MapPin size={16} className="text-yellow-500 shrink-0" />
              <p className="text-slate-400 text-sm leading-relaxed">
                Fortaleza, Ceará<br />Nordeste - Brasil
              </p>
            </div>
          </div>
        </div>

        {/* BARRA FINAL - CONTRASTE MELHORADO */}
        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              © {currentYear} SOLARA ENERGIA LTDA.
            </p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              CNPJ: 00.000.000/0001-00
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
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