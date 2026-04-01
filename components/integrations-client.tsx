'use client';

import { Search, CheckCircle2, ArrowRight } from 'lucide-react';
import { useState, useMemo } from 'react';
import { AddProjectForm } from '@/components/add-project-form';
import { Input } from '@/components/ui/input';
import { PLATFORMS, type Platform } from '@/lib/platforms';

export function IntegrationsClient({
  connectedPlatforms,
}: {
  connectedPlatforms: { platform: string; count: number }[];
}) {
  const [search, setSearch] = useState('');

  const platforms = useMemo(() => {
    return Object.entries(PLATFORMS)
      .map(([id, config]) => {
        const connection = connectedPlatforms.find((p) => p.platform === id);
        return {
          id: id as Platform,
          ...config,
          connected: !!connection,
          count: connection?.count ?? 0,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [connectedPlatforms]);

  const filteredPlatforms = platforms.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-12">
      <div className="relative">
        <div className="absolute -inset-1 rounded-2xl bg-amber-500/5 blur-xl" />
        <Search className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-zinc-500" />
        <Input
          placeholder="Search for a realm to tether..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="relative h-16 border-white/10 bg-zinc-900/50 pl-12 text-lg text-white placeholder:text-zinc-700 backdrop-blur-xl transition-all focus:border-amber-500/50 focus:ring-amber-500/20"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredPlatforms.map((p) => (
          <PlatformCard key={p.id} platform={p} />
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

function PlatformCard({
  platform,
}: {
  platform: (typeof PLATFORMS)[Platform] & {
    id: Platform;
    connected: boolean;
    count: number;
  };
}) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/50 p-6 transition-all hover:border-amber-500/50 hover:bg-zinc-900">
      {/* Visual Identity Glow */}
      <div
        className="absolute -top-12 -right-12 size-32 blur-[50px] transition-opacity duration-500 group-hover:opacity-40"
        style={{ backgroundColor: platform.color, opacity: 0.15 }}
      />

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h3 className="text-2xl font-bold text-white tracking-tight">{platform.name}</h3>
          <p className="font-serif text-sm text-zinc-500 italic">
            {platform.category}
          </p>
        </div>
        
        {platform.connected ? (
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-bold tracking-widest text-emerald-500 uppercase ring-1 ring-emerald-500/20">
              <CheckCircle2 className="size-3" />
              Tethered
            </div>
            <span className="text-[9px] font-bold text-zinc-600 uppercase">
              {platform.count} {platform.count === 1 ? 'domain' : 'domains'}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-[10px] font-bold tracking-widest text-zinc-500 uppercase ring-1 ring-white/10">
            Available
          </div>
        )}
      </div>

      <div className="mt-8">
        <p className="font-serif text-sm text-zinc-400 italic">
          Requires {platform.fields.length} mystical keys for authentication.
        </p>
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-6">
        <AddProjectForm
          initialPlatform={platform.id}
          trigger={
            <button className="group/btn flex items-center gap-2 text-[10px] font-black tracking-widest text-zinc-400 uppercase transition-colors hover:text-amber-500">
              {platform.connected ? 'Add another' : 'Forge connection'}
              <ArrowRight className="size-3 transition-transform group-hover/btn:translate-x-1" />
            </button>
          }
        />
      </div>
    </div>
  );
}
