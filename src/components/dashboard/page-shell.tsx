'use client';

import type { ReactNode } from 'react';
import { m } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

interface PageShellProps {
  eyebrow: string;
  title: string;
  description: string;
  badge?: string;
  children: ReactNode;
}

export function PageShell({ eyebrow, title, description, badge, children }: PageShellProps) {
  return (
    <div className="space-y-5">
      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col justify-between gap-4 md:flex-row md:items-end"
      >
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-yellow-300">{eyebrow}</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[color:var(--dash-fg)] md:text-4xl">{title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[color:var(--dash-muted)]">{description}</p>
        </div>
        {badge ? <Badge tone="blue">{badge}</Badge> : null}
      </m.div>

      {children}
    </div>
  );
}
