'use client';
import { m } from 'framer-motion';
import { Scale, FileText, Ban, AlertTriangle, ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function TermosDeUso() {
  const dataAtual = new Date().toLocaleDateString('pt-BR');

  return (
    <main className="min-h-screen bg-[#020617] text-slate-300 pt-32 pb-20 relative overflow-hidden">
      
      {/* Background Decorativo */}
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-yellow-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[30%] h-[30%] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6 relative z-10">
        
        {/* Navegação */}
        <m.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-12"
        >
          <Link href="/" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-yellow-500 transition-colors">
            <ArrowLeft size={14} /> Voltar ao Painel
          </Link>
        </m.div>

        {/* Header Principal */}
        <header className="mb-16">
          <m.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black text-white mb-6 uppercase tracking-tighter italic"
          >
            Termos de <span className="text-yellow-500 text-transparent bg-clip-text bg-gradient-to-r from-yellow-100 via-yellow-400 to-yellow-600">Uso</span>
          </m.h1>
          <div className="flex items-center gap-4">
            <span className="h-px w-12 bg-yellow-500/50" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">
              Vigente em: {dataAtual}
            </p>
          </div>
        </header>

        <div className="space-y-8">
          
          {/* Sessão 01 - Aceitação */}
          <m.section 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white/[0.02] border border-white/5 p-8 rounded-[2rem] hover:bg-white/[0.04] transition-colors"
          >
            <div className="flex items-center gap-4 mb-4">
              <Scale className="text-yellow-500" size={24} />
              <h2 className="text-xl font-black text-white uppercase tracking-tight">1. Aceitação do Usuário</h2>
            </div>
            <p className="leading-relaxed text-sm md:text-base">
              Ao utilizar os serviços e acessar o site da <strong>Solara</strong>, você declara estar ciente e de acordo com as regras aqui estabelecidas. Estes termos regem o uso do nosso simulador, área de login e conteúdos informativos sobre energia fotovoltaica.
            </p>
          </m.section>

          {/* Grid de Regras */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <m.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bg-white/[0.02] border border-white/5 p-8 rounded-[2rem]"
            >
              <div className="flex items-center gap-3 mb-4">
                <FileText className="text-yellow-500" size={20} />
                <h3 className="font-black text-white uppercase tracking-tighter text-lg">2. Uso de Licença</h3>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                O acesso ao site concede a você uma licença temporária, pessoal e não comercial para visualizar os materiais e utilizar nosso simulador de economia. É proibido modificar, copiar ou utilizar os dados para engenharia reversa.
              </p>
            </m.div>

            <m.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white/[0.02] border border-white/5 p-8 rounded-[2rem]"
            >
              <div className="flex items-center gap-3 mb-4">
                <Ban className="text-red-500" size={20} />
                <h3 className="font-black text-white uppercase tracking-tighter text-lg">3. Restrições</h3>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                É estritamente proibido o uso de robôs ou scripts para extrair dados de nossas usinas ou preços. O uso indevido da marca Solara resultará em suspensão imediata de acesso e medidas legais cabíveis.
              </p>
            </m.div>
          </div>

          {/* Sessão 04 - Isenção */}
          <m.section 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-yellow-500/5 border border-yellow-500/20 p-8 rounded-[2rem]"
          >
            <div className="flex items-center gap-4 mb-4">
              <AlertTriangle className="text-yellow-500" size={24} />
              <h2 className="text-xl font-black text-white uppercase tracking-tight">4. Isenção de Responsabilidade</h2>
            </div>
            <p className="text-sm leading-relaxed mb-4">
              Os resultados gerados no <strong>Simulador Solara</strong> são estimativas baseadas em médias de mercado e radiação solar local. A economia real pode variar de acordo com o padrão de consumo, condições climáticas e especificações técnicas de cada projeto.
            </p>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-yellow-500/60">
              <ExternalLink size={12} />
              Consulte sempre um técnico Solara para dados precisos.
            </div>
          </m.section>

          {/* Footer Legal do Documento */}
          <footer className="pt-12 text-center space-y-4">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-600">
              Solara Energia &copy; 2026 - Todos os Direitos Reservados
            </p>
            <div className="flex justify-center gap-6">
               <Link href="/privacidade" className="text-[10px] uppercase font-bold text-slate-500 hover:text-white transition-colors">Política de Privacidade</Link>
               
               
            </div>
          </footer>

        </div>
      </div>
    </main>
  );
}