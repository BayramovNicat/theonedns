'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { CtaButton } from '@/components/cta-button';

export default function FooterSection() {
  return (
    <footer className="relative border-t border-white/5 bg-zinc-950 px-4 pt-32 pb-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center">
        {/* Master Key CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mb-24 text-center"
        >
          <p className="mb-8 font-serif text-lg text-zinc-500 italic">
            &quot;One Portal to find them, one Interface to bind them.&quot;
          </p>

          <CtaButton />
        </motion.div>

        {/* Footer Links */}
        <div className="mb-12 grid w-full grid-cols-1 gap-12 border-b border-white/5 pb-12 text-center md:grid-cols-3 md:text-left">
          <div className="md:col-span-1">
            <h3 className="mb-4 bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-2xl font-bold text-transparent">
              TheOneDNS
            </h3>
            <p className="text-sm text-zinc-500">
              The unified DNS control plane for the modern web infrastructure.
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-bold tracking-widest text-white uppercase">
              Resources
            </h4>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li>
                <Link
                  href="/docs"
                  className="transition-colors hover:text-amber-500"
                >
                  Documentation
                </Link>
              </li>
              <li>
                <Link
                  href="/integrations"
                  className="transition-colors hover:text-amber-500"
                >
                  Integrations
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-bold tracking-widest text-white uppercase">
              Company
            </h4>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li>
                <Link
                  href="/about"
                  className="transition-colors hover:text-amber-500"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="transition-colors hover:text-amber-500"
                >
                  Privacy
                </Link>
              </li>
              <li>
                <Link
                  href="/security"
                  className="transition-colors hover:text-amber-500"
                >
                  Security
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex w-full flex-col items-center justify-between gap-4 text-xs font-bold tracking-widest text-zinc-600 uppercase md:flex-row">
          <p>© 2026 TheOneDNS Corporation. Forged in Middle-earth.</p>
          <div className="flex gap-6">
            <Link href="/security" className="hover:text-zinc-400">
              Security
            </Link>
            <Link href="/terms" className="hover:text-zinc-400">
              Terms
            </Link>
            <Link href="/status" className="hover:text-zinc-400">
              Status
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
