import type { Metadata } from 'next';
import Link from 'next/link';
import LandingLayout from '@/components/LandingLayout';

export const metadata: Metadata = {
  title: 'Terms of Service - TheOneDNS',
  description: 'Read the terms and conditions for using TheOneDNS.',
};

export default function TermsPage() {
  return (
    <LandingLayout>
      <div className="mx-auto max-w-4xl px-6 pt-48 pb-24 md:pb-32">
        <div className="mb-16 text-center">
          <span className="mb-4 inline-block text-[10px] font-bold tracking-[0.6em] text-zinc-600 uppercase">
            The Covenant
          </span>
          <h1 className="mb-8 text-6xl font-black tracking-tighter md:text-8xl">
            <span className="text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
              Terms of Service
            </span>
          </h1>
          <div className="mx-auto h-1 w-32 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
          <p className="mt-8 font-serif text-xl text-zinc-500 italic">
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
            <p className="font-serif text-zinc-400 italic">
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
            <p className="mb-8 font-serif text-zinc-500 italic">
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
    </LandingLayout>
  );
}
