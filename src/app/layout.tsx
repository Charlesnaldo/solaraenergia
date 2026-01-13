import { Inter, Poppins } from "next/font/google";
import "./globals.css"; // O CSS PRINCIPAL TEM QUE ESTAR AQUI
import MotionProvider from "@/components/MotionProvider";

const inter = Inter({ subsets: ["latin"], display: 'swap' });
const poppins = Poppins({ 
  subsets: ["latin"], 
  weight: ["400", "600", "700", "900"], 
  variable: "--font-poppins", 
  display: 'swap' 
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br" className="scroll-smooth">
      <body className={`${inter.className} ${poppins.variable} antialiased bg-slate-950 text-white`}>
        <MotionProvider>
          {children}
        </MotionProvider>
      </body>
    </html>
  );
}