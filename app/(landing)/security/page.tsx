import type { Metadata } from 'next';
import LandingLayout from '@/components/LandingLayout';

export const metadata: Metadata = {
  title: 'Security - TheOneDNS',
  description:
    'Learn about TheOneDNS security practices and how we protect your DNS infrastructure.',
};

export default function SecurityPage() {
  return (
    <LandingLayout>
      <div className="mx-auto max-w-4xl px-6 pt-48 pb-24 md:pb-32">
        <div className="mb-16 text-center">
          <span className="mb-4 inline-block text-[10px] font-bold tracking-[0.6em] text-zinc-600 uppercase">
            The Bastion
          </span>
          <h1 className="mb-8 text-6xl font-black tracking-tighter md:text-8xl">
            <span className="text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
              Security
            </span>
          </h1>
          <div className="mx-auto h-1 w-32 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
          <p className="mt-8 font-serif text-xl text-zinc-500 italic">
            &quot;The One Interface is protected by the strongest runes and the
            most vigilant sentinels.&quot;
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
            <p className="mb-8 font-serif text-zinc-500 italic">
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
    </LandingLayout>
  );
}
