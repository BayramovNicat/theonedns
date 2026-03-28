-- Cloudflare configs: one per user
create table public.cloudflare_configs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  api_token text not null,
  zone_id text not null,
  domain text not null,
  created_at timestamptz default now() not null
);

alter table public.cloudflare_configs enable row level security;

-- Users can only read/write their own config
create policy "Users can view own config"
  on public.cloudflare_configs for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own config"
  on public.cloudflare_configs for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own config"
  on public.cloudflare_configs for update
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can delete own config"
  on public.cloudflare_configs for delete
  to authenticated
  using (auth.uid() = user_id);

-- Link subdomains to a config instead of relying on env vars
alter table public.subdomains
  add column config_id uuid references public.cloudflare_configs(id) on delete cascade;

-- Update the subdomains table: make config_id required for new rows
-- (existing rows won't have it, but there shouldn't be any yet)
