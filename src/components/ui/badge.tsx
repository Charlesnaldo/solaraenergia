import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type BadgeTone = 'green' | 'yellow' | 'red' | 'blue' | 'slate';

const tones: Record<BadgeTone, string> = {
  green: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
  yellow: 'border-yellow-400/30 bg-yellow-400/10 text-yellow-200',
  red: 'border-red-400/30 bg-red-400/10 text-red-200',
  blue: 'border-sky-400/30 bg-sky-400/10 text-sky-200',
  slate: 'border-white/10 bg-white/5 text-slate-300',
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ className, tone = 'slate', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.14em]',
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
