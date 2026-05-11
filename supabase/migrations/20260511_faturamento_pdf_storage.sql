alter table public.faturamento
  add column if not exists pdf_base64 text,
  add column if not exists pdf_filename text,
  add column if not exists pdf_content_type text default 'application/pdf',
  add column if not exists pdf_gerado_em timestamptz;
