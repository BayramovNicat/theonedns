import Link from 'next/link';
import FooterSection from '@/components/FooterSection';

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
    <div className="relative min-h-screen overflow-x-hidden bg-zinc-950 text-white selection:bg-amber-500/30 selection:text-amber-200 font-sans">
      {/* Simple Header */}
      <header className="absolute top-0 left-0 right-0 z-50 border-b border-white/5 bg-transparent px-4 py-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="bg-linear-to-r from-amber-400 to-amber-600 bg-clip-text text-xl font-black text-transparent">
              TheOneDNS
            </span>
          </Link>
          <nav className="flex items-center gap-8">
            <Link
              href="/docs"
              className="text-[10px] font-bold tracking-[0.3em] text-zinc-500 uppercase transition-colors hover:text-amber-500"
            >
              Archives
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-amber-500/20 bg-amber-500/5 px-6 py-2 text-[10px] font-bold tracking-[0.2em] text-amber-500 uppercase transition-all hover:bg-amber-500/10"
            >
              Enter Throne
            </Link>
          </nav>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-4xl px-6 pt-48 pb-24 md:pb-32">
        <div className="mb-16 text-center">
          <span className="mb-4 inline-block text-[10px] font-bold tracking-[0.6em] text-zinc-600 uppercase">
            The Watchtower
          </span>
          <h1 className="mb-8 text-6xl font-black tracking-tighter md:text-8xl">
            <span className="text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
              System Status
            </span>
          </h1>
          <div className="mx-auto h-1 w-32 bg-linear-to-r from-transparent via-amber-500/50 to-transparent" />
          <p className="mt-8 text-xl text-zinc-500 font-serif italic">
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
              <div className="relative border-l border-white/5 pl-8 pb-8">
                <div className="absolute top-0 -left-1 h-2 w-2 rounded-full bg-zinc-700" />
                <h3 className="text-sm font-bold text-zinc-300">
                  Solar Cycle 1, 2026
                </h3>
                <p className="mt-2 text-sm text-zinc-500 font-serif italic">
                  No incidents reported. The master interface remained stable
                  through the seasonal transition.
                </p>
              </div>
              <div className="relative border-l border-white/5 pl-8 pb-8">
                <div className="absolute top-0 -left-1 h-2 w-2 rounded-full bg-zinc-700" />
                <h3 className="text-sm font-bold text-zinc-300">
                  Solar Cycle 365, 2025
                </h3>
                <p className="mt-2 text-sm text-zinc-500 font-serif italic">
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
            <p className="mb-8 text-zinc-500 font-serif italic">
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

      <FooterSection />

      {/* Subtle Grain Overlay */}
      <div className="bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')] pointer-events-none fixed inset-0 z-100 opacity-[0.03]" />
    </div>
  );
}
