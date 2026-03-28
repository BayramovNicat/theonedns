"use client";

import { useState, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
} from "framer-motion";
import { CtaButton } from "@/components/cta-button";

const MOCK_RECORDS = [
  {
    id: 1,
    type: "A",
    name: "@",
    content: "76.76.21.21",
    platform: "Vercel",
    ttl: "3600",
  },
  {
    id: 2,
    type: "CNAME",
    name: "www",
    content: "cname.vercel-dns.com",
    platform: "Vercel",
    ttl: "3600",
  },
  {
    id: 3,
    type: "A",
    name: "api",
    content: "1.1.1.1",
    platform: "Cloudflare",
    ttl: "Auto",
  },
  {
    id: 4,
    type: "MX",
    name: "@",
    content: "mail.protonmail.ch",
    platform: "Cloudflare",
    ttl: "Auto",
  },
  {
    id: 5,
    type: "TXT",
    name: "_vercel",
    content: "vc-domain-verify=...",
    platform: "Vercel",
    ttl: "60",
  },
  {
    id: 6,
    type: "NS",
    name: "@",
    content: "ns1.route53.aws.com",
    platform: "AWS",
    ttl: "172800",
  },
  {
    id: 7,
    type: "AAAA",
    name: "ipv6",
    content: "2606:4700:4700::1111",
    platform: "Cloudflare",
    ttl: "Auto",
  },
];

export default function HeroSection() {
  const [filter, setFilter] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const mockupY = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, -50]);

  const filteredRecords = filter
    ? MOCK_RECORDS.filter((r) => r.platform === filter)
    : MOCK_RECORDS;

  const platforms = ["Cloudflare", "Vercel", "AWS"];

  return (
    <section
      ref={containerRef}
      className="relative flex min-h-screen flex-col items-center justify-start overflow-hidden px-4 pt-32 md:min-h-[140vh]"
    >
      {/* Background Glow */}
      <div className="pointer-events-none absolute top-1/4 left-1/2 h-100 w-200 -translate-x-1/2 rounded-full bg-amber-500/10 blur-[120px]" />

      <motion.div
        style={{ y: textY }}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 mb-12 flex max-w-5xl flex-col items-center text-center"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="group relative mb-10"
        >
          {/* Epic Glow Backdrop */}
          <div className="absolute -inset-10 rounded-full bg-amber-500/5 opacity-0 blur-[80px] transition-opacity duration-1000 group-hover:opacity-100" />
          <div className="absolute inset-0 animate-pulse rounded-full bg-amber-500/10 blur-2xl" />

          <div className="relative flex flex-col items-center">
            <span className="mb-4 text-[10px] font-bold tracking-[0.6em] text-zinc-600 uppercase">
              The Master Interface
            </span>
            <h2 className="text-7xl leading-none font-black md:text-9xl">
              <span className="text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                TheOne
              </span>
              <span className="bg-linear-to-b from-amber-200 via-amber-400 to-amber-700 bg-clip-text pr-4 text-transparent drop-shadow-[0_0_30px_rgba(251,191,36,0.3)]">
                DNS
              </span>
            </h2>
            <div className="mt-6 h-px w-32 bg-linear-to-r from-transparent via-amber-500/50 to-transparent" />
          </div>
        </motion.div>

        <h3 className="mb-8 text-2xl font-bold tracking-tight text-zinc-300 md:text-4xl">
          One Dashboard to Rule Them All.
        </h3>

        <p className="mx-auto mb-12 max-w-2xl font-serif text-lg leading-relaxed text-zinc-500 italic md:text-xl">
          Stop logging into 20 different dashboards. TheOneDNS is the master web
          portal forged to manage all your DNS records from a single throne.
        </p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          <CtaButton />
        </motion.div>
      </motion.div>

      {/* Mock Dashboard */}
      <motion.div
        style={{ y: mockupY }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="relative z-10 mx-auto w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 shadow-2xl shadow-black/50 backdrop-blur-xl"
      >
        {/* Dashboard Header */}
        <div className="flex items-center justify-between border-b border-white/5 bg-white/5 p-4">
          <div className="flex gap-2">
            <div className="h-3 w-3 rounded-full border border-red-500/40 bg-red-500/20" />
            <div className="h-3 w-3 rounded-full border border-amber-500/40 bg-amber-500/20" />
            <div className="h-3 w-3 rounded-full border border-emerald-500/40 bg-emerald-500/20" />
          </div>
          <div className="no-scrollbar flex gap-2 overflow-x-auto px-2 pb-1">
            <button
              onClick={() => setFilter(null)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                filter === null
                  ? "border border-amber-500/40 bg-amber-500/20 text-amber-400"
                  : "border border-white/5 bg-white/5 text-zinc-500 hover:border-white/10"
              }`}
            >
              All Records
            </button>
            {platforms.map((p) => (
              <button
                key={p}
                onClick={() => setFilter(p)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                  filter === p
                    ? "border border-amber-500/40 bg-amber-500/20 text-amber-400"
                    : "border border-white/5 bg-white/5 text-zinc-500 hover:border-white/10"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Dashboard Table */}
        <div className="min-h-87.5 overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-white/5 text-xs font-medium tracking-wider text-zinc-500 uppercase">
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Content</th>
                <th className="px-6 py-4">Platform</th>
                <th className="px-6 py-4 text-right">TTL</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {filteredRecords.map((record) => (
                  <motion.tr
                    key={record.id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.3 }}
                    className="border-b border-white/5 transition-colors hover:bg-white/2"
                  >
                    <td className="px-6 py-4">
                      <span className="rounded border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-500">
                        {record.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-zinc-300">
                      {record.name}
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-zinc-500">
                      {record.content}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-2 w-2 rounded-full ${
                            record.platform === "Cloudflare"
                              ? "bg-orange-500"
                              : record.platform === "Vercel"
                                ? "bg-white"
                                : "bg-amber-600"
                          }`}
                        />
                        <span className="text-xs text-zinc-400">
                          {record.platform}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-xs text-zinc-500">
                      {record.ttl}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </motion.div>
    </section>
  );
}
