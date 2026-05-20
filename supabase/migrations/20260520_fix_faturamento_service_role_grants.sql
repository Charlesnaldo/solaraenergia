grant usage on schema public to service_role;

grant select, insert, update, delete on public.faturamento to service_role;
grant select on public.clientes to service_role;
grant select on public.assinaturas to service_role;

grant usage, select on all sequences in schema public to service_role;
