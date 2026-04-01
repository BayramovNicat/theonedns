'use client';

import { ArrowRight, Search } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { PLATFORMS, type Platform } from '@/lib/platforms';

export function IntegrationsMarketingClient() {
  const [search, setSearch] = useState('');

  const platforms = useMemo(() => {
    return Object.entries(PLATFORMS)
      .map(([id, config]) => ({
        id: id as Platform,
        ...config,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const filteredPlatforms = platforms.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-16">
      <div className="relative mx-auto max-w-2xl">
        <div className="absolute -inset-1 rounded-2xl bg-amber-500/5 blur-xl" />
        <Search className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-zinc-500" />
        <Input
          placeholder="Search for a realm to tether..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="relative h-16 border-white/10 bg-zinc-900/50 pl-12 text-lg text-white placeholder:text-zinc-700 backdrop-blur-xl transition-all focus:border-amber-500/50 focus:ring-amber-500/20"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredPlatforms.map((p) => (
          <div
            key={p.id}
            className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/50 p-8 transition-all hover:border-amber-500/50 hover:bg-zinc-900"
          >
            {/* Visual Identity Glow */}
            <div
              className="absolute -top-12 -right-12 size-32 blur-[50px] transition-opacity duration-500 group-hover:opacity-40"
              style={{ backgroundColor: p.color, opacity: 0.1 }}
            />

            <div className="mb-8 flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="text-2xl font-bold tracking-tight text-white">
                  {p.name}
                </h3>
                <p className="font-serif text-sm italic text-zinc-500">
                  {p.category}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
                <div
                  className="size-2 rounded-full"
                  style={{ backgroundColor: p.color }}
                />
              </div>
            </div>

            <p className="mb-8 font-serif text-sm italic text-zinc-400">
              Native integration via secure API protocols. Supports automated
              record management and real-time synchronization.
            </p>

            <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-6">
              <Link
                href="/login"
                className="group/btn flex items-center gap-2 text-[10px] font-black tracking-widest text-zinc-400 uppercase transition-colors hover:text-amber-500"
              >
                Forge connection
                <ArrowRight className="size-3 transition-transform group-hover/btn:translate-x-1" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {filteredPlatforms.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="font-serif text-2xl text-zinc-500 italic">
            No realms found in the current age.
          </p>
        </div>
      )}
    </div>
  );
}
