'use client';

import { LazyMotion } from "framer-motion";

// Função para carregar as funcionalidades de animação de forma assíncrona
const loadFeatures = () => import("@/lib/framer-features").then((res) => res.default);

export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      {children}
    </LazyMotion>
  );
}