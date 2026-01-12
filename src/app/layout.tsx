import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header"; 
import Footer from "@/components/layout/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import PreLoader from "@/components/PreLoader";
import MotionProvider from "@/components/MotionProvider";

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
});

const poppins = Poppins({ 
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  variable: "--font-poppins",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Solara | Energia Solar Limpa",
  description: "Economize até 95% na sua conta de energia com nossas usinas solares.",
  keywords: ["energia solar", "solara", "economia de energia", "sustentabilidade"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-br" className="scroll-smooth">
      <body className={`${inter.className} ${poppins.variable} antialiased bg-slate-950 text-white`}>
        {/* O Provider carrega o motor de animação de forma assíncrona */}
        <MotionProvider>
          <PreLoader />     
          <Header />
          <main className="min-h-screen">
            {children}
          </main>
          <ScrollToTop />         
          <Footer />
        </MotionProvider>
      </body>
    </html>
  );
}