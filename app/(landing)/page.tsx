"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import HeroSection from "@/components/HeroSection";
import TheThreeSection from "@/components/TheThreeSection";
import TheSevenSection from "@/components/TheSevenSection";
import TheNineSection from "@/components/TheNineSection";
import FooterSection from "@/components/FooterSection";

const Index = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const gridY = useTransform(scrollYProgress, [0, 1], [0, -200]);

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen overflow-x-hidden bg-zinc-950 text-white selection:bg-amber-500/30 selection:text-amber-200"
    >
      {/* Parallax Grid Background */}
      <motion.div
        style={{ y: gridY }}
        className="grid-bg pointer-events-none fixed inset-0 z-0 opacity-20"
      />

      {/* Content */}
      <div className="relative z-10">
        <HeroSection />

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <TheThreeSection />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <TheSevenSection />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <TheNineSection />
        </motion.div>

        <FooterSection />
      </div>

      {/* Subtle Grain Overlay */}
      <div className="pointer-events-none fixed inset-0 z-[100] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]" />
    </div>
  );
};

export default Index;
