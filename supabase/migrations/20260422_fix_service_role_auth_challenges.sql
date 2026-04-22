-- Ensure service_role can write to auth_challenges in production.
grant usage on schema public to service_role;

grant select, insert, update, delete on public.auth_challenges to service_role;
