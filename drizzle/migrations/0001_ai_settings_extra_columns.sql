alter table public.ai_settings
  add column if not exists system_prompt text not null default '',
  add column if not exists admin_note text not null default '',
  add column if not exists reasoning_effort text not null default 'none';