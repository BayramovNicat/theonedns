import type { Metadata } from 'next';
import Link from 'next/link';
import LandingLayout from '@/components/LandingLayout';

export const metadata: Metadata = {
  title: 'Documentation - TheOneDNS',
  description:
    'Learn how to use TheOneDNS to manage DNS records across multiple providers from a single interface.',
};

export default function DocsPage() {
  const providers = [
    'Cloudflare',
    'Vercel',
    'AWS Route53',
    'DigitalOcean',
    'Netlify',
    'Linode',
    'Hetzner',
    'Namecheap',
    'Bunny DNS',
    'GoDaddy',
    'Gandi',
    'OVHcloud',
    'Porkbun',
    'Dynadot',
    'Google Cloud',
  ];

  return (
    <LandingLayout>
      <div className="mx-auto max-w-4xl px-6 pt-48 pb-24 md:pb-32">
        <div className="mb-16">
          <span className="mb-4 inline-block text-[10px] font-bold tracking-[0.6em] text-zinc-600 uppercase">
            The Archives
          </span>
          <h1 className="mb-8 text-6xl font-black tracking-tighter md:text-8xl">
            <span className="text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
              Documentation
            </span>
          </h1>
          <div className="h-1 w-32 bg-gradient-to-r from-amber-500/50 to-transparent" />
        </div>

        <div className="space-y-24">
          <section>
            <h2 className="mb-8 text-3xl font-bold tracking-tight text-white">
              One Interface to Rule Them All
            </h2>
            <p className="font-serif text-xl leading-relaxed text-zinc-400 italic">
              Stop logging into twenty different dashboards. TheOneDNS is the
              master web portal forged to manage all your DNS records from a
              single throne.
            </p>
          </section>

          <section>
            <h2 className="mb-8 text-xs font-bold tracking-[0.4em] text-zinc-600 uppercase">
              Quick Start
            </h2>
            <div className="grid gap-6">
              <div className="rounded-2xl border border-white/5 bg-white/2 p-8 transition-colors hover:bg-white/5">
                <h3 className="mb-3 text-xl font-bold text-amber-400">
                  1. Connect Your Realm
                </h3>
                <p className="text-zinc-500">
                  Head over to the integrations page to connect your DNS
                  providers. We use secure API keys stored in your browser or
                  our encrypted vaults.
                </p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-white/2 p-8 transition-colors hover:bg-white/5">
                <h3 className="mb-3 text-xl font-bold text-amber-400">
                  2. Import Projects
                </h3>
                <p className="text-zinc-500">
                  Once connected, you can import your existing projects or
                  create new ones. TheOneDNS will automatically sync your
                  records across the digital pantheon.
                </p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-white/2 p-8 transition-colors hover:bg-white/5">
                <h3 className="mb-3 text-xl font-bold text-amber-400">
                  3. Audit & Monitor
                </h3>
                <p className="text-zinc-500">
                  Run DNS audits to ensure your records are configured
                  optimally. Monitor propagation across the globe in real-time.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-8 text-xs font-bold tracking-[0.4em] text-zinc-600 uppercase">
              Supported Platforms
            </h2>
            <p className="mb-10 text-zinc-400">
              We have forged alliances with the major powers of the digital
              world, supporting native integrations with:
            </p>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {providers.map((provider) => (
                <div
                  key={provider}
                  className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/2 px-4 py-3 text-sm font-medium text-zinc-400 transition-colors hover:border-white/10 hover:text-zinc-200"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-500/50" />
                  {provider}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-white">
              Ready to take the throne?
            </h2>
            <p className="mb-8 font-serif text-zinc-400 italic">
              Join the thousands of architects managing their DNS empires with
              TheOneDNS.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-full bg-amber-500 px-10 py-4 text-xs font-black tracking-widest text-black uppercase transition-all hover:scale-105 active:scale-95"
            >
              Get Started Free
            </Link>
          </section>
        </div>
      </div>
    </LandingLayout>
  );
}
