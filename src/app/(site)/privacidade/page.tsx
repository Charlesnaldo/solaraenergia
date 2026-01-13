'use client';
import { m } from 'framer-motion';
import { ShieldCheck, Lock, Eye, FileText, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function Privacidade() {
  const dataAtual = new Date().toLocaleDateString('pt-BR');

  return (
    <main className="min-h-screen bg-[#020617] text-slate-300 pt-32 pb-20 relative overflow-hidden">
      
      {/* Elementos Visuais de Fundo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-yellow-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-4xl mx-auto px-6 relative z-10">
        
        {/* Link Voltar */}
        <m.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-12"
        >
          <Link href="/" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-yellow-500 transition-colors">
            <ArrowLeft size={14} /> Voltar ao Início
          </Link>
        </m.div>

        {/* Cabeçalho */}
        <header className="mb-16">
          <m.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black text-white mb-6 uppercase tracking-tighter italic"
          >
            Segurança & <span className="text-yellow-500 text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-600">Privacidade</span>
          </m.h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
            Última atualização: {dataAtual}
          </p>
        </header>

        {/* Conteúdo em Cards */}
        <div className="space-y-6">
          
          <m.section 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white/[0.02] border border-white/5 p-8 rounded-[2rem] backdrop-blur-sm"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                <ShieldCheck size={20} />
              </div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">Compromisso Solara</h2>
            </div>
            <p className="leading-relaxed">
              A sua privacidade é prioridade absoluta. Na <strong>Solara</strong>, tratamos seus dados com a mesma seriedade com que tratamos a eficiência energética de nossas usinas. Esta política detalha como coletamos, usamos e protegemos suas informações de acordo com as melhores práticas globais.
            </p>
          </m.section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <m.section 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white/[0.02] border border-white/5 p-8 rounded-[2rem]"
            >
              <div className="flex items-center gap-4 mb-6">
                <Lock className="text-yellow-500" size={20} />
                <h2 className="text-lg font-black text-white uppercase tracking-tight">1. Coleta e LGPD</h2>
              </div>
              <p className="text-sm leading-relaxed text-slate-400">
                Solicitamos informações pessoais como nome, e-mail e telefone apenas quando necessário para orçamentos. Tudo é feito em total conformidade com a <strong>Lei Geral de Proteção de Dados (Lei nº 13.709/2018)</strong>.
              </p>
            </m.section>

            <m.section 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white/[0.02] border border-white/5 p-8 rounded-[2rem]"
            >
              <div className="flex items-center gap-4 mb-6">
                <Eye className="text-yellow-500" size={20} />
                <h2 className="text-lg font-black text-white uppercase tracking-tight">2. Uso de Dados</h2>
              </div>
              <ul className="text-sm space-y-3 text-slate-400">
                <li className="flex items-start gap-2">• Elaborar estudos de viabilidade solar.</li>
                <li className="flex items-start gap-2">• Gestão de contratos e instalações.</li>
                <li className="flex items-start gap-2">• Suporte técnico e pós-venda exclusivo.</li>
              </ul>
            </m.section>
          </div>

          <m.section 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white/[0.02] border border-white/5 p-8 rounded-[2rem]"
          >
            <div className="flex items-center gap-4 mb-6">
              <FileText className="text-yellow-500" size={20} />
              <h2 className="text-xl font-black text-white uppercase tracking-tight">3. Retenção e Segurança</h2>
            </div>
            <p className="leading-relaxed mb-4">
              Mantemos seus dados apenas pelo período necessário para a prestação dos serviços contratados. Utilizamos criptografia e servidores seguros para evitar qualquer acesso não autorizado, perda ou roubo de informações.
            </p>
            <p className="text-sm text-slate-500">
              Você tem o direito de solicitar a exclusão ou correção de seus dados a qualquer momento.
            </p>
          </m.section>

          {/* Banner de Contato */}
          <m.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-10 rounded-[2.5rem] text-black text-center"
          >
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-4">Dúvidas sobre seus dados?</h2>
            <p className="font-medium mb-6 opacity-80">Nosso Encarregado de Dados (DPO) está pronto para atender você.</p>
            <a 
              href="mailto:privacidade@solara.com.br" 
              className="inline-block bg-black text-white px-8 py-4 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-slate-900 transition-all"
            >
              privacidade@solara.com.br
            </a>
          </m.div>

        </div>

        {/* Footer legal */}
        <footer className="mt-20 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600">
            Solara Tecnologia Fotovoltaica LTDA &copy; 2026
          </p>
        </footer>

      </div>
    </main>
  );
}