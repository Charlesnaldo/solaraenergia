'use client';

export default function Privacidade() {
  const dataAtual = new Date().toLocaleDateString('pt-BR');

  return (
    <main className="pt-32 pb-20 bg-white">
      <div className="max-w-3xl mx-auto px-6">
        {/* Cabeçalho */}
        <h1 className="font-display text-4xl md:text-5xl font-black text-slate-900 mb-8 uppercase">
          Política de <span className="text-yellow-500">Privacidade</span>
        </h1>
        
        <div className="prose prose-slate prose-lg max-w-none text-slate-600 space-y-8">
          <p className="font-medium">Última atualização: {dataAtual}</p>
          
          <p>
            A sua privacidade é importante para nós. É política da <strong>Solara</strong> respeitar a sua privacidade em relação a qualquer informação sua que possamos coletar no site.
          </p>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-800">1. Coleta de Informações</h2>
            <p>
              Solicitamos informações pessoais (como nome, e-mail e telefone) apenas quando realmente precisamos delas para fornecer um orçamento ou serviço. Fazemo-lo por meios justos e legais, com o seu conhecimento e consentimento.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-800">2. Uso dos Dados (LGPD)</h2>
            <p>
              Em conformidade com a <strong>Lei Geral de Proteção de Dados (LGPD)</strong>, utilizamos seus dados exclusivamente para:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Processar solicitações de orçamento de sistemas fotovoltaicos;</li>
              <li>Enviar atualizações sobre o seu projeto ou instalação;</li>
              <li>Comunicações de marketing (apenas se autorizado por você).</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-800">3. Retenção de Dados</h2>
            <p>
              Apenas retemos as informações coletadas pelo tempo necessário para fornecer o serviço solicitado. Quando armazenamos dados, os protegemos dentro de meios comercialmente aceitáveis ​​para evitar perdas e roubos.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-800">4. Cookies e Anúncios</h2>
            <p>
              Utilizamos cookies para entender como você interage com nosso site e para campanhas de remarketing via Google Ads e Meta Ads, visando oferecer soluções de energia solar mais relevantes para você.
            </p>
          </section>

          <section className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 mb-2">Contato sobre Dados</h2>
            <p className="text-sm">
              Se você tiver alguma dúvida sobre como lidamos com dados do usuário e informações pessoais, entre em contato conosco através do e-mail: <strong>privacidade@solara.com.br</strong>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}