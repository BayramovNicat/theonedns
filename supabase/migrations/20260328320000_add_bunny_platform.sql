-- Allow bunny as a platform value
alter table public.projects drop constraint if exists projects_platform_check;
alter table public.projects add constraint projects_platform_check
  check (platform in ('cloudflare', 'vercel', 'netlify', 'digitalocean', 'hetzner', 'godaddy', 'gcloud', 'porkbun', 'dnsimple', 'namecom', 'route53', 'vultr', 'linode', 'gandi', 'ovh', 'namecheap', 'azure', 'bunny'));
