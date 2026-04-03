'use client';

import { motion } from 'framer-motion';
import { Clock, RefreshCw, Shield } from 'lucide-react';

const BENEFITS = [
  {
    icon: Clock,
    title: '10x Faster DNS Management',
    description:
      'Update records across all platforms in seconds, not hours. No more logging into multiple dashboards or remembering different interfaces.',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
  },
  {
    icon: Shield,
    title: 'Bank-Level Encryption',
    description:
      'Your API credentials are encrypted with AES-256-GCM. We never see your keys in plain text. Your secrets stay secret.',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
  },
  {
    icon: RefreshCw,
    title: 'Real-Time Synchronization',
    description:
      'Changes propagate instantly to each platform. View all your DNS records in one unified table with live updates from every provider.',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
  },
];

export default function BenefitsSection() {
  return (
    <section className="relative overflow-hidden bg-zinc-900/50 px-4 py-24">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <h2 className="mb-4 text-4xl font-bold text-white md:text-5xl">
            Why TheOneDNS?
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-zinc-500">
            Built for developers, DevOps teams, and agencies who manage DNS
            across multiple platforms.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {BENEFITS.map((benefit, idx) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className={`group relative rounded-2xl border ${benefit.borderColor} ${benefit.bgColor} p-8 transition-all duration-300 hover:scale-105`}
            >
              <div
                className={`mb-6 flex h-14 w-14 items-center justify-center rounded-xl ${benefit.bgColor} ${benefit.color}`}
              >
                <benefit.icon size={28} strokeWidth={2} />
              </div>
              <h3 className="mb-4 text-xl font-bold text-white">
                {benefit.title}
              </h3>
              <p className="leading-relaxed text-zinc-400">
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
