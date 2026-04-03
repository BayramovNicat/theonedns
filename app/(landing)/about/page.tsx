import type { Metadata } from 'next';
import Link from 'next/link';
import LandingLayout from '@/components/LandingLayout';

export const metadata: Metadata = {
  title: 'About Us - TheOneDNS',
  description:
    'Learn about TheOneDNS, the unified DNS management platform that simplifies infrastructure for developers.',
};

export default function AboutPage() {
  return (
    <LandingLayout>
      <div className="mx-auto max-w-4xl px-6 pt-48 pb-24 md:pb-32">
        <div className="mb-16">
          <span className="mb-4 inline-block text-[10px] font-bold tracking-[0.6em] text-zinc-600 uppercase">
            The Legend
          </span>
          <h1 className="mb-8 text-6xl font-black tracking-tighter md:text-8xl">
            <span className="text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
              About Us
            </span>
          </h1>
          <div className="h-1 w-32 bg-gradient-to-r from-amber-500/50 to-transparent" />
        </div>

        <div className="space-y-24">
          <section>
            <h2 className="mb-8 text-3xl font-bold tracking-tight text-white">
              The Forging of the One Interface
            </h2>
            <div className="space-y-6 font-serif text-xl leading-relaxed text-zinc-400 italic">
              <p>
                In the age of the fragmented web, developers were forced to
                wander through dozens of dashboards, each with its own rituals
                and complexities. The builders were weary, their spirits
                dampened by the endless cycle of logging in and out, searching
                for records scattered across the digital realms.
              </p>
              <p>
                From this chaos, TheOneDNS was forged. A single interface, a
                master control plane designed to bind the disparate DNS
                providers into a unified whole.
              </p>
            </div>
          </section>

          <section className="grid gap-12 md:grid-cols-2">
            <div>
              <h3 className="mb-4 text-xs font-bold tracking-[0.4em] text-zinc-600 uppercase">
                Our Mission
              </h3>
              <p className="text-zinc-400">
                To simplify the management of modern web infrastructure. We
                believe that developers should spend their time building the
                future, not wrestling with the configuration of the past.
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
              TheOneDNS is maintained by a small council of engineers and
              designers dedicated to the craft of infrastructure tools. We are
              builders who faced the same problems you face, and decided to
              forge a solution.
            </p>
            <div className="rounded-2xl border border-white/5 bg-white/2 p-8">
              <p className="text-sm text-zinc-500 italic">
                &quot;We don&apos;t just build tools; we forge the foundations
                of the modern web. Every line of code is a rune, every
                integration a treaty signed in the pursuit of a faster, more
                reliable internet.&quot;
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-white">
              Join the Fellowship
            </h2>
            <p className="mb-8 font-serif text-zinc-400 italic">
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
    </LandingLayout>
  );
}
