"use client";

import { motion, useScroll, useTransform } from "framer-motion";

export function ParallaxGrid() {
  const { scrollYProgress } = useScroll();
  const gridY = useTransform(scrollYProgress, [0, 1], [0, -200]);

  return (
    <motion.div
      style={{ y: gridY }}
      className="grid-bg pointer-events-none fixed inset-0 z-0 opacity-20"
    />
  );
}
