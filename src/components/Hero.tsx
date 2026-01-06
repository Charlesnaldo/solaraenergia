export default function Hero() {
  return (
    <section className="pt-32 pb-20 bg-gradient-to-b from-solara-dark to-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <span className="text-solara-green font-bold tracking-widest uppercase text-sm">Energia Renovável</span>
        <h1 className="text-5xl md:text-7xl font-extrabold mt-4 mb-6 leading-tight">
          Sua conta de luz <br /> 
          <span className="text-solara-yellow">reduzida em até 95%</span>
        </h1>
        <p className="text-gray-300 text-xl max-w-2xl mx-auto mb-10">
          A Solara conecta você à energia solar através de usinas de alta tecnologia. 
          Sustentabilidade para o planeta, economia para o seu bolso.
        </p>
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <button className="bg-solara-green text-white px-10 py-4 rounded-lg font-bold text-lg hover:bg-green-600">
            Conhecer Planos
          </button>
          <button className="border-2 border-white/30 px-10 py-4 rounded-lg font-bold text-lg hover:bg-white/10">
            Falar com Consultor
          </button>
        </div>
      </div>
    </section>
  );
}