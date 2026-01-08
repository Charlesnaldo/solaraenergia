'use client';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Lightbulb, Award, TrendingUp, MapPin } from 'lucide-react';

// Dados da história para facilitar a leitura e organização
const storyMilestones = [
  {
    year: "2021",
    title: "O Sonho de uma Energia Melhor",
    description: "Criado nas terras áridas do Ceará, Alan Douglas, um jovem com poucas posses, mas uma visão grandiosa, observava o sol inclemente não como um problema, mas como a maior solução. Seu primeiro 'escritório' foi a varanda de casa, e seu capital inicial, a força de sua própria crença.",
    icon: <Lightbulb size={24} className="text-yellow-500" />,
    image: "/usinas/croata.webp" // Substitua pela imagem de um jovem empreendedor sonhador
  },
  {
    year: "2015",
    title: "Primeiros Painéis, Primeiras Vitórias",
    description: "Com muita pesquisa e o apoio da família, João instalou seus primeiros painéis em pequenos comércios locais. Cada instalação era uma prova de conceito, uma semente plantada. A economia na conta de luz dos vizinhos e amigos era a maior propaganda.",
    icon: <Award size={24} className="text-yellow-500" />,
    image: "/usinas/croata.webp" // Substitua pela imagem de pequenas instalações
  },
  {
    year: "2020",
    title: "A Virada: Solara Nasce e Cresce",
    description: "O boca a boca transformou a pequena iniciativa em um negócio sério. 'Solara' foi o nome escolhido, refletindo a paixão pelo sol e a energia. A empresa começou a projetar usinas maiores, com uma equipe pequena, mas altamente engajada, sempre com a liderança visionária de João.",
    icon: <TrendingUp size={24} className="text-yellow-500" />,
    image: "/usinas/beberibe.webp" // Substitua pela imagem da equipe Solara ou usina média
  },
  {
    year: "Hoje",
    title: "Dominando o Ceará: Expansão Sustentável",
    description: "Hoje, a Solara é sinônimo de energia fotovoltaica no Ceará. Com uma rede robusta de usinas em expansão, João e sua equipe estão não apenas iluminando casas e empresas, mas construindo um futuro mais verde e econômico para todo o estado, mantendo a chama do empreendedorismo acesa.",
    icon: <MapPin size={24} className="text-yellow-500" />,
    image: "/usinas/croata2.webp" // Substitua pela imagem de uma grande usina Solara ou do Ceará
  }
];

export default function AboutUs() {
  return (
    <section className="py-24 bg-slate-950/80 text-white relative overflow-hidden">
      
      {/* Luz de fundo sutil para dar profundidade e remeter ao sol */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-yellow-500/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Cabeçalho */}
        <div className="text-center mb-20">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-[10px] font-black uppercase tracking-[0.6em] text-yellow-500 mb-4 block"
          >
            Nossa Jornada
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black text-white leading-tight uppercase tracking-tighter"
          >
            A história por trás da <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600">
              Solara.
            </span>
          </motion.h2>
        </div>

        {/* Linha do Tempo da História */}
        <div className="relative">
          {/* Linha Vertical Central */}
          <div className="absolute left-1/2 -translate-x-1/2 h-full w-px bg-white/10 hidden lg:block" />

          {storyMilestones.map((milestone, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.8 }}
              className={`relative flex flex-col lg:flex-row items-center lg:items-start gap-12 py-12 ${
                index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse' // Alterna lado
              }`}
            >
              {/* Círculo do Ano na Linha do Tempo (Desktop) */}
              <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-slate-800 border border-yellow-500 flex items-center justify-center z-10">
                <span className="text-white font-bold text-lg">{milestone.year}</span>
              </div>

              {/* Conteúdo do Milestone */}
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

              {/* Imagem do Milestone */}
              <div className="w-full lg:w-5/12 relative h-64 rounded-2xl overflow-hidden shadow-xl border border-white/10 bg-slate-800">
                <Image 
                  src={milestone.image} 
                  alt={milestone.title} 
                  fill 
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* Ano visível no mobile */}
              <span className="lg:hidden absolute top-0 text-white/20 text-7xl font-black opacity-20 -z-10">
                {milestone.year}
              </span>

            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}