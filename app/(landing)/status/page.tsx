import type { Metadata } from 'next';
import LandingLayout from '@/components/LandingLayout';

export const metadata: Metadata = {
  title: 'System Status - TheOneDNS',
  description:
    'Check the current operational status of TheOneDNS and all integrated services.',
};

export default function StatusPage() {
  const realms = [
    { name: 'The Master Interface', status: 'Operational', uptime: '100%' },
    { name: 'Cloudflare Alliance', status: 'Operational', uptime: '99.99%' },
    { name: 'Vercel Citadel', status: 'Operational', uptime: '100%' },
    { name: 'AWS Route53 Bastion', status: 'Operational', uptime: '99.99%' },
    { name: 'DigitalOcean Port', status: 'Operational', uptime: '100%' },
    { name: 'Encryption Vaults', status: 'Operational', uptime: '100%' },
  ];

  return (
    <LandingLayout>
      <div className="mx-auto max-w-4xl px-6 pt-48 pb-24 md:pb-32">
        <div className="mb-16 text-center">
          <span className="mb-4 inline-block text-[10px] font-bold tracking-[0.6em] text-zinc-600 uppercase">
            The Watchtower
          </span>
          <h1 className="mb-8 text-6xl font-black tracking-tighter md:text-8xl">
            <span className="text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
              System Status
            </span>
          </h1>
          <div className="mx-auto h-1 w-32 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
          <p className="mt-8 font-serif text-xl text-zinc-500 italic">
            &quot;All is calm in the digital kingdom. The fires of the servers
            burn steady.&quot;
          </p>
        </div>

        <div className="space-y-24">
          <section>
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-xs font-bold tracking-[0.4em] text-zinc-600 uppercase">
                Current State of the Realms
              </h2>
              <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold text-emerald-500 uppercase">
                  All Systems Operational
                </span>
              </div>
            </div>

            <div className="grid gap-4">
              {realms.map((realm) => (
                <div
                  key={realm.name}
                  className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/2 p-6 transition-colors hover:bg-white/5"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white">
                      {realm.name}
                    </span>
                    <span className="text-xs text-zinc-500">
                      Uptime over the last 90 solar cycles: {realm.uptime}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-500 uppercase">
                    {realm.status}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-8 text-xs font-bold tracking-[0.4em] text-zinc-600 uppercase">
              Incident History
            </h2>
            <div className="space-y-8">
              <div className="relative border-l border-white/5 pb-8 pl-8">
                <div className="absolute top-0 -left-1 h-2 w-2 rounded-full bg-zinc-700" />
                <h3 className="text-sm font-bold text-zinc-300">
                  Solar Cycle 1, 2026
                </h3>
                <p className="mt-2 font-serif text-sm text-zinc-500 italic">
                  No incidents reported. The master interface remained stable
                  through the seasonal transition.
                </p>
              </div>
              <div className="relative border-l border-white/5 pb-8 pl-8">
                <div className="absolute top-0 -left-1 h-2 w-2 rounded-full bg-zinc-700" />
                <h3 className="text-sm font-bold text-zinc-300">
                  Solar Cycle 365, 2025
                </h3>
                <p className="mt-2 font-serif text-sm text-zinc-500 italic">
                  End of year maintenance completed. The encryption vaults were
                  reinforced against spectral threats.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-white/5 bg-white/2 p-12 text-center">
            <h2 className="mb-4 text-2xl font-bold text-white">
              Stay Informed
            </h2>
            <p className="mb-8 font-serif text-zinc-500 italic">
              Subscribe to the archives to receive alerts should a storm
              approach the digital shores.
            </p>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full border border-zinc-700 bg-transparent px-10 py-4 text-xs font-black tracking-widest text-zinc-300 uppercase transition-all hover:border-amber-500/50 hover:text-amber-500"
            >
              Subscribe to Scrolls
            </button>
          </section>
        </div>
      </div>
    </LandingLayout>
  );
}
