alter table public.faturamento
  add column if not exists nosso_numero text,
  add column if not exists codigo_barras text,
  add column if not exists linha_digitavel text,
  add column if not exists pix_qr_code text,
  add column if not exists pix_url text,
  add column if not exists api_response jsonb;

create index if not exists idx_faturamento_nosso_numero on public.faturamento(nosso_numero);
