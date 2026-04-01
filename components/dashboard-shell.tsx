'use client';

import { LogOut } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { createClient } from '@/lib/supabase/client';

type User = {
  id: string;
  email?: string;
  user_metadata?: Record<string, string | undefined>;
};

export function DashboardShell({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const meta = user.user_metadata;
  const avatarUrl = meta?.avatar_url ?? meta?.picture;
  const fullName = meta?.full_name ?? meta?.name;
  const initials =
    fullName
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) ??
    user.email?.slice(0, 2).toUpperCase() ??
    'U';

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="relative min-h-screen bg-zinc-950 text-white selection:bg-amber-500/30 selection:text-amber-200">
      {/* Background Elements */}
      <div className="grid-bg pointer-events-none fixed inset-0 z-0 opacity-10" />
      <div className="bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')] pointer-events-none fixed inset-0 z-100 opacity-[0.02]" />

      <header className="sticky top-0 z-40 border-b border-white/10 bg-zinc-900/50 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-12">
            <Link
              href="/dashboard"
              className="group flex flex-col items-start transition-opacity hover:opacity-90"
            >
              <h2 className="text-xl leading-none font-black md:text-2xl">
                <span className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">
                  TheOne
                </span>
                <span className="bg-linear-to-b from-amber-200 via-amber-400 to-amber-700 bg-clip-text pr-2 text-transparent drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]">
                  DNS
                </span>
              </h2>
            </Link>

            <nav className="hidden items-center gap-8 md:flex">
              {[
                { name: 'Dashboard', href: '/dashboard' },
                { name: 'Integrations', href: '/integrations' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-[10px] font-black tracking-[0.2em] uppercase transition-colors hover:text-amber-500 ${
                    pathname === link.href ? 'text-amber-500' : 'text-zinc-500'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-full ring-amber-500/50 ring-offset-zinc-950 transition-opacity outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-offset-2">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={fullName ?? user.email ?? ''}
                  width={32}
                  height={32}
                  referrerPolicy="no-referrer"
                  className="size-8 rounded-full border border-white/10 object-cover"
                  unoptimized
                />
              ) : (
                <Avatar className="size-8 border border-white/10">
                  <AvatarFallback className="bg-zinc-800 text-xs font-bold text-amber-500 uppercase">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="w-56 border-white/10 bg-zinc-900 shadow-2xl backdrop-blur-xl"
            >
              <div className="px-2 py-2">
                {fullName && (
                  <p className="text-sm font-bold text-white">{fullName}</p>
                )}
                <p className="text-muted-foreground truncate font-mono text-[10px] tracking-wider uppercase">
                  {user.email}
                </p>
              </div>
              <DropdownMenuSeparator className="bg-white/5" />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="cursor-pointer font-bold text-zinc-400 transition-colors hover:bg-amber-500/10 hover:text-amber-500 focus:bg-amber-500/10 focus:text-amber-500"
              >
                <LogOut className="mr-2 size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 py-12">
        {children}
      </main>
    </div>
  );
}
