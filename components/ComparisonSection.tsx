'use client';

import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

const BEFORE_ITEMS = [
  'Log into 5+ different dashboards',
  'Remember multiple passwords/API keys',
  'Copy-paste DNS records between platforms',
  'Risk of configuration errors',
  '30+ minutes to update records across platforms',
  'No unified view of all DNS records',
];

const AFTER_ITEMS = [
  'One unified dashboard',
  'Encrypted credential storage',
  'Bulk edit across all platforms',
  'Validation & error prevention',
  '2 minutes to update everywhere',
  'Real-time sync with live status',
];

export default function ComparisonSection() {
  return (
    <section className="relative overflow-hidden bg-zinc-950 px-4 py-24">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <h2 className="mb-4 text-4xl font-bold text-white md:text-5xl">
            Before & After TheOneDNS
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-zinc-500">
            See how TheOneDNS transforms your DNS management workflow.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Before Column */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8"
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10">
                <X size={24} className="text-red-400" strokeWidth={2.5} />
              </div>
              <h3 className="text-2xl font-bold text-white">
                Before TheOneDNS
              </h3>
            </div>
            <ul className="space-y-4">
              {BEFORE_ITEMS.map((item, idx) => (
                <motion.li
                  key={item}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 + idx * 0.05 }}
                  className="flex items-start gap-3"
                >
                  <X
                    size={20}
                    className="mt-0.5 shrink-0 text-red-400"
                    strokeWidth={2}
                  />
                  <span className="text-zinc-400">{item}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* After Column */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8"
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
                <Check
                  size={24}
                  className="text-emerald-400"
                  strokeWidth={2.5}
                />
              </div>
              <h3 className="text-2xl font-bold text-white">After TheOneDNS</h3>
            </div>
            <ul className="space-y-4">
              {AFTER_ITEMS.map((item, idx) => (
                <motion.li
                  key={item}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + idx * 0.05 }}
                  className="flex items-start gap-3"
                >
                  <Check
                    size={20}
                    className="mt-0.5 shrink-0 text-emerald-400"
                    strokeWidth={2}
                  />
                  <span className="text-zinc-300">{item}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Stats Highlight */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-4 rounded-full border border-amber-500/20 bg-amber-500/5 px-8 py-4">
            <span className="text-3xl font-black text-amber-500">15x</span>
            <span className="text-sm text-zinc-400">
              Faster DNS management workflow
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
