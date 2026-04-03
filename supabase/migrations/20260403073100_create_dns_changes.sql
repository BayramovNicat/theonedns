create table public.dns_changes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade not null,
  action text not null check (action in ('create', 'update', 'delete')),
  record_type text not null,
  record_name text not null,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz default now() not null
);

alter table public.dns_changes enable row level security;

create policy "Users can view own dns changes"
  on public.dns_changes for select
  to authenticated
  using (auth.uid() = user_id);

create index dns_changes_user_id_idx on public.dns_changes(user_id);
create index dns_changes_project_id_idx on public.dns_changes(project_id);
create index dns_changes_created_at_idx on public.dns_changes(created_at desc);
