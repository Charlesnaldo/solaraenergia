'use client';
// 1. Trocamos 'motion' por 'm' para usar o LazyMotion do layout
import { m } from 'framer-motion';
import Link from 'next/link';
import { ArrowUpRight, LucideIcon } from 'lucide-react';

interface ButtonProps {
  label: string;
  href: string;
  icon?: LucideIcon;
  variant?: 'primary' | 'outline' | 'neon';
  className?: string;
  onClick?: () => void;
}

export default function Button({ label, href, icon: Icon, variant = 'neon', className, onClick }: ButtonProps) {
  const isNeon = variant === 'neon';

  return (
    // 2. Trocado para m.div
    <m.div
      whileHover="hover"
      whileTap="tap"
      className={`relative inline-block group ${className}`}
    >
      <Link
        href={href}
        onClick={onClick}
        className={`
          relative z-10 overflow-hidden flex items-center justify-center gap-2 transition-all duration-500 font-bold uppercase tracking-[1px]
          px-5 py-2.5 rounded-full text-xs md:text-sm border border-yellow-500/30
          ${isNeon 
            ? 'text-yellow-500 hover:text-black hover:bg-yellow-500 hover:shadow-[0_0_30px_#eab308]' 
            : 'bg-yellow-500 text-black'}
        `}
      >
        {Icon && <Icon size={16} className="shrink-0" />}
        <span className="whitespace-nowrap">{label}</span>
        <ArrowUpRight size={14} strokeWidth={3} />
      </Link>
    </m.div>
  );
}