import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

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
        {children}
      </body>
    </html>
  );
}