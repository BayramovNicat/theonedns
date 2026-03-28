alter table public.projects drop column name;
alter table public.projects alter column domain set not null;
