'use client';

import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
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
        <div className="mb-12 grid w-full grid-cols-1 gap-12 border-b border-white/5 pb-12 text-center md:grid-cols-4 md:text-left">
          <div className="md:col-span-1">
            <h3 className="mb-4 bg-linear-to-r from-amber-400 to-amber-600 bg-clip-text text-2xl font-bold text-transparent">
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
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-bold tracking-widest text-white uppercase">
              Connect
            </h4>
            <div className="flex justify-center gap-4 text-zinc-500 md:justify-start">
              <a
                href="/"
                aria-label="X (Twitter)"
                className="transition-colors hover:text-white"
              >
                <svg
                  aria-hidden="true"
                  role="img"
                  viewBox="0 0 24 24"
                  className="h-5 w-5 fill-current"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="/"
                aria-label="GitHub"
                className="transition-colors hover:text-white"
              >
                <svg
                  aria-hidden="true"
                  role="img"
                  viewBox="0 0 24 24"
                  className="h-5 w-5 fill-current"
                >
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
              </a>
              <a
                href="/"
                aria-label="Email"
                className="transition-colors hover:text-white"
              >
                <Mail aria-hidden="true" size={20} />
              </a>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col items-center justify-between gap-4 text-xs font-bold tracking-widest text-zinc-600 uppercase md:flex-row">
          <p>© 2026 TheOneDNS Corporation. Forged in Middle-earth.</p>
          <div className="flex gap-6">
            <Link href="/" className="hover:text-zinc-400">
              Security
            </Link>
            <Link href="/" className="hover:text-zinc-400">
              Terms
            </Link>
            <Link href="/" className="hover:text-zinc-400">
              Status
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
