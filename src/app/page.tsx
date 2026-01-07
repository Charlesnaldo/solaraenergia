
import Hero from "@/components/Hero";
import Benefits from "@/components/Benefits";
import PlantSection from "@/components/PlantSection";
import Contact from "@/components/Contact";
import LogosCarousel from "@/components/LogosCarousel";
import {CurveDivider} from "@/components/CurveDivider";
import ContactForm from "@/components/ContactForm";


export default function Home() {
  return (
    <main className="min-h-screen">
      
      <Hero />
      <Benefits />      
      <PlantSection />
      <CurveDivider/>
      <LogosCarousel/>
      <Contact />
      <ContactForm/>
      
      
    </main>
  );
}