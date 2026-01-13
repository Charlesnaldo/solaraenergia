import type { Metadata, Viewport } from "next"; // Importe Viewport aqui
import { Inter, Poppins } from "next/font/google";
// import "../globals.css";
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

// 1. ADICIONE ESTA CONSTANTE PARA A COR DO IPHONE
export const viewport: Viewport = {
  themeColor: "#000814", 
  width: "device-width",
  initialScale: 1,
  // maximumScale: 1, 
};

export const metadata: Metadata = {
  title: "Solara | Energia Solar Limpa",
  description: "Economize até 95% na sua conta de energia com nossas usinas solares.",
  keywords: ["energia solar", "solara", "economia de energia", "sustentabilidade"],
  // 2. ADICIONE ISSO PARA MELHORAR A EXPERIÊNCIA NO IOS
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Solara Energia",
  },
  openGraph: {
    title: "Solara Energia | Energia por Assinatura",
    description: "Reduza seus custos mensais com energia limpa gerada em nossas usinas no Ceará.",
    url: 'https://solaraenergia.com.br',
    siteName: 'Solara Energia',
    locale: 'pt_BR',
    type: 'website',
    images: [
      {
        url: '/og-image.png', // Crie uma imagem de 1200x630 para o Google/WhatsApp
        width: 1200,
        height: 630,
        alt: 'Solara Energia Fortaleza',
      },
    ],
  },
};




export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-br" className="scroll-smooth">
      <body className={`${inter.className} ${poppins.variable} antialiased bg-slate-950 text-white`}>
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