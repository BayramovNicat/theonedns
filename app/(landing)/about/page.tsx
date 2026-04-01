import FooterSection from '@/components/FooterSection';
import Link from 'next/link';

export default function AboutPage() {
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
        <div className="mb-16">
          <span className="mb-4 inline-block text-[10px] font-bold tracking-[0.6em] text-zinc-600 uppercase">
            The Legend
          </span>
          <h1 className="mb-8 text-6xl font-black tracking-tighter md:text-8xl">
            <span className="text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
              About Us
            </span>
          </h1>
          <div className="h-1 w-32 bg-linear-to-r from-amber-500/50 to-transparent" />
        </div>

        <div className="space-y-24">
          <section>
            <h2 className="mb-8 text-3xl font-bold tracking-tight text-white">
              The Forging of the One Interface
            </h2>
            <div className="space-y-6 text-xl leading-relaxed text-zinc-400 font-serif italic">
              <p>
                In the age of the fragmented web, developers were forced to wander through
                dozens of dashboards, each with its own rituals and complexities.
                The builders were weary, their spirits dampened by the endless cycle
                of logging in and out, searching for records scattered across the
                digital realms.
              </p>
              <p>
                From this chaos, TheOneDNS was forged. A single interface, a master
                control plane designed to bind the disparate DNS providers into a
                unified whole.
              </p>
            </div>
          </section>

          <section className="grid gap-12 md:grid-cols-2">
            <div>
              <h3 className="mb-4 text-xs font-bold tracking-[0.4em] text-zinc-600 uppercase">
                Our Mission
              </h3>
              <p className="text-zinc-400">
                To simplify the management of modern web infrastructure. We believe
                that developers should spend their time building the future, not
                wrestling with the configuration of the past.
              </p>
            </div>
            <div>
              <h3 className="mb-4 text-xs font-bold tracking-[0.4em] text-zinc-600 uppercase">
                Our Vision
              </h3>
              <p className="text-zinc-400">
                A world where DNS management is as seamless as writing code. A
                transparent, secure, and unified portal that empowers architects
                to rule their digital domains with ease.
              </p>
            </div>
          </section>

          <section>
            <h2 className="mb-8 text-xs font-bold tracking-[0.4em] text-zinc-600 uppercase">
              The Keepers of the Keys
            </h2>
            <p className="mb-8 text-zinc-400">
              TheOneDNS is maintained by a small council of engineers and designers
              dedicated to the craft of infrastructure tools. We are builders
              who faced the same problems you face, and decided to forge a solution.
            </p>
            <div className="rounded-2xl border border-white/5 bg-white/2 p-8">
              <p className="text-sm text-zinc-500 italic">
                &quot;We don&apos;t just build tools; we forge the foundations of the
                modern web. Every line of code is a rune, every integration a
                treaty signed in the pursuit of a faster, more reliable
                internet.&quot;
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-white">
              Join the Fellowship
            </h2>
            <p className="mb-8 text-zinc-400 font-serif italic">
              Experience the power of a unified DNS control plane.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-full bg-amber-500 px-10 py-4 text-xs font-black tracking-widest text-black uppercase transition-all hover:scale-105 active:scale-95"
            >
              Claim Your Throne
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
