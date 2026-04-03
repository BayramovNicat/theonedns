import { ExternalLink } from 'lucide-react';
import Link from 'next/link';

export function CtaButton({
  variant = 'primary',
  showSubtext = true,
}: {
  variant?: 'primary' | 'secondary';
  showSubtext?: boolean;
}) {
  if (variant === 'secondary') {
    return (
      <Link
        href="/login"
        className="group relative inline-flex items-center justify-center overflow-hidden rounded-full border-2 border-amber-500/30 bg-transparent px-10 py-5 text-xs font-black tracking-widest text-amber-500 uppercase transition-all hover:border-amber-500/50 hover:bg-amber-500/10 active:scale-95"
      >
        <span className="relative z-10 flex items-center gap-3">
          View Live Demo
          <ExternalLink size={16} strokeWidth={3} />
        </span>
      </Link>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Link
        href="/login"
        className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-amber-500 px-12 py-6 text-xs font-black tracking-widest text-black uppercase shadow-[0_0_50px_rgba(245,158,11,0.4)] transition-all hover:scale-105 active:scale-95"
      >
        <div className="animate-pulse-slow pointer-events-none absolute inset-0 bg-white/20" />
        <span className="relative z-10 flex items-center gap-3">
          Get Started Free
          <ExternalLink size={18} strokeWidth={3} />
        </span>
      </Link>
      {showSubtext && (
        <p className="text-xs text-zinc-500">No credit card required</p>
      )}
    </div>
  );
}
