export default function Contact() {
  const whatsappNumber = "5511999999999"; // Substitua pelo seu número
  const message = encodeURIComponent("Olá! Gostaria de saber mais sobre as usinas da Solara e como posso reduzir minha conta de luz.");

  return (
    <section id="contato" className="py-20 bg-solara-dark text-white">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">Pronto para mudar sua forma de consumir energia?</h2>
        <p className="text-gray-400 mb-10 text-lg">
          Nossos consultores estão prontos para fazer um estudo de viabilidade gratuito para sua residência ou empresa.
        </p>
        
        <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl">
          <h3 className="text-xl font-semibold mb-6 text-solara-yellow">Fale com um especialista agora</h3>
          <a 
            href={`https://wa.me/${whatsappNumber}?text=${message}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-solara-green hover:bg-green-600 text-white font-bold py-4 px-10 rounded-full text-xl transition-all hover:scale-105"
          >
            Abrir conversa no WhatsApp
          </a>
          <p className="mt-4 text-sm text-gray-500 italic">
            Resposta média em menos de 10 minutos.
          </p>
        </div>
      </div>
    </section>
  );
}