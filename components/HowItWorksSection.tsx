'use client';

import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Link2, Zap } from 'lucide-react';

const STEPS = [
  {
    number: '01',
    icon: Link2,
    title: 'Connect Your Platforms',
    description:
      'Add your API credentials from Cloudflare, Vercel, AWS, and more. All credentials are encrypted with AES-256-GCM and stored securely.',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
  },
  {
    number: '02',
    icon: Zap,
    title: 'Manage All DNS Records',
    description:
      'View and edit records across all platforms in one unified table. No more switching between dashboards or remembering different interfaces.',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
  },
  {
    number: '03',
    icon: CheckCircle2,
    title: 'Changes Sync Instantly',
    description:
      'Updates propagate to each platform in real-time. Watch your DNS records sync across all providers with live status updates.',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
  },
];

export default function HowItWorksSection() {
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
            How It Works
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-zinc-500">
            Get started in minutes. No complex setup or configuration required.
          </p>
        </motion.div>

        <div className="relative">
          {/* Connection Lines */}
          <div className="absolute top-1/2 right-0 left-0 hidden h-0.5 -translate-y-1/2 bg-gradient-to-r from-blue-500/20 via-amber-500/20 to-emerald-500/20 md:block" />

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {STEPS.map((step, idx) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2 }}
                className="relative"
              >
                <div
                  className={`relative rounded-2xl border ${step.borderColor} ${step.bgColor} p-8 transition-all duration-300 hover:scale-105`}
                >
                  {/* Step Number */}
                  <div className="mb-6 flex items-center justify-between">
                    <span className="font-mono text-5xl font-black text-white/10">
                      {step.number}
                    </span>
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-xl ${step.bgColor} ${step.color}`}
                    >
                      <step.icon size={28} strokeWidth={2} />
                    </div>
                  </div>

                  <h3 className="mb-4 text-xl font-bold text-white">
                    {step.title}
                  </h3>
                  <p className="leading-relaxed text-zinc-400">
                    {step.description}
                  </p>
                </div>

                {/* Arrow between steps */}
                {idx < STEPS.length - 1 && (
                  <div className="absolute top-1/2 -right-4 z-10 hidden -translate-y-1/2 md:block">
                    <ArrowRight
                      size={24}
                      className="text-zinc-700"
                      strokeWidth={2}
                    />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
