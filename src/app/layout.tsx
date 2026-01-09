import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google"; // Importe a Poppins aqui
import "./globals.css";
import Header from "@/components/layout/Header"; 
import Footer from "@/components/layout/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import PreLoader from "@/components/PreLoader";

// Fonte padrão do site
const inter = Inter({ subsets: ["latin"] });

// Configuração da Poppins para uso específico
const poppins = Poppins({ 
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-poppins", // Define a variável para o Tailwind
});

export const metadata: Metadata = {
  title: "Solara | Energia Solar Limpa",
  description: "Economize até 95% na sua conta de energia com nossas usinas solares.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-br" className="scroll-smooth">
      {/* Adicionamos a variável da Poppins aqui no body */}
      <body className={`${inter.className} ${poppins.variable} antialiased`}>
        <PreLoader />     
        <Header />
        <main>{children}</main>
        <ScrollToTop/>        
        <Footer />
      </body>
    </html>
  );
}