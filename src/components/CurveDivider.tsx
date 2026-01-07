// src/components/CurveDivider.tsx
export function CurveDivider() {
  return (
    /* A div pai precisa ter a cor da seção de BAIXO (branco). 
       O SVG terá a cor da seção de CIMA (preto/slate-950).
    */
    <div className="relative w-full overflow-hidden leading-[0] bg-white -mt-1">
      <svg 
        viewBox="0 0 1200 120" 
        preserveAspectRatio="none" 
        className="relative block w-full h-[60px] fill-[#05070a]" // Cor exata do fundo das usinas
      >
        <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5,73.84-4.36,147.54,16.88,218.2,35.26,69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"></path>
      </svg>
    </div>
  );
}