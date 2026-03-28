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
ENCRYPTION_KEY=your_aes_256_encryption_key
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
  (landing)/page.tsx     Landing page (server component)
  (dashboard)/
    dashboard/page.tsx   Projects dashboard
    projects/[id]/       DNS record management
  api/
    projects/            CRUD for projects
    projects/[id]/dns/   CRUD for DNS records
components/              UI components
lib/
  platforms.ts           Platform configs (credentials, API adapters)
  crypto.ts              AES-256-GCM encryption
  supabase/              Supabase client helpers
proxy.ts                 Auth session refresh proxy
```

## Security

- Platform credentials encrypted with AES-256-GCM, never exposed to the client
- Row Level Security scopes all queries to the authenticated user
- Proxy-level session refresh with public route bypass
- Server-side validation on all inputs
