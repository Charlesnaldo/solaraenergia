alter table public.faturamento
  drop constraint if exists faturamento_status_check;

update public.faturamento
set status = case
  when status = 'pendente' then 'gerado'
  when status = 'atrasado' then 'nao_pago'
  else status
end
where status in ('pendente', 'atrasado');

alter table public.faturamento
  alter column status set default 'gerado';

alter table public.faturamento
  add constraint faturamento_status_check
  check (status in ('gerado', 'pago', 'nao_pago'));
