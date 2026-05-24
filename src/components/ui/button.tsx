import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'default' | 'secondary' | 'ghost' | 'outline' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variants: Record<ButtonVariant, string> = {
  default: 'bg-yellow-400 text-slate-950 shadow-[0_0_28px_rgba(250,204,21,0.22)] hover:bg-yellow-300',
  secondary: 'bg-[color:var(--dash-surface-strong)] text-[color:var(--dash-fg)] hover:bg-white/15',
  ghost: 'bg-transparent text-[color:var(--dash-muted)] hover:bg-white/10 hover:text-[color:var(--dash-fg)]',
  outline: 'border border-[color:var(--dash-border)] bg-[color:var(--dash-surface)] text-[color:var(--dash-fg)] hover:border-yellow-400/50 hover:text-yellow-200',
  danger: 'bg-red-500/15 text-red-200 hover:bg-red-500/25',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-5 text-sm',
  icon: 'h-9 w-9 p-0',
};

export function Button({ className, variant = 'default', size = 'md', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-bold transition-all disabled:pointer-events-none disabled:opacity-50',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/70',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
