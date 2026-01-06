import Header from "@/components/layout/Header";
import Hero from "@/components/Hero";
import Benefits from "@/components/Benefits";
import PlantSection from "@/components/PlantSection";
import Contact from "@/components/Contact";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <Benefits />
      <PlantSection />
      <Contact />
      
      <footer className="py-10 bg-slate-900 text-center text-gray-500 border-t border-slate-800">
        <p>© 2026 Solara Energia Limpa - Transformando o sol em economia.</p>
      </footer>
    </main>
  );
}