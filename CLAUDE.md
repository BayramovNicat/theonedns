@AGENTS.md

## Environment Variables

Required in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `CREDENTIALS_ENCRYPTION_KEY` — 64 hex characters (32 bytes) for AES-256-GCM encryption of provider credentials
- `SERVER_IP` (optional) — Server's outbound IP for Namecheap API (defaults to `127.0.0.1`)

## Commands

- `bun dev` — Start dev server
- `bun run lint` — Lint with Biome
- `bun run format` — Format with Biome

## Key Architecture

- DNS provider adapters live in `lib/dns/` — each exports a `PlatformAdapter` with `verify()` and `createProvider()`
- Provider credentials are AES-256-GCM encrypted at rest (`lib/crypto.ts`)
- All API routes verify auth via `supabase.auth.getUser()` (server-validated JWT)
- Row Level Security enforces per-user data isolation at the DB layer
- Rate limiting via token bucket (`lib/rate-limit.ts`) on all mutating endpoints
- DNS record validation: type allowlist, content length cap, TTL/priority bounds, record ID character allowlist
