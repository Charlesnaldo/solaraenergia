'use client';
import { m } from 'framer-motion';
import Image from 'next/image';
import { Lightbulb, Award, TrendingUp, MapPin } from 'lucide-react';

const storyMilestones = [
  {
    year: "2019",
    title: "O Problema de um Amigo",
    description: "Tudo começou quando Alan Douglas decidiu ajudar um amigo empresário que pagava muito caro na conta de energia. Ao resolver esse desafio, Alan enxergou o poder da energia solar para transformar negócios e decidiu que essa seria sua nova missão.",
    icon: <Lightbulb size={24} className="text-yellow-500" />,
    image: "/usinas/croata.webp" 
  },
  {
    year: "2021",
    title: "A Grande Decisão",
    description: "Acreditando totalmente no projeto, Alan abriu mão de outro negócio consolidado para investir tudo o que tinha em suas próprias usinas. Foi o nascimento da primeira unidade, fruto de coragem e investimento próprio.",
    icon: <Award size={24} className="text-yellow-500" />,
    image: "/usinas/croata.webp" 
  },
  {
    year: "2023",
    title: "Expansão e Foco",
    description: "O modelo de negócio se provou eficiente. Com foco total na operação e na economia dos clientes, a Solara começou a escalar, consolidando-se como uma referência em inteligência energética no estado.",
    icon: <TrendingUp size={24} className="text-yellow-500" />,
    image: "/usinas/beberibe.webp" 
  },
  {
    year: "2025",
    title: "Três Usinas Próprias",
    description: "Hoje, a Solara celebra a marca de 3 usinas em plena operação e mais duas em pleno desenvolvimento. O que começou com uma ajuda a um amigo tornou-se uma estrutura robusta que gera economia real e sustentabilidade para dezenas de empresas.",
    icon: <MapPin size={24} className="text-yellow-500" />,
    image: "/usinas/croata2.webp" 
  }
];

export default function AboutUs() {
  return (
    <section className="py-24 bg-[#020617] text-white relative overflow-hidden">
      
      
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
  {/* Sol 01 - Explosão de Luz no Topo Direita */}
  <m.div 
    animate={{ 
      scale: [1, 1.1, 1],
      opacity: [0.3, 0.5, 0.3] 
    }}
    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
    className="absolute -top-40 -right-20 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(255,174,51,0.15)_0%,transparent_70%)] rounded-full blur-[80px]"
  />

  {/* Sol 02 - Brilho Lateral Quente (Tom da Logo) */}
  <m.div 
    animate={{ 
      y: [0, 30, 0],
      opacity: [0.2, 0.4, 0.2] 
    }}
    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
    className="absolute top-[20%] -left-40 w-[500px] h-[500px] bg-yellow-500/10 rounded-full blur-[110px]"
  />

  {/* Sol 03 - Núcleo de luz atrás da linha do tempo */}
  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-yellow-600/[0.07] rounded-full blur-[130px]" />

  {/* Sol 04 - Brilho de rodapé */}
  <m.div 
    animate={{ 
      scale: [1, 1.3, 1],
    }}
    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
    className="absolute -bottom-48 left-1/4 w-[700px] h-[700px] bg-[radial-gradient(circle,rgba(255,184,0,0.1)_0%,transparent_60%)] rounded-full blur-[100px]"
  />
</div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Cabeçalho */}
        <div className="text-center mb-20">
          <m.span 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[10px] font-black uppercase tracking-[0.6em] text-yellow-500 mb-4 block"
          >
            Nossa Jornada
          </m.span>
          <m.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-black text-white leading-tight uppercase tracking-tighter"
          >
            A história por trás da <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600">
              Solara energia.
            </span>
          </m.h2>
        </div>

        {/* Linha do Tempo */}
        <div className="relative">
          {/* Linha Vertical Central Estilizada */}
          <div className="absolute left-1/2 -translate-x-1/2 h-full w-px bg-gradient-to-b from-transparent via-white/10 to-transparent hidden lg:block" />

          {storyMilestones.map((milestone, index) => (
            <m.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.8 }}
              className={`relative flex flex-col lg:flex-row items-center lg:items-start gap-12 py-12 ${
                index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
              }`}
            >
              {/* Círculo do Ano Central (Desktop) */}
              <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-slate-900 border border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)] flex items-center justify-center z-10">
                <span className="text-white font-bold text-sm">{milestone.year}</span>
              </div>

              {/* Conteúdo do Texto */}
              <div className={`w-full lg:w-5/12 text-center lg:text-left ${
                index % 2 === 0 ? 'lg:pr-24' : 'lg:pl-24'
              }`}>
                <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                  {milestone.icon}
                  <h3 className="text-2xl font-bold text-white uppercase tracking-tighter">
                    {milestone.title}
                  </h3>
                </div>
                <p className="text-slate-400 leading-relaxed text-sm">
                  {milestone.description}
                </p>
              </div>

              {/* Imagem do Marco */}
              <div className="w-full lg:w-5/12 relative h-64 rounded-2xl overflow-hidden shadow-2xl border border-white/5 bg-slate-900 group">
                <Image 
                  src={milestone.image} 
                  alt={milestone.title} 
                  fill 
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                {/* Overlay na imagem */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#020617]/60 to-transparent" />
              </div>

              {/* Ano Mobile (Atrás do texto) */}
              <span className="lg:hidden absolute top-0 text-white/5 text-8xl font-black -z-10">
                {milestone.year}
              </span>

            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}