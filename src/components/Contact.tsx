'use client';
import { motion } from 'framer-motion';
import { MessageSquare, ArrowRight, Sparkles } from 'lucide-react';

export default function Contact() {
  const whatsappNumber = "5511999999999"; 
  const message = encodeURIComponent("Olá! Gostaria de saber mais sobre as usinas da Solara e como posso reduzir minha conta de luz.");

  return (
    <section id="contato" className="relative py-32 bg-slate-950 overflow-hidden">
      {/* Background Decorativo - Glow sutil para atrair o olhar ao centro */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-yellow-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
        
        {/* Badge de Call to Action */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full mb-8"
        >
          <Sparkles size={14} className="text-yellow-500" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">
            Consultoria Gratuita
          </span>
        </motion.div>

        {/* Título Principal - Seguindo o padrão tracking-tighter */}
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-6xl font-black text-white leading-[1.1] uppercase tracking-tighter mb-8"
        >
          Pronto para <span className="text-yellow-500">transformar</span> <br />
          sua energia?
        </motion.h2>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed mb-12"
        >
          Nossos especialistas estão prontos para desenhar um projeto de viabilidade exclusivo para sua empresa ou residência. Redução de custos com tecnologia de elite.
        </motion.p>
        
        {/* Card de Ação Glassmorphism */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="relative bg-white/[0.02] backdrop-blur-md border border-white/10 p-10 md:p-16 rounded-[3rem] shadow-2xl overflow-hidden group"
        >
          {/* Efeito de brilho interno no card */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />
          
          <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter mb-8">
            Inicie seu projeto agora
          </h3>

          <a 
            href={`https://wa.me/${whatsappNumber}?text=${message}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-4 bg-yellow-500 hover:bg-yellow-400 text-black font-black py-5 px-12 rounded-2xl text-sm md:text-base uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-[0_20px_50px_-15px_rgba(234,179,8,0.4)]"
          >
            <MessageSquare size={20} fill="black" />
            Falar com Especialista
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </a>

          <div className="mt-10 flex flex-col md:flex-row items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Consultores Online
              </span>
            </div>
            <div className="hidden md:block w-px h-4 bg-white/10" />
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">
              Resposta média: 10 minutos
            </p>
          </div>
        </motion.div>
      </div>

      {/* Detalhe Final de Transição para o Rodapé */}
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </section>
  );
}