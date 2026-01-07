import Header from "@/components/layout/Header";
import Hero from "@/components/Hero";
import Benefits from "@/components/Benefits";
import PlantSection from "@/components/PlantSection";
import Contact from "@/components/Contact";
import LogosCarousel from "@/components/LogosCarousel";
import Footer from "@/components/layout/Footer";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <Benefits />      
      <PlantSection />
      <LogosCarousel/>
      <Contact />
      <Footer/>
      
    </main>
  );
}