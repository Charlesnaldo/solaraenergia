alter table public.clientes
  alter column email drop not null;

grant select, insert, update, delete on public.clientes to service_role;
grant select, insert, update, delete on public.assinaturas to service_role;
