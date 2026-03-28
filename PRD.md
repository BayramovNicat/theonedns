# TheOneDNS — Product Requirements Document

## Overview

TheOneDNS is a unified DNS management control plane that lets users manage DNS records across multiple platforms (Cloudflare, Vercel, Netlify) from a single interface. Instead of logging into each platform's dashboard, users connect their credentials once and manage all their domains and DNS records in one place.

## Problem Statement

Managing DNS records across multiple platforms is tedious. Each provider has a different UI, different workflows, and requires separate logins. For users who manage domains on Cloudflare, Vercel, and Netlify simultaneously, context-switching between dashboards wastes time and increases the chance of configuration errors.

## Target Users

- Developers and DevOps engineers managing multiple domains across platforms
- Agencies managing client domains on different providers
- Anyone who wants a single pane of glass for DNS management

## Core Features

### 1. Authentication

- Google OAuth via Supabase Auth
- Session management with automatic token refresh
- Protected routes — unauthenticated users redirect to `/login`

### 2. Multi-Platform Projects

Users create **projects**, each representing a single domain on a specific platform.

- **Supported platforms:** Cloudflare (active), Vercel (planned), Netlify (planned)
- **Per-project credentials:** stored as encrypted JSONB in Supabase
- **Credential validation:** on project creation, credentials are verified against the platform API before saving
- **Dynamic form fields:** each platform defines its own required credential fields (API token, zone ID, team ID, etc.)

### 3. DNS Record Management (Cloudflare)

Full CRUD operations on DNS records, fetched live from the Cloudflare API:

- **View:** lists all A, AAAA, and CNAME records for the domain (including the root domain)
- **Create:** add new DNS records with subdomain name, record type (A/CNAME), target content, and proxy toggle
- **Edit:** inline editing of record type, content, and proxy status
- **Delete:** remove records with confirmation

### 4. Projects Dashboard

- Grid view of all connected projects
- Each card shows domain name, platform badge, and delete action
- Click-through to project detail page for DNS management

## Tech Stack

| Layer         | Technology                                  |
| ------------- | ------------------------------------------- |
| Framework     | Next.js 16.2.1 (App Router)                 |
| Language      | TypeScript                                  |
| Auth          | Supabase Auth (Google OAuth)                |
| Database      | Supabase (PostgreSQL)                       |
| DNS API       | Cloudflare API v4                           |
| UI            | shadcn/ui v4, Tailwind CSS v4, Lucide icons |
| Notifications | Sonner (toast)                              |
| Runtime       | Bun                                         |

## Database Schema

### `projects` table

| Column        | Type                   | Description                          |
| ------------- | ---------------------- | ------------------------------------ |
| `id`          | uuid (PK)              | Auto-generated                       |
| `user_id`     | uuid (FK → auth.users) | Owner                                |
| `platform`    | text                   | `cloudflare`, `vercel`, or `netlify` |
| `credentials` | jsonb                  | Platform-specific credentials        |
| `domain`      | text                   | The managed domain                   |
| `created_at`  | timestamptz            | Creation timestamp                   |

Row Level Security ensures users can only access their own projects.

## API Routes

| Method | Route                    | Description                              |
| ------ | ------------------------ | ---------------------------------------- |
| POST   | `/api/projects`          | Create a project (validates credentials) |
| DELETE | `/api/projects`          | Delete a project                         |
| POST   | `/api/projects/[id]/dns` | Create a DNS record                      |
| PATCH  | `/api/projects/[id]/dns` | Update a DNS record                      |
| DELETE | `/api/projects/[id]/dns` | Delete a DNS record                      |

All routes verify authentication and project ownership before performing operations.

## Pages

| Route            | Description                                        |
| ---------------- | -------------------------------------------------- |
| `/login`         | Google OAuth sign-in                               |
| `/`              | Projects dashboard (list/create/delete projects)   |
| `/projects/[id]` | Project detail — DNS record table with inline CRUD |

## Security Model

- **Authentication:** Supabase Auth with server-side session validation on every request
- **Authorization:** RLS policies scope all database queries to the authenticated user
- **Credentials:** platform API tokens stored in Supabase JSONB, never exposed to the client
- **Input validation:** subdomain format, IP address format, required fields validated server-side
- **Proxy layer:** Next.js 16 `proxy.ts` intercepts requests to refresh sessions and enforce auth

## Platform Credentials

### Cloudflare (active)

- **API Token** — with `Zone.DNS Edit` permission
- **Zone ID** — from the domain's Overview page
- Supports both User API Tokens and Account API Tokens (`cfat_` prefix)

### Vercel (planned)

- **API Token** — from Vercel dashboard settings
- **Team ID** — optional, required for team-owned domains

### Netlify (planned)

- **Personal Access Token** — from user application settings
- **DNS Zone ID** — from domain DNS settings

## Future Considerations

- Vercel and Netlify DNS management implementation
- Bulk DNS record operations
- DNS record templates
- Domain health monitoring
- Multi-user team support
- Audit log for DNS changes
