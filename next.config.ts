import type { NextConfig } from "next";
import withBundleAnalyzer from '@next/bundle-analyzer';

const nextConfig: NextConfig = {
  // 1. Otimização de Imagens
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    qualities: [60, 75, 80, 85],
  },

  // 2. Configuração de Rede/Segurança para Next 15+
  // No Next 15/16 com Turbopack, o allowedDevOrigins fica direto na raiz 
  // ou é gerenciado pelo servidor de dev de forma mais automática.
  // Se o aviso persistir, remova esta chave experimental.
  
  // 3. Performance
  reactStrictMode: true,
  // swcMinify foi removido pois agora é o comportamento padrão obrigatório.
};

// 4. Configuração do Analyzer
const analyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default analyzer(nextConfig);