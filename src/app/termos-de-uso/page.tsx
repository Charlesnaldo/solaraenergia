// Exemplo para src/app/termos-de-uso/page.tsx
export default function TermosDeUso() {
  return (
    <main className="pt-32 pb-20 bg-white">
      <div className="max-w-3xl mx-auto px-6">
        <h1 className="font-display text-4xl md:text-5xl font-black text-slate-900 mb-8 uppercase">
          Termos de <span className="text-yellow-500">Uso</span>
        </h1>
        
        <div className="prose prose-slate prose-lg max-w-none text-slate-600 space-y-6">
          <p>Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800">1. Aceitação dos Termos</h2>
            <p>Ao acessar o site da Solara, você concorda em cumprir estes termos de serviço, todas as leis e regulamentos aplicáveis.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-800">2. Licença de Uso</h2>
            <p>É concedida permissão para baixar temporariamente uma cópia dos materiais (informações ou software) no site Solara , apenas para visualização transitória pessoal e não comercial.</p>
          </section>
          
          {/* Adicione mais seções conforme necessário */}
        </div>
      </div>
    </main>
  );
}