import Link from 'next/link';

export default function Header() {
  return (
    <header className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
        <div className="text-2xl font-bold text-solara-dark">SOLARA</div>
        
        <nav className="hidden md:flex gap-8 text-solara-dark font-medium">
          <Link href="#inicio" className="hover:text-solara-green transition">Início</Link>
          <Link href="#usinas" className="hover:text-solara-green transition">Nossas Usinas</Link>
          <Link href="#sobre" className="hover:text-solara-green transition">Sobre Nós</Link>
          <Link href="#sobre" className="hover:text-solara-green transition">Energia por Assinatura</Link>
        </nav>

        <button className="bg-solara-yellow px-6 py-2 rounded-full font-bold text-solara-dark hover:scale-105 transition">
          Simular Economia
        </button>
      </div>
    </header>
  );
}