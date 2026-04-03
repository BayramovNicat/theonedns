import type { ReactNode } from 'react';
import FooterSection from './FooterSection';
import LandingHeader from './LandingHeader';

interface LandingLayoutProps {
  children: ReactNode;
}

export default function LandingLayout({ children }: LandingLayoutProps) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-zinc-950 font-sans text-white selection:bg-amber-500/30 selection:text-amber-200">
      <LandingHeader />

      <div className="relative z-10">{children}</div>

      <FooterSection />

      {/* Subtle Grain Overlay */}
      <div className="bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')] pointer-events-none fixed inset-0 z-100 opacity-[0.03]" />
    </div>
  );
}
