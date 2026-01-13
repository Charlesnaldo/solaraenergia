// Dentro de app/(dashboard)/admin/page.tsx
export default function AdminDashboard() {
  return (
    <div className="space-y-8">
       {/* Aqui vai apenas o grid de KPIs e a Tabela que fizemos antes */}
       <div className="flex items-center justify-between">
         <h1 className="text-3xl font-bold text-white">Dashboard Geral</h1>
         <p className="text-slate-400">Bem-vindo à gestão da Solara Energia.</p>
       </div>
       
       {/* Resto do código dos KPIs e Tabela... */}
    </div>
  );
}