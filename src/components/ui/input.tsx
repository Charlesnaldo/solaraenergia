import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-md border border-[color:var(--dash-border)] bg-[color:var(--dash-surface)] px-3 text-sm text-[color:var(--dash-fg)] outline-none transition',
        'placeholder:text-[color:var(--dash-muted)] focus:border-yellow-400/50 focus:ring-2 focus:ring-yellow-400/10',
        className,
      )}
      {...props}
    />
  );
}
