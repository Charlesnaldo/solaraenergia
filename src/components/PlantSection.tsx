import { PLANTS } from "@/constants/plants";

export default function PlantSection() {
  return (
    <section id="usinas" className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-solara-dark">Nossas Usinas</h2>
          <p className="text-gray-600 mt-4">Tecnologia de ponta gerando energia limpa para milhares de famílias.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PLANTS.map((plant) => (
            <div key={plant.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow border border-gray-100">
              <div className="h-48 overflow-hidden">
                <img 
                  src={plant.image} 
                  alt={plant.title} 
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                />
              </div>
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-solara-dark">{plant.title}</h3>
                  <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-semibold">
                    {plant.status}
                  </span>
                </div>
                
                <p className="text-gray-500 text-sm mb-4 flex items-center">
                  📍 {plant.location}
                </p>

                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold">Potência</p>
                    <p className="text-solara-green font-bold">{plant.capacity}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold">Módulos</p>
                    <p className="text-solara-dark font-bold">{plant.panels}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}