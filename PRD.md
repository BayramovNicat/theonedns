# TheOneDNS — Product Requirements Document

## Overview

TheOneDNS is a unified DNS management control plane that lets users manage DNS records across multiple platforms from a single interface. Instead of logging into each platform's dashboard, users connect their credentials once and manage all their domains and DNS records in one place.

## Problem Statement

Managing DNS records across multiple platforms is tedious. Each provider has a different UI, different workflows, and requires separate logins. For users who manage domains on Cloudflare, Vercel, AWS, and others simultaneously, context-switching between dashboards wastes time and increases the chance of configuration errors.

## Target Users

- Developers and DevOps engineers managing multiple domains across platforms
- Agencies managing client domains on different providers
- Anyone who wants a single pane of glass for DNS management

## Core Features

### 1. Authentication

- Google OAuth via Supabase Auth
- Session management with automatic token refresh via Next.js 16 proxy
- Protected routes — unauthenticated users redirect to `/login`
- Proxy skips auth check on public routes for faster page loads

### 2. Multi-Platform Projects

Users create **projects**, each representing a single domain on a specific platform.

- **19 supported platforms** — Cloudflare, Vercel, Netlify, DigitalOcean, Hetzner, GoDaddy, Google Cloud DNS, Porkbun, DNSimple, Name.com, AWS Route 53, Vultr, Linode, Gandi, OVH, Namecheap, Bunny DNS, Dynadot, Hostinger
- **Per-project credentials:** encrypted with AES-256-GCM, stored in Supabase
- **Credential validation:** on project creation, credentials are verified against the platform API before saving
- **Dynamic form fields:** each platform defines its own required credential fields (API token, zone ID, team ID, etc.)

### 3. DNS Record Management

Full CRUD operations on DNS records, fetched live from each platform's API:

- **View:** lists all A, AAAA, and CNAME records for the domain
- **Create:** add new DNS records with subdomain name, record type (A/CNAME), target content, and proxy toggle (Cloudflare)
- **Edit:** inline editing of record type, content, and proxy status
- **Delete:** remove records with confirmation
- **Streaming:** DNS records load via Suspense with skeleton fallbacks while the page shell renders instantly

### 4. Landing Page

- Server-rendered landing page with client-side animations (framer-motion)
- Interactive 3D card hover effects for featured platforms
- Mock DNS dashboard demo with filterable records
- Infinite marquee of supported registrars
- Bento grid with simulated sync/ping demo for infrastructure providers

### 5. Projects Dashboard

- Grid view of all connected projects with skeleton loading via Suspense
- Each card shows domain name, platform badge, and delete action
- Click-through to project detail page for DNS management

## Tech Stack

| Layer         | Technology                                  |
| ------------- | ------------------------------------------- |
| Framework     | Next.js 16 (App Router)                     |
| Language      | TypeScript                                  |
| Auth          | Supabase Auth (Google OAuth)                |
| Database      | Supabase (PostgreSQL)                       |
| DNS APIs      | 19 platform integrations                    |
| UI            | shadcn/ui v4, Tailwind CSS v4, Lucide icons |
| Animations    | Framer Motion                               |
| Notifications | Sonner (toast)                              |
| Runtime       | Bun                                         |

## Database Schema

### `projects` table

| Column        | Type                   | Description                |
| ------------- | ---------------------- | -------------------------- |
| `id`          | uuid (PK)              | Auto-generated             |
| `user_id`     | uuid (FK → auth.users) | Owner                      |
| `platform`    | text                   | Platform identifier        |
| `credentials` | text                   | AES-256-GCM encrypted JSON |
| `domain`      | text                   | The managed domain         |
| `created_at`  | timestamptz            | Creation timestamp         |

Row Level Security ensures users can only access their own projects.

## API Routes

| Method | Route                    | Description                              |
| ------ | ------------------------ | ---------------------------------------- |
| POST   | `/api/projects`          | Create a project (validates credentials) |
| DELETE | `/api/projects`          | Delete a project                         |
| POST   | `/api/projects/[id]/dns` | Create a DNS record                      |
| PATCH  | `/api/projects/[id]/dns` | Update a DNS record                      |
| DELETE | `/api/projects/[id]/dns` | Delete a DNS record                      |

All routes use `getSession()` for fast auth (session already refreshed by proxy) and verify project ownership.

## Pages

| Route            | Description                                        |
| ---------------- | -------------------------------------------------- |
| `/`              | Landing page with platform showcase                |
| `/login`         | Google OAuth sign-in                               |
| `/dashboard`     | Projects dashboard (list/create/delete projects)   |
| `/projects/[id]` | Project detail — DNS record table with inline CRUD |

## Security Model

- **Authentication:** Supabase Auth with proxy-level session refresh (`getUser()` once per request)
- **Authorization:** RLS policies scope all database queries to the authenticated user
- **Credentials:** platform API tokens encrypted with AES-256-GCM, never exposed to the client
- **Input validation:** subdomain format, IP address format, required fields validated server-side
- **Proxy layer:** Next.js 16 `proxy.ts` intercepts requests to refresh sessions and enforce auth

## Performance Optimizations

- **Proxy auth skip:** public routes (`/`, `/login`, `/auth/*`) bypass Supabase auth entirely
- **Session-based auth in pages:** `getSession()` reads JWT from cookies instead of `getUser()` network call
- **Suspense streaming:** dashboard and project pages render shells instantly, data streams in with skeletons
- **Inline SVG icons:** platform logos bundled as components instead of external URL fetches
- **Server component landing page:** reduces client JS bundle — only interactive sections are client components

## Accessibility

- `<main>` landmark for screen reader navigation
- `aria-label` on icon-only links
- `aria-pressed` on filter toggle buttons
- `aria-label` on data tables
- WCAG AA contrast ratios on all text elements

## Future Considerations

- Bulk DNS record operations
- DNS record templates
- Domain health monitoring
- Multi-user team support
- Audit log for DNS changes
