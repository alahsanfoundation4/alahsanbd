create type public.app_role as enum ('admin', 'moderator', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

create policy "Users read own roles" on public.user_roles
for select to authenticated using (auth.uid() = user_id);

create table public.ai_settings (
  id integer primary key default 1,
  provider text not null default 'google',
  model text not null default 'gemini-3.8-flash',
  chat_enabled boolean not null default true,
  welcome_title text not null default '',
  welcome_subtitle text not null default '',
  suggestions text not null default '',
  url_reader boolean not null default false,
  site_builder boolean not null default true,
  updated_at timestamptz not null default now()
);
grant select on public.ai_settings to authenticated;
grant all on public.ai_settings to service_role;
alter table public.ai_settings enable row level security;
create policy "Authenticated read settings" on public.ai_settings for select to authenticated using (true);
create policy "Admins update settings" on public.ai_settings for update to authenticated using (public.has_role(auth.uid(), 'admin'));
insert into public.ai_settings (id, provider, model, chat_enabled, site_builder, welcome_title, welcome_subtitle)
values (1, 'google', 'gemini-3.8-flash', true, true, 'আল আহসান এআই', 'ইসলামী জ্ঞান গ্রন্থাগার ও ওয়েব বিল্ডার');

create table public.ai_keys (
  id integer primary key default 1,
  google_key text not null default '',
  openai_key text not null default '',
  key_pool jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);
grant select, update on public.ai_keys to authenticated;
grant all on public.ai_keys to service_role;
alter table public.ai_keys enable row level security;
create policy "Admins read keys" on public.ai_keys for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins update keys" on public.ai_keys for update to authenticated using (public.has_role(auth.uid(), 'admin'));
insert into public.ai_keys (id) values (1);

create table public.pages (
  id uuid primary key default gen_random_uuid(),
  num bigint generated always as identity,
  user_id uuid not null,
  title text,
  html text not null,
  created_at timestamptz not null default now()
);
grant select, insert on public.pages to authenticated;
grant all on public.pages to service_role;
grant usage, select on sequence public.pages_num_seq to service_role;
alter table public.pages enable row level security;
create policy "Users read own pages" on public.pages for select to authenticated using (auth.uid() = user_id);
create policy "Users insert own pages" on public.pages for insert to authenticated with check (auth.uid() = user_id);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.conversations to authenticated;
grant all on public.conversations to service_role;
alter table public.conversations enable row level security;
create policy "Users manage own conversations" on public.conversations for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  user_id uuid not null,
  role text not null,
  content text not null,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.messages to authenticated;
grant all on public.messages to service_role;
alter table public.messages enable row level security;
create policy "Users manage own messages" on public.messages for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.chat_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  created_at timestamptz not null default now()
);
grant select, insert on public.chat_usage to authenticated;
grant all on public.chat_usage to service_role;
alter table public.chat_usage enable row level security;
create policy "Users read own usage" on public.chat_usage for select to authenticated using (auth.uid() = user_id);

create table public.health_checks (
  id bigserial primary key,
  results jsonb not null,
  created_at timestamptz not null default now()
);
grant select on public.health_checks to authenticated;
grant all on public.health_checks to service_role;
grant usage, select on sequence public.health_checks_id_seq to service_role;
alter table public.health_checks enable row level security;
create policy "Admins read health" on public.health_checks for select to authenticated using (public.has_role(auth.uid(), 'admin'));