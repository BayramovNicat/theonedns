import Link from 'next/link';
import FooterSection from '@/components/FooterSection';
import { IntegrationsMarketingClient } from '@/components/integrations-marketing-client';

export default function IntegrationsLandingPage() {
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

      <div className="relative z-10 mx-auto max-w-7xl px-6 pt-48 pb-24 md:pb-32">
        <div className="mb-24 text-center">
          <span className="mb-4 inline-block text-[10px] font-bold tracking-[0.6em] text-zinc-600 uppercase">
            The Digital Pantheon
          </span>
          <h1 className="mb-8 text-6xl font-black tracking-tighter md:text-8xl">
            <span className="text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
              Alliances &
            </span>{' '}
            <span className="bg-linear-to-b from-amber-200 via-amber-400 to-amber-700 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(251,191,36,0.3)]">
              Integrations
            </span>
          </h1>
          <div className="mx-auto h-1 w-32 bg-linear-to-r from-transparent via-amber-500/50 to-transparent" />
          <p className="mx-auto mt-8 max-w-2xl text-xl text-zinc-500 font-serif italic">
            &quot;One portal to bind every provider, from the cloud giants to
            the high realms of domain registry.&quot;
          </p>
        </div>

        <IntegrationsMarketingClient />

        <section className="mt-48 rounded-3xl border border-amber-500/20 bg-amber-500/5 p-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white">
            Don&apos;t see your realm?
          </h2>
          <p className="mb-8 text-zinc-400 font-serif italic">
            We are constantly forging new treaties. Contact the keepers to
            request a native integration.
          </p>
          <a
            href="mailto:council@theonedns.com"
            className="inline-flex items-center justify-center rounded-full bg-amber-500 px-10 py-4 text-xs font-black tracking-widest text-black uppercase transition-all hover:scale-105 active:scale-95"
          >
            Request Integration
          </a>
        </section>
      </div>

      <FooterSection />

      {/* Subtle Grain Overlay */}
      <div className="bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')] pointer-events-none fixed inset-0 z-100 opacity-[0.03]" />
    </div>
  );
}
