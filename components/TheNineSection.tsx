"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const NINE = [
  "Porkbun LLC",
  "DNSimple Corporation",
  "GoDaddy Inc.",
  "Namecheap, Inc.",
  "Name.com (Identity Digital Inc.)",
  "Gandi SAS",
  "Bunny.net (BunnyWay d.o.o.)",
  "Dynadot LLC",
  "Hostinger International, Ltd.",
];

export default function TheNineSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 1.15]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  return (
    <section ref={containerRef} className="relative overflow-hidden px-4 py-32">
      <motion.div
        style={{ opacity }}
        className="mx-auto mb-20 max-w-7xl text-center"
      >
        <h2 className="mb-4 text-4xl font-bold text-white md:text-5xl">
          The Nine: Mortal Registrars
        </h2>
        <p className="text-zinc-500">
          Universal accessibility across all common digital boundaries.
        </p>
      </motion.div>

      <motion.div
        style={{ scale }}
        className="relative flex overflow-hidden py-10"
      >
        <div className="animate-marquee flex whitespace-nowrap hover:[animation-play-state:paused]">
          {[...NINE, ...NINE, ...NINE].map((name, idx) => (
            <div
              key={`${name}-${idx}`}
              className="mx-8 flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-8 py-4 transition-colors hover:border-amber-500/30"
            >
              <div className="h-2 w-2 rounded-full bg-amber-500/50" />
              <span className="text-xl font-bold tracking-tight text-zinc-300 md:text-2xl">
                {name}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="absolute top-0 bottom-0 left-0 z-10 w-32 bg-gradient-to-r from-zinc-950 to-transparent" />
      <div className="absolute top-0 right-0 bottom-0 z-10 w-32 bg-gradient-to-l from-zinc-950 to-transparent" />

      <style jsx global>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.33%);
          }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
      `}</style>
    </section>
  );
}
