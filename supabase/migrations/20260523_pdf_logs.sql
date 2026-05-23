create table if not exists public.pdf_logs (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid,
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  faturamento_id uuid not null references public.faturamento(id) on delete cascade,
  acao text not null,
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_pdf_logs_cliente_created_at on public.pdf_logs(cliente_id, created_at desc);
create index if not exists idx_pdf_logs_faturamento_created_at on public.pdf_logs(faturamento_id, created_at desc);

grant select, insert on public.pdf_logs to service_role;

alter table public.pdf_logs enable row level security;
