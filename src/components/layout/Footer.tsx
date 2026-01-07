'use client';
import Link from 'next/link';
import { Sun, Instagram, Linkedin, Facebook, Mail, MapPin, Phone, ArrowRight } from 'lucide-react';
import Image from 'next/image';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 text-slate-300 pt-20 pb-10 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Grid Principal */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Coluna 1: Sobre */}
         <div className="space-y-6">

  <Link href="/" className="inline-block group">
    {/* Substituído: sai o <span> entra a div com a Image */}
    <div className="relative w-39 h-30 md:w-30 md:h-10">
      <Image 
        src="/Solara.svg" // Nome do arquivo atualizado para Solara.svg conforme seu código
        alt="Logo Solara"
        fill
        className="object-contain brightness-0 invert transition-all group-hover:brightness-100 group-hover:invert-0" 
      />
    </div>
  </Link>
            <p className="text-slate-400 leading-relaxed">
              Liderando a transição energética com tecnologia de ponta e economia real para sua empresa ou residência.
            </p>
            <div className="flex gap-4">
              <Link href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-yellow-500 hover:text-black transition-all">
                <Instagram size={20} />
              </Link>
              <Link href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-yellow-500 hover:text-black transition-all">
                <Linkedin size={20} />
              </Link>
              <Link href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-yellow-500 hover:text-black transition-all">
                <Facebook size={20} />
              </Link>
            </div>
          </div>

          {/* Coluna 2: Navegação */}
          <div>
            <h4 className="text-white font-bold text-lg mb-6">Navegação</h4>
            <ul className="space-y-4">
              {['Início', 'Nossas Usinas', 'Sobre Nós', 'Simulador de Economia', 'Blog'].map((item) => (
                <li key={item}>
                  <Link href="#" className="hover:text-yellow-500 flex items-center gap-2 group transition-colors">
                    <ArrowRight size={14} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Coluna 3: Contato */}
          <div>
            <h4 className="text-white font-bold text-lg mb-6">Contato</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="text-yellow-500 shrink-0" size={20} />
                <span>Rua das Palmeiras, 984 - Parque Santa Rosa, Fortaleza - CE</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="text-yellow-500 shrink-0" size={20} />
                <span>(85) 99999-9999</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="text-yellow-500 shrink-0" size={20} />
                <span>contato@solaraenergia.com.br</span>
              </li>
            </ul>
          </div>

          {/* Coluna 4: Newsletter */}
          <div>
            <h4 className="text-white font-bold text-lg mb-6">Novidades</h4>
            <p className="text-slate-400 mb-4">Receba conteúdos sobre energia solar e economia.</p>
            <form className="space-y-3">
              <input 
                type="email" 
                placeholder="Seu melhor e-mail" 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-500 transition-colors"
              />
              <button className="w-full bg-yellow-500 text-black font-bold py-3 rounded-xl hover:bg-yellow-400 transition-all active:scale-95">
                Inscrever-se
              </button>
            </form>
          </div>
        </div>

        {/* Rodapé Inferior */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:row justify-between items-center gap-6 text-sm text-slate-500">
          <p>© {currentYear} Solara Energia - Todos os direitos reservados.</p>
          <div className="flex gap-8">
            <Link href="#" className="hover:text-white">Termos de Uso</Link>
            <Link href="#" className="hover:text-white">Privacidade</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}