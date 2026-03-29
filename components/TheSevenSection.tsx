'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Check, Loader2, RefreshCw } from 'lucide-react';
import { useState } from 'react';

const SEVEN = [
  {
    name: 'DigitalOcean',
    desc: 'The foundation for many digital halls',
    grid: 'md:col-span-2 md:row-span-1',
    ping: 24,
    records: 8,
  },
  {
    name: 'Hetzner',
    desc: 'Deeply rooted in bare-metal performance',
    grid: 'md:col-span-1 md:row-span-1',
    ping: 18,
    records: 3,
  },
  {
    name: 'Google Cloud',
    desc: 'A vast, ancient power',
    grid: 'md:col-span-1 md:row-span-2',
    ping: 12,
    records: 14,
  },
  {
    name: 'AWS Route 53',
    desc: 'Immense power, high-tier servant',
    grid: 'md:col-span-2 md:row-span-1',
    ping: 16,
    records: 22,
  },
  {
    name: 'Vultr',
    desc: 'High-performance infrastructure',
    grid: 'md:col-span-1 md:row-span-1',
    ping: 31,
    records: 5,
  },
  {
    name: 'Akamai',
    desc: 'A legendary name in hosting',
    grid: 'md:col-span-1 md:row-span-1',
    ping: 22,
    records: 6,
  },
  {
    name: 'OVHcloud',
    desc: 'Sprawling network of northern data centers',
    grid: 'md:col-span-2 md:row-span-1',
    ping: 35,
    records: 11,
  },
];

function BentoCard({ item, idx }: { item: (typeof SEVEN)[0]; idx: number }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const handleSync = () => {
    setStatus('loading');
    setTimeout(
      () => {
        setStatus('success');
        setTimeout(() => setStatus('idle'), 4000);
      },
      1200 + Math.random() * 800,
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: idx * 0.05 }}
      className={`group relative flex flex-col justify-between rounded-3xl border border-white/5 bg-zinc-900/50 p-6 backdrop-blur-sm transition-all duration-300 hover:bg-zinc-800/50 ${item.grid}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-zinc-500 transition-colors group-hover:text-amber-500">
          <span className="font-serif text-lg italic">{idx + 1}</span>
        </div>
        <button
          type="button"
          onClick={handleSync}
          disabled={status === 'loading'}
          className="relative flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 transition-all hover:bg-white/10 active:scale-95 disabled:opacity-50"
        >
          <AnimatePresence mode="wait">
            {status === 'idle' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 90 }}
                className="flex items-center gap-2"
              >
                <RefreshCw size={14} className="text-zinc-400" />
                <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                  Sync
                </span>
              </motion.div>
            )}
            {status === 'loading' && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Loader2 size={14} className="animate-spin text-amber-500" />
              </motion.div>
            )}
            {status === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative flex items-center gap-2"
              >
                <Check size={14} className="text-emerald-500" />
                <span className="text-[10px] font-bold tracking-widest text-emerald-500 uppercase">
                  {item.ping}ms
                </span>
                <motion.div
                  initial={{ opacity: 0.8, scale: 1 }}
                  animate={{ opacity: 0, scale: 2 }}
                  className="absolute inset-0 rounded-full bg-emerald-500"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </div>

      <div>
        <h3 className="mb-2 text-xl leading-tight font-bold text-white">
          {item.name}
        </h3>
        <p className="text-sm leading-relaxed text-zinc-500">{item.desc}</p>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div
            className={`h-1.5 w-1.5 rounded-full transition-colors ${status === 'success' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-zinc-700'}`}
          />
          <span className="text-[10px] font-bold tracking-[0.2em] text-zinc-600 uppercase">
            {status === 'success' ? 'Connected' : 'Standby'}
          </span>
        </div>
        <AnimatePresence>
          {status === 'success' && (
            <motion.span
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="font-mono text-[10px] text-zinc-500"
            >
              {item.records} records
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function TheSevenSection() {
  return (
    <section className="bg-zinc-950/50 px-4 py-24">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <h2 className="mb-4 text-4xl font-bold text-white md:text-5xl">
            The Seven: The Heavy-Lifters
          </h2>
          <p className="mx-auto max-w-xl text-zinc-500">
            Infrastructure titans forging the backbone of the digital realm.
          </p>
        </motion.div>

        <div className="grid auto-rows-[220px] grid-cols-1 gap-4 md:grid-cols-4">
          {SEVEN.map((item, idx) => (
            <BentoCard key={item.name} item={item} idx={idx} />
          ))}
        </div>
      </div>
    </section>
  );
}
