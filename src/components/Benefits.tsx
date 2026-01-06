import { Sun, ShieldCheck, TrendingDown, Leaf } from "lucide-react"; // Note: Você pode precisar instalar: npm install lucide-react

const benefits = [
  {
    icon: <TrendingDown className="w-8 h-8 text-solara-green" />,
    title: "Economia Real",
    description: "Redução imediata de até 95% na sua fatura de energia mensal."
  },
  {
    icon: <Leaf className="w-8 h-8 text-solara-green" />,
    title: "Sustentabilidade",
    description: "Energia 100% limpa vinda de fontes renováveis e inesgotáveis."
  },
  {
    icon: <ShieldCheck className="w-8 h-8 text-solara-green" />,
    title: "Segurança",
    description: "Monitoramento 24h e manutenção inclusa em todas as nossas usinas."
  }
];

export default function Benefits() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex flex-col items-center text-center p-6 hover:bg-slate-50 rounded-2xl transition">
              <div className="mb-4 p-3 bg-green-50 rounded-full">
                {benefit.icon}
              </div>
              <h3 className="text-xl font-bold text-solara-dark mb-2">{benefit.title}</h3>
              <p className="text-gray-600">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}