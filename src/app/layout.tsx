import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";


// 1. Importe seus componentes aqui (ajuste o caminho se necessário)
import Header from "@/components/layout/Header"; 
import Footer from "@/components/layout/Footer";

import PreLoader from "@/components/PreLoader";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={inter.className}>
        
        {/* 🔥 PreLoader global */}
        <PreLoader />
        
        {/* 2. O Header fixo no topo */}
        <Header />

        {/* 3. O conteúdo da página atual (Home, Termos, etc) */}
        {children}

        {/* 4. O Footer no final de tudo */}
        <Footer />
      </body>
    </html>
  );
}