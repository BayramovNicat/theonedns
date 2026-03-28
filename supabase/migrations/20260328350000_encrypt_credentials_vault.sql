-- Convert credentials from jsonb to text (required for Vault TCE)
alter table public.projects
  alter column credentials type text using credentials::text;

alter table public.projects
  alter column credentials set default '{}';

-- Create encryption key and apply Transparent Column Encryption
do $$
declare
  v_key_id uuid;
begin
  select id into v_key_id
  from pgsodium.create_key(name := 'project_credentials');

  execute format(
    'security label for pgsodium on column public.projects.credentials is ''ENCRYPT WITH KEY ID %s SECURITY INVOKER''',
    v_key_id
  );
end $$;

-- Re-encrypt existing rows (triggers encryption on existing plaintext data)
update public.projects set credentials = credentials;

-- Grant authenticated role access to the decrypted view
grant select on public.decrypted_projects to authenticated;
