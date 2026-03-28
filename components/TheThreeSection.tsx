"use client";

import type { ReactNode } from "react";
import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

function CloudflareIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="currentColor" className="h-full w-full">
      <path d="M33.24 28.72c.18-.63.1-1.21-.22-1.63-.3-.38-.77-.6-1.33-.63l-17.84-.24a.44.44 0 0 1-.37-.21.47.47 0 0 1-.04-.43c.08-.22.3-.37.54-.39l18-.24c1.3-.07 2.72-1.1 3.2-2.34l.62-1.58a.77.77 0 0 0 .03-.44 10.09 10.09 0 0 0-19.5-1.82 5.8 5.8 0 0 0-9.14 3.85A7.26 7.26 0 0 0 1 30.64a.43.43 0 0 0 .42.36h30.7c.26 0 .5-.16.58-.4l.54-1.88Z" />
      <path d="M38.63 20.13c-.24 0-.48.02-.71.04a.3.3 0 0 0-.24.18l-.43 1.5c-.18.64-.1 1.22.22 1.64.3.38.77.6 1.33.62l3.78.24c.22.01.4.12.44.28a.47.47 0 0 1-.04.43c-.08.22-.3.37-.54.39l-3.94.24c-1.31.07-2.73 1.1-3.2 2.34l-.18.5a.23.23 0 0 0 .22.32h11.22a.44.44 0 0 0 .43-.34 8.63 8.63 0 0 0-8.36-8.38Z" />
    </svg>
  );
}

function VercelIcon() {
  return (
    <svg viewBox="0 0 76 65" fill="currentColor" className="h-full w-full">
      <path d="M37.53 0L75.06 65H0L37.53 0Z" />
    </svg>
  );
}

function NetlifyIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="currentColor" className="h-full w-full">
      <path d="M46.35 22.21c-.24-.26-.51-.48-.83-.64l-.02-.01a.2.2 0 0 1-.05-.16l1.29-7.89 6.04 6.05-6.28 2.68a.1.1 0 0 1-.06.01h-.02l-.03-.03Zm8.76-.48 6.46 6.47c1.34 1.35 2.01 2.02 2.26 2.79.04.12.07.23.09.35L48.48 24.79l-.03-.01c-.06-.03-.13-.05-.13-.12s.07-.09.13-.12l.02-.01Zm8.55 11.69c-.33.63-.98 1.28-2.08 2.38l-7.28 7.29-9.42-1.96-.05-.01c-.08-.01-.17-.03-.17-.1a2.6 2.6 0 0 0-1.09-2c-.04-.03-.03-.1-.02-.15l.01-.02 1.77-10.9.01-.03c.01-.08.02-.18.1-.18.77-.1 1.46-.5 1.93-1.11l.05-.05c.05-.02.11 0 .17.03l16.08 6.81Zm-11.04 11.35-11.97 11.99 2.05-12.62v-.02l.01-.05c.02-.04.06-.06.1-.07l.02-.01c.45-.19.85-.49 1.16-.86.04-.05.09-.09.15-.1h.05l8.43 1.74ZM38.1 59.3l-1.35 1.35L21.83 39.05l-.02-.02c-.02-.03-.05-.07-.04-.1 0-.03.02-.05.04-.07l.01-.02.13-.21.03-.06.01-.01c.02-.04.04-.08.08-.1.04-.01.09-.01.12 0l16.54 3.42c.05.01.09.03.13.06.02.02.03.04.03.07.23.89.87 1.61 1.71 1.96.05.02.03.08.01.13l-.03.08c-.2 1.27-1.99 12.18-2.47 15.13Zm-2.82 2.82c-1 .99-1.58 1.51-2.25 1.72a3.2 3.2 0 0 1-2.01 0c-.78-.25-1.45-.92-2.79-2.26L13.25 46.57l3.92-6.08c.02-.03.04-.06.07-.08.04-.03.1-.02.15 0 .9.27 1.86.22 2.73-.14.05-.02.09-.03.13 0l.05.06 15 21.8ZM11.8 45.12l-3.44-3.44 6.79-2.9.06-.01c.06 0 .09.06.12.11.07.1.14.21.22.31l.02.03c.02.03.01.06-.01.08l-3.75 5.83ZM6.84 40.16 2.49 35.8c-.74-.74-1.28-1.28-1.65-1.74l13.23 2.75.05.01c.08.01.17.03.17.1 0 .09-.1.12-.18.16l-.04.02ZM.08 31.82c.02-.28.07-.56.15-.83.25-.78.92-1.45 2.26-2.79l5.57-5.58c2.56 3.73 5.13 7.45 7.71 11.16.05.06.1.13.04.18-.24.27-.49.56-.66.88-.02.04-.05.08-.08.1-.02.02-.05.01-.07 0h-.01L.08 31.82ZM9.55 21.13l7.48-7.5c.71.31 3.27 1.4 5.56 2.36l3.81 1.62c.05.02.09.04.12.09.01.03.01.07 0 .1-.24 1.1.09 2.25.87 3.05.05.05 0 .12-.04.18l-.02.04-7.6 11.79c-.02.03-.04.06-.07.08-.04.03-.1.01-.14 0-.3-.08-.6-.12-.91-.12-.27 0-.57.05-.87.1h-.01l-.09-.01c-.03-.02-.05-.05-.07-.08L9.55 21.13Zm9-9.01 9.69-9.7c1.34-1.35 2.01-2.02 2.79-2.26a3.2 3.2 0 0 1 2.01 0c.78.24 1.45.92 2.79 2.26l2.1 2.1-6.89 10.69-.07.08c-.04.03-.1.02-.15 0-1.1-.34-2.3-.1-3.2.62-.05.05-.11.02-.17-.01-.9-.39-7.9-3.35-8.9-3.78Zm20.84-6.14 6.36 6.37-1.53 9.51v.03l-.01.06c-.02.03-.05.04-.08.05-.33.1-.64.25-.91.46l-.03.03c-.02.02-.04.04-.07.04-.02 0-.05 0-.07-.01l-9.7-4.13-.02-.01c-.06-.02-.13-.05-.13-.12a3.1 3.1 0 0 0-.52-1.53c-.05-.08-.1-.16-.06-.24Zm-6.55 14.36 9.09 3.86c.05.02.1.04.13.1.01.03.01.06 0 .09-.03.13-.05.28-.05.44v.25c0 .07-.07.09-.13.12l-.02.01c-1.44.61-20.22 8.63-20.25 8.63-.03 0-.06 0-.09-.03-.05-.05 0-.12.05-.18l.02-.03 7.47-11.59.01-.02c.04-.07.09-.15.17-.15l.08.01c.17.02.32.05.47.05 1.13 0 2.18-.56 2.82-1.5l.06-.07c.04-.03.11-.02.16.01ZM22.43 35.68l20.47-8.74s.03 0 .06.03c.11.11.21.19.3.26l.04.03c.04.02.08.05.09.09v.04l-1.75 10.79-.01.04c-.01.08-.02.18-.1.18-.95.06-1.81.59-2.29 1.41l-.01.01c-.02.04-.04.08-.08.1-.04.01-.08.01-.12 0l-16.22-3.37c-.02 0-.25-.87-.27-.87Z" />
    </svg>
  );
}

const CARDS: {
  title: string;
  subtitle: string;
  description: string;
  color: string;
  icon: () => ReactNode;
}[] = [
  {
    title: "Cloudflare, Inc.",
    subtitle: "(Vilya)",
    description:
      "The mightiest of the three, commanding the winds of the edge.",
    color: "#3b82f6",
    icon: CloudflareIcon,
  },
  {
    title: "Vercel Inc.",
    subtitle: "(Nenya)",
    description: "The ring of water; fluid, fast, and essential for growth.",
    color: "#ffffff",
    icon: VercelIcon,
  },
  {
    title: "Netlify, Inc.",
    subtitle: "(Narya)",
    description: "The ring of fire; sparking the modern web movement.",
    color: "#2dd4bf",
    icon: NetlifyIcon,
  },
];

function GlassCard({ card }: { card: (typeof CARDS)[0] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { stiffness: 300, damping: 30, mass: 0.5 };
  const mouseXSpring = useSpring(x, springConfig);
  const mouseYSpring = useSpring(y, springConfig);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["-10deg", "10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["10deg", "-10deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
    ref.current.style.setProperty("--mouse-x", `${mouseX}px`);
    ref.current.style.setProperty("--mouse-y", `${mouseY}px`);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className="group relative h-100 w-full max-w-87.5 cursor-pointer"
    >
      <div
        className="absolute inset-0 rounded-3xl opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-20"
        style={{ backgroundColor: card.color }}
      />
      <div
        className="relative flex h-full w-full flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md"
        style={{
          borderColor: isHovered ? `${card.color}44` : "rgba(255,255,255,0.1)",
          transition: "border-color 0.3s ease",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background: `radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), ${card.color}15, transparent 40%)`,
          }}
        />

        <div className="relative z-10">
          <div className="mb-6 h-12 w-12 rounded-xl border border-white/10 bg-white/5 p-2 text-white">
            <card.icon />
          </div>
          <h3 className="mb-1 text-2xl font-bold text-white">{card.title}</h3>
          <p className="mb-4 font-serif text-sm text-amber-400/80 italic">
            {card.subtitle}
          </p>
          <p className="leading-relaxed text-zinc-400">{card.description}</p>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-xs font-bold tracking-widest text-zinc-500 uppercase transition-colors group-hover:text-white">
          Guardian of the Edge
          <div className="h-px flex-1 bg-white/10" />
        </div>
      </div>
    </motion.div>
  );
}

export default function TheThreeSection() {
  return (
    <section className="relative overflow-hidden px-4 py-24">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <h2 className="mb-4 text-4xl font-bold text-white md:text-5xl">
            The Three: High-Tier Guardians
          </h2>
          <p className="mx-auto max-w-xl text-zinc-500">
            The mightiest platforms commanding the winds of the edge.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 justify-items-center gap-8 md:grid-cols-3">
          {CARDS.map((card, idx) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
            >
              <GlassCard card={card} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
