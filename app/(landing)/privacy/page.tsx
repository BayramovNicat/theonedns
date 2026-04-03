import type { Metadata } from 'next';
import LandingLayout from '@/components/LandingLayout';

export const metadata: Metadata = {
  title: 'Privacy Policy - TheOneDNS',
  description:
    'Learn how TheOneDNS protects your data and respects your privacy.',
};

export default function PrivacyPage() {
  return (
    <LandingLayout>
      <div className="mx-auto max-w-4xl px-6 pt-48 pb-24 md:pb-32">
        <div className="mb-16 text-center">
          <span className="mb-4 inline-block text-[10px] font-bold tracking-[0.6em] text-zinc-600 uppercase">
            The Master&apos;s Decree
          </span>
          <h1 className="mb-8 text-6xl font-black tracking-tighter md:text-8xl">
            <span className="text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
              Privacy Policy
            </span>
          </h1>
          <div className="mx-auto h-1 w-32 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
          <p className="mt-8 font-serif text-xl text-zinc-500 italic">
            &quot;Secrets must be kept secret, even from those who seek the One
            Interface.&quot;
          </p>
        </div>

        <div className="prose prose-invert prose-zinc max-w-none space-y-16">
          <section>
            <h2 className="text-3xl font-bold tracking-tight text-white">
              The Realm of Privacy
            </h2>
            <p className="text-lg leading-relaxed text-zinc-400">
              At TheOneDNS, we believe your data is your own realm. We do not
              sell, trade, or lease your DNS configurations to any dark lord or
              commercial entity. This decree outlines how we handle the scrolls
              of information you entrust to us.
            </p>
          </section>

          <section>
            <h3 className="mb-6 text-xs font-bold tracking-[0.4em] text-zinc-600 uppercase">
              1. Information We Gather
            </h3>
            <div className="space-y-4 text-zinc-400">
              <p>
                To provide the master interface, we must collect certain pieces
                of information:
              </p>
              <ul className="list-disc space-y-2 pl-6">
                <li>
                  <strong className="text-amber-500/80">
                    Account Details:
                  </strong>
                  Your email address and name to identify you in the throne
                  room.
                </li>
                <li>
                  <strong className="text-amber-500/80">
                    Integration Keys:
                  </strong>
                  API keys and tokens for your DNS providers. These are forged
                  in the fires of encryption and never stored in plain text.
                </li>
                <li>
                  <strong className="text-amber-500/80">Usage Sigils:</strong>
                  Metadata about how you interact with the dashboard to help us
                  improve the portal.
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h3 className="mb-6 text-xs font-bold tracking-[0.4em] text-zinc-600 uppercase">
              2. How Your Data is Shielded
            </h3>
            <p className="text-zinc-400">
              All sensitive scrolls (API keys, secrets) are encrypted using
              industry-standard runes (AES-256). Only the master interface,
              acting on your behalf, can decrypt these to communicate with your
              chosen providers.
            </p>
          </section>

          <section>
            <h3 className="mb-6 text-xs font-bold tracking-[0.4em] text-zinc-600 uppercase">
              3. The Third-Party Alliances
            </h3>
            <p className="text-zinc-400">
              We only share information with third parties (like Cloudflare,
              Vercel, or AWS) at your explicit command to manage your DNS
              records. We do not permit them to use your data for any other
              purpose than fulfilling your requests.
            </p>
          </section>

          <section>
            <h3 className="mb-6 text-xs font-bold tracking-[0.4em] text-zinc-600 uppercase">
              4. Your Sovereignty
            </h3>
            <p className="text-zinc-400">
              You retain full sovereignty over your data. You may request the
              deletion of your account and all associated scrolls at any time.
              Once deleted, the records are cast into the void and cannot be
              recovered.
            </p>
          </section>

          <section className="mt-24 rounded-3xl border border-white/5 bg-white/2 p-12 text-center">
            <h2 className="mb-4 text-2xl font-bold text-white">
              Questions of the Decree?
            </h2>
            <p className="mb-8 font-serif text-zinc-500 italic">
              Should you have questions about your privacy, contact the Keepers
              of the Keys.
            </p>
            <a
              href="mailto:privacy@theonedns.com"
              className="inline-flex items-center justify-center rounded-full border border-amber-500/20 bg-amber-500/5 px-10 py-4 text-xs font-black tracking-widest text-amber-500 uppercase transition-all hover:bg-amber-500/10"
            >
              Contact the Keepers
            </a>
          </section>
        </div>
      </div>
    </LandingLayout>
  );
}
