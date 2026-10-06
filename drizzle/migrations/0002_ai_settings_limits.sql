alter table public.ai_settings
  add column if not exists hourly_limit integer not null default 30,
  add column if not exists daily_limit integer not null default 200;