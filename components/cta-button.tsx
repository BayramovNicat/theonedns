import { ExternalLink } from "lucide-react";
import Link from "next/link";

export function CtaButton() {
  return (
    <Link
      href="/login"
      className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-amber-500 px-12 py-6 text-xs font-black tracking-widest text-black uppercase shadow-[0_0_50px_rgba(245,158,11,0.4)] transition-all hover:scale-105 active:scale-95"
    >
      <div className="animate-pulse-slow pointer-events-none absolute inset-0 bg-white/20" />
      <span className="relative z-10 flex items-center gap-3">
        Start Managing Free
        <ExternalLink size={18} strokeWidth={3} />
      </span>
    </Link>
  );
}
