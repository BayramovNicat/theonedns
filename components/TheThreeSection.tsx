"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

const CARDS = [
  {
    title: "Cloudflare, Inc.",
    subtitle: "(Vilya)",
    description:
      "The mightiest of the three, commanding the winds of the edge.",
    color: "#3b82f6", // Blue
    icon: "https://www.vectorlogo.zone/logos/cloudflare/cloudflare-icon.svg",
  },
  {
    title: "Vercel Inc.",
    subtitle: "(Nenya)",
    description: "The ring of water; fluid, fast, and essential for growth.",
    color: "#ffffff", // White
    icon: "https://www.vectorlogo.zone/logos/vercel/vercel-icon.svg",
  },
  {
    title: "Netlify, Inc.",
    subtitle: "(Narya)",
    description: "The ring of fire; sparking the modern web movement.",
    color: "#2dd4bf", // Teal
    icon: "https://www.vectorlogo.zone/logos/netlify/netlify-icon.svg",
  },
];

function GlassCard({ card }: { card: (typeof CARDS)[0] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

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
      className="group relative h-[400px] w-full max-w-[350px] cursor-pointer"
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
          <div className="mb-6 h-12 w-12 rounded-xl border border-white/10 bg-white/5 p-2">
            <Image
              src={card.icon}
              alt={card.title}
              width={48}
              height={48}
              className="h-full w-full object-contain brightness-0 invert filter"
              unoptimized
            />
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
          <div className="mx-auto h-1 w-24 rounded-full bg-amber-500/50" />
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
