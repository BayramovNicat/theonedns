create table public.projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  platform text not null check (platform in (
    'cloudflare', 'vercel', 'netlify', 'digitalocean', 'hetzner',
    'godaddy', 'gcloud', 'porkbun', 'dnsimple', 'namecom',
    'route53', 'vultr', 'linode', 'gandi', 'ovh',
    'namecheap', 'bunny', 'dynadot', 'hostinger'
  )),
  credentials text not null default '{}',
  domain text not null,
  created_at timestamptz default now() not null
);

alter table public.projects enable row level security;

create policy "Users can view own projects"
  on public.projects for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can create own projects"
  on public.projects for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own projects"
  on public.projects for update
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can delete own projects"
  on public.projects for delete
  to authenticated
  using (auth.uid() = user_id);

create index projects_user_id_idx on public.projects(user_id);
