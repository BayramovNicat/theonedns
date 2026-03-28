-- Convert credentials from jsonb to text for app-side encryption
alter table public.projects
  alter column credentials type text using credentials::text;

alter table public.projects
  alter column credentials set default '{}';
