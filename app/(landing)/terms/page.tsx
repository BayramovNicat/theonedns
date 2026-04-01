import Link from 'next/link';
import FooterSection from '@/components/FooterSection';

export default function TermsPage() {
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
            The Covenant
          </span>
          <h1 className="mb-8 text-6xl font-black tracking-tighter md:text-8xl">
            <span className="text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
              Terms of Service
            </span>
          </h1>
          <div className="mx-auto h-1 w-32 bg-linear-to-r from-transparent via-amber-500/50 to-transparent" />
          <p className="mt-8 text-xl text-zinc-500 font-serif italic">
            &quot;To rule the DNS, one must abide by the laws of the
            realm.&quot;
          </p>
        </div>

        <div className="prose prose-invert prose-zinc max-w-none space-y-16">
          <section>
            <h2 className="text-3xl font-bold tracking-tight text-white">
              The Agreement
            </h2>
            <p className="text-lg leading-relaxed text-zinc-400">
              By entering the master interface and accessing the powers of
              TheOneDNS, you agree to be bound by this covenant. If you do not
              accept these terms, you must leave the throne room and cease all
              interactions with the portal.
            </p>
          </section>

          <section>
            <h3 className="mb-6 text-xs font-bold tracking-[0.4em] text-zinc-600 uppercase">
              1. Right of Access
            </h3>
            <p className="text-zinc-400">
              We grant you a non-exclusive, non-transferable right to access the
              master interface for the purpose of managing your digital domains.
              You are responsible for maintaining the secrecy of your access
              keys and account rituals.
            </p>
          </section>

          <section>
            <h3 className="mb-6 text-xs font-bold tracking-[0.4em] text-zinc-600 uppercase">
              2. Prohibited Rituals
            </h3>
            <div className="space-y-4 text-zinc-400">
              <p>You shall not use the master interface for:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>Any unlawful or malicious activity.</li>
                <li>Attempts to breach the encryption of other realms.</li>
                <li>Automated harvesting of data without prior treaty.</li>
                <li>Disrupting the stability of the DNS ecosystem.</li>
              </ul>
            </div>
          </section>

          <section>
            <h3 className="mb-6 text-xs font-bold tracking-[0.4em] text-zinc-600 uppercase">
              3. Limitation of Liability
            </h3>
            <p className="text-zinc-400 font-serif italic">
              TheOneDNS is provided &quot;as is,&quot; without warranty of any
              kind. The master interface and its keepers shall not be held
              liable for any loss of data, downtime of your realms, or damages
              arising from your use of the portal. You manage your DNS at your
              own peril.
            </p>
          </section>

          <section>
            <h3 className="mb-6 text-xs font-bold tracking-[0.4em] text-zinc-600 uppercase">
              4. Termination of the Covenant
            </h3>
            <p className="text-zinc-400">
              We reserve the right to banish any user from the master interface
              who violates this covenant. You may terminate your agreement by
              deleting your account and leaving the realm.
            </p>
          </section>

          <section className="mt-24 rounded-3xl border border-white/5 bg-white/2 p-12 text-center">
            <h2 className="mb-4 text-2xl font-bold text-white">
              The Council of Arbitration
            </h2>
            <p className="mb-8 text-zinc-500 font-serif italic">
              Should any dispute arise, it shall be settled by the laws of the
              realm where the master interface is hosted.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full bg-amber-500 px-10 py-4 text-xs font-black tracking-widest text-black uppercase transition-all hover:scale-105 active:scale-95"
            >
              Return to Kingdom
            </Link>
          </section>
        </div>
      </div>

      <FooterSection />

      {/* Subtle Grain Overlay */}
      <div className="bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')] pointer-events-none fixed inset-0 z-100 opacity-[0.03]" />
    </div>
  );
}
