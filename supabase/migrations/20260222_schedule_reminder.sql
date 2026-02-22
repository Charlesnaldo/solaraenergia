-- Requires pg_cron extension in your Supabase project
create extension if not exists pg_cron;

select cron.schedule(
  'solara-boleto-reminder-daily',
  '0 8 * * *',
  $$
  select
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/boleto-reminder',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := '{}'::jsonb
    );
  $$
);
