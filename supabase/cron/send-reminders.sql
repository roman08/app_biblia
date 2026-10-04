-- Recordatorios inteligentes: ejecutar send-notifications cada hora en punto.
--
-- Ejecuta este archivo UNA VEZ en Supabase → SQL Editor, DESPUÉS de:
--   1. aplicar supabase/migrations/20261003120000_bible_progress_and_reminders.sql
--   2. desplegar la función: npx supabase functions deploy send-notifications --no-verify-jwt
--
-- No es una migración porque necesita un secreto (CRON_SECRET) que no va en git.

-- 1. Extensiones para tareas programadas y peticiones HTTP
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 2. Guardar CRON_SECRET en el Vault (el mismo valor configurado en la función).
--    Reemplaza el texto y ejecuta esta línea una sola vez:
-- select vault.create_secret('PEGA_AQUI_TU_CRON_SECRET', 'cron_secret');

-- 3. Quitar cualquier tarea anterior que llame a send-notifications
--    (antes se enviaba una vez al día a todos; ahora cada hora y la función
--    decide a quién le toca)
select cron.unschedule(jobid)
from cron.job
where command ilike '%send-notifications%';

-- 4. Programar cada hora en punto
select cron.schedule(
  'send-reminders-hourly',
  '0 * * * *',
  $$
  select net.http_post(
    url := 'https://fsiwxldmvooxzlvfdbsu.supabase.co/functions/v1/send-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret'
      )
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Comprobar:
--   select jobname, schedule, active from cron.job;
--   select status, return_message, start_time from cron.job_run_details order by start_time desc limit 5;
