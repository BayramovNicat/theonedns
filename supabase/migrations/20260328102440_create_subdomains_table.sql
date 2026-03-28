-- Create the subdomains table
create table public.subdomains (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  subdomain text not null,
  record_type text not null default 'A' check (record_type in ('A', 'CNAME')),
  content text not null,
  cloudflare_record_id text,
  proxied boolean default true,
  created_at timestamptz default now() not null
);

-- Unique constraint: one subdomain name per zone
alter table public.subdomains
  add constraint subdomains_subdomain_unique unique (subdomain);

-- Enable Row Level Security
alter table public.subdomains enable row level security;

-- Policy: users can read all subdomains (shared dashboard)
create policy "Users can view all subdomains"
  on public.subdomains for select
  to authenticated
  using (true);

-- Policy: users can insert their own subdomains
create policy "Users can create subdomains"
  on public.subdomains for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Policy: users can delete their own subdomains
create policy "Users can delete own subdomains"
  on public.subdomains for delete
  to authenticated
  using (auth.uid() = user_id);

-- Indexes for fast lookups
create index subdomains_user_id_idx on public.subdomains(user_id);
create index subdomains_subdomain_idx on public.subdomains(subdomain);
