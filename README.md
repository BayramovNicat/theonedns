# TheOneDNS

A unified DNS management control plane. Manage DNS records across 19 platforms from a single dashboard instead of logging into each provider separately.

## Supported Platforms

Cloudflare, Vercel, Netlify, DigitalOcean, Hetzner, GoDaddy, Google Cloud DNS, Porkbun, DNSimple, Name.com, AWS Route 53, Vultr, Linode, Gandi, OVH, Namecheap, Bunny DNS, Dynadot, Hostinger

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Auth:** Supabase Auth (Google OAuth)
- **Database:** Supabase (PostgreSQL)
- **UI:** shadcn/ui v4, Tailwind CSS v4, Lucide icons
- **Animations:** Framer Motion
- **Runtime:** Bun

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) installed
- A [Supabase](https://supabase.com) project with Google OAuth configured

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
CREDENTIALS_ENCRYPTION_KEY=your_64_hex_char_key
SERVER_IP=your_server_outbound_ip  # optional, used for Namecheap API
```

Generate an encryption key:

```bash
openssl rand -hex 32
```

### Install and Run

```bash
bun install
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
app/
  (landing)/page.tsx          Landing page
  (dashboard)/
    dashboard/page.tsx        Projects dashboard
    projects/[id]/page.tsx    DNS record management
  api/
    projects/                 CRUD for projects
    projects/[id]/dns/        CRUD for DNS records
    dns/audit/                DNS record auditing
    dns/propagation/          DNS propagation checking
components/                   UI components
lib/
  dns/                        DNS provider adapters (19 platforms)
  platforms.ts                Platform configs and credential schemas
  crypto.ts                   AES-256-GCM credential encryption
  rate-limit.ts               Token-bucket rate limiter
  supabase/                   Supabase client helpers
proxy.ts                      Auth session refresh proxy
```

## Security

- Platform credentials encrypted with AES-256-GCM (validated 32-byte key), never exposed to the client
- Row Level Security scopes all queries to the authenticated user
- Server-side JWT verification via `supabase.auth.getUser()` on all API routes
- Rate limiting on all mutating endpoints
- DNS record type allowlist, content length caps, TTL/priority bounds validation
- Record ID strict character allowlist to prevent URL manipulation
- CSP, HSTS, X-Frame-Options, and other security headers configured
- Supabase URL referenced via environment variable, not hardcoded
