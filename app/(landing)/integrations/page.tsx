import type { Metadata } from 'next';
import { IntegrationsMarketingClient } from '@/components/integrations-marketing-client';
import LandingLayout from '@/components/LandingLayout';

export const metadata: Metadata = {
  title: 'Integrations - TheOneDNS',
  description:
    'Connect TheOneDNS with Cloudflare, Vercel, AWS Route53, and 15+ other DNS providers.',
};

export default function IntegrationsLandingPage() {
  return (
    <LandingLayout>
      <div className="mx-auto max-w-7xl px-6 pt-48 pb-24 md:pb-32">
        <div className="mb-24 text-center">
          <span className="mb-4 inline-block text-[10px] font-bold tracking-[0.6em] text-zinc-600 uppercase">
            The Digital Pantheon
          </span>
          <h1 className="mb-8 text-6xl font-black tracking-tighter md:text-8xl">
            <span className="text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
              Alliances &
            </span>{' '}
            <span className="bg-gradient-to-b from-amber-200 via-amber-400 to-amber-700 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(251,191,36,0.3)]">
              Integrations
            </span>
          </h1>
          <div className="mx-auto h-1 w-32 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
          <p className="mx-auto mt-8 max-w-2xl font-serif text-xl text-zinc-500 italic">
            &quot;One portal to bind every provider, from the cloud giants to
            the high realms of domain registry.&quot;
          </p>
        </div>

        <IntegrationsMarketingClient />

        <section className="mt-48 rounded-3xl border border-amber-500/20 bg-amber-500/5 p-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white">
            Don&apos;t see your realm?
          </h2>
          <p className="mb-8 font-serif text-zinc-400 italic">
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
    </LandingLayout>
  );
}
