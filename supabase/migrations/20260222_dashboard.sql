-- Solara Dashboard schema
create extension if not exists pgcrypto;

create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cpf_cnpj text not null unique,
  email text not null,
  telefone text,
  whatsapp text,
  endereco_completo text,
  rua text,
  numero text,
  bairro text,
  cidade text,
  estado text,
  cep text,
  complemento text,
  responsavel text,
  cargo_responsavel text,
  observacoes text,
  status_assinatura text not null default 'ativa' check (status_assinatura in ('ativa', 'inativa', 'cancelada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.assinaturas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  valor_mensal numeric(12,2) not null check (valor_mensal >= 0),
  dia_vencimento int not null check (dia_vencimento between 1 and 31),
  status text not null default 'ativa' check (status in ('ativa', 'pausada', 'cancelada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.consumo_energia (
  id uuid primary key default gen_random_uuid(),
  assinatura_id uuid not null references public.assinaturas(id) on delete cascade,
  referencia date not null,
  consumo_kwh numeric(12,2) not null check (consumo_kwh >= 0),
  created_at timestamptz not null default now(),
  unique(assinatura_id, referencia)
);

create table if not exists public.faturamento (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  assinatura_id uuid references public.assinaturas(id) on delete set null,
  id_itau text,
  valor numeric(12,2) not null check (valor >= 0),
  data_vencimento date not null,
  status text not null default 'pendente' check (status in ('pendente', 'pago', 'atrasado')),
  boleto_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.usinas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  saude_percentual numeric(5,2) not null default 100 check (saude_percentual between 0 and 100),
  geracao_tempo_real_kw numeric(12,2) not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.cliente_tokens (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  token text not null unique,
  expira_em timestamptz not null,
  usado boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.auth_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  phone text not null,
  code_hash text not null,
  expira_em timestamptz not null,
  usado boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_faturamento_status_vencimento on public.faturamento(status, data_vencimento);
create index if not exists idx_assinaturas_cliente on public.assinaturas(cliente_id);
create index if not exists idx_consumo_assinatura_ref on public.consumo_energia(assinatura_id, referencia);
create index if not exists idx_cliente_cpf_cnpj on public.clientes(cpf_cnpj);
create index if not exists idx_auth_challenges_user on public.auth_challenges(user_id, expira_em);

grant usage on schema public to service_role;
grant select, insert, update, delete on public.clientes to service_role;
grant select, insert, update, delete on public.assinaturas to service_role;
grant select, insert, update, delete on public.consumo_energia to service_role;
grant select, insert, update, delete on public.faturamento to service_role;
grant select, insert, update, delete on public.usinas to service_role;
grant select, insert, update, delete on public.cliente_tokens to service_role;
grant select, insert, update, delete on public.auth_challenges to service_role;

alter table public.clientes enable row level security;
alter table public.assinaturas enable row level security;
alter table public.consumo_energia enable row level security;
alter table public.faturamento enable row level security;
alter table public.usinas enable row level security;
alter table public.cliente_tokens enable row level security;
alter table public.auth_challenges enable row level security;

drop policy if exists "admin_full_access_clientes" on public.clientes;
create policy "admin_full_access_clientes" on public.clientes
for all
using (auth.jwt() ->> 'role' = 'admin')
with check (auth.jwt() ->> 'role' = 'admin');

drop policy if exists "admin_full_access_assinaturas" on public.assinaturas;
create policy "admin_full_access_assinaturas" on public.assinaturas
for all
using (auth.jwt() ->> 'role' = 'admin')
with check (auth.jwt() ->> 'role' = 'admin');

drop policy if exists "admin_full_access_consumo" on public.consumo_energia;
create policy "admin_full_access_consumo" on public.consumo_energia
for all
using (auth.jwt() ->> 'role' = 'admin')
with check (auth.jwt() ->> 'role' = 'admin');

drop policy if exists "admin_full_access_faturamento" on public.faturamento;
create policy "admin_full_access_faturamento" on public.faturamento
for all
using (auth.jwt() ->> 'role' = 'admin')
with check (auth.jwt() ->> 'role' = 'admin');

drop policy if exists "admin_full_access_usinas" on public.usinas;
create policy "admin_full_access_usinas" on public.usinas
for all
using (auth.jwt() ->> 'role' = 'admin')
with check (auth.jwt() ->> 'role' = 'admin');

drop policy if exists "admin_full_access_tokens" on public.cliente_tokens;
create policy "admin_full_access_tokens" on public.cliente_tokens
for all
using (auth.jwt() ->> 'role' = 'admin')
with check (auth.jwt() ->> 'role' = 'admin');

drop policy if exists "admin_full_access_challenges" on public.auth_challenges;
create policy "admin_full_access_challenges" on public.auth_challenges
for all
using (auth.jwt() ->> 'role' = 'admin')
with check (auth.jwt() ->> 'role' = 'admin');

-- Portal cliente (sem login complexo): leitura validada por CPF/CNPJ + token em API server-side.
-- Mantemos RLS estrito e uso de service_role apenas na API.



