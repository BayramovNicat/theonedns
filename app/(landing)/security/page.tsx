import FooterSection from '@/components/FooterSection';
import Link from 'next/link';

export default function SecurityPage() {
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
            The Bastion
          </span>
          <h1 className="mb-8 text-6xl font-black tracking-tighter md:text-8xl">
            <span className="text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
              Security
            </span>
          </h1>
          <div className="mx-auto h-1 w-32 bg-linear-to-r from-transparent via-amber-500/50 to-transparent" />
          <p className="mt-8 text-xl text-zinc-500 font-serif italic">
            &quot;The One Interface is protected by the strongest runes and the most vigilant sentinels.&quot;
          </p>
        </div>

        <div className="prose prose-invert prose-zinc max-w-none space-y-16">
          <section>
            <h2 className="text-3xl font-bold tracking-tight text-white">
              The Master&apos;s Promise
            </h2>
            <p className="text-lg leading-relaxed text-zinc-400">
              In the digital kingdom, security is not merely a feature—it is the
              foundation upon which the throne is built. We understand that
              managing your DNS is a task of supreme importance, and we have
              spared no effort in forging a secure environment for your records.
            </p>
          </section>

          <section>
            <h3 className="mb-6 text-xs font-bold tracking-[0.4em] text-zinc-600 uppercase">
              1. Vaults & Runes (Encryption)
            </h3>
            <p className="text-zinc-400">
              All sensitive scrolls, including API keys and access tokens, are
              cast into our encryption vaults using the AES-256 standard. These
              runes are unbreakable by any conventional means, ensuring that
              your secrets remain yours alone.
            </p>
          </section>

          <section>
            <h3 className="mb-6 text-xs font-bold tracking-[0.4em] text-zinc-600 uppercase">
              2. The Vigilant Sentinels (Monitoring)
            </h3>
            <p className="text-zinc-400">
              Our watchtowers are active solar cycle and night. We monitor all
              access to the master interface, detecting and repelling spectral
              threats in real-time. Any suspicious activity is met with
              immediate defensive maneuvers.
            </p>
          </section>

          <section>
            <h3 className="mb-6 text-xs font-bold tracking-[0.4em] text-zinc-600 uppercase">
              3. Secure Alliances (Integrations)
            </h3>
            <p className="text-zinc-400">
              When communicating with our allies (Cloudflare, Vercel, AWS), we
              use only the most secure diplomatic channels (TLS 1.3). Your
              commands are delivered directly and safely, with no possibility of
              interception by malevolent forces.
            </p>
          </section>

          <section>
            <h3 className="mb-6 text-xs font-bold tracking-[0.4em] text-zinc-600 uppercase">
              4. The Rite of Access (Authentication)
            </h3>
            <p className="text-zinc-400">
              Access to the throne room is guarded by Supabase Auth, a reliable
              system that ensures only those with the proper credentials can
              enter. We support modern authentication rituals to keep your
              account secure.
            </p>
          </section>

          <section className="mt-24 rounded-3xl border border-white/5 bg-white/2 p-12 text-center">
            <h2 className="mb-4 text-2xl font-bold text-white">
              Report a Breach
            </h2>
            <p className="mb-8 text-zinc-500 font-serif italic">
              Should you find a crack in our defenses, notify the Keepers
              immediately.
            </p>
            <a
              href="mailto:security@theonedns.com"
              className="inline-flex items-center justify-center rounded-full border border-amber-500/20 bg-amber-500/5 px-10 py-4 text-xs font-black tracking-widest text-amber-500 uppercase transition-all hover:bg-amber-500/10"
            >
              Contact the Watch
            </a>
          </section>
        </div>
      </div>

      <FooterSection />

      {/* Subtle Grain Overlay */}
      <div className="bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')] pointer-events-none fixed inset-0 z-100 opacity-[0.03]" />
    </div>
  );
}
