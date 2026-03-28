"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  async function signInWithGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-zinc-950 px-4 text-white selection:bg-amber-500/30 selection:text-amber-200">
      {/* Parallax Grid Background (static here for focus) */}
      <div className="grid-bg pointer-events-none absolute inset-0 z-0 opacity-20" />

      {/* Epic Glow Backdrop */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/10 blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="group relative mb-6 inline-flex flex-col items-center transition-opacity hover:opacity-90"
          >
            <h2 className="text-4xl leading-none font-black md:text-5xl">
              <span className="text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                TheOne
              </span>
              <span className="bg-gradient-to-b from-amber-200 via-amber-400 to-amber-700 bg-clip-text pr-4 text-transparent drop-shadow-[0_0_20px_rgba(251,191,36,0.3)]">
                DNS
              </span>
            </h2>
          </Link>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/50 p-8 shadow-2xl shadow-black/50 backdrop-blur-xl md:p-12">
          <div className="mb-10 text-center">
            <h1 className="mb-2 text-2xl font-bold tracking-tight text-white">
              Welcome back, Guardian
            </h1>
            <p className="font-serif text-sm text-zinc-500 italic">
              Step into the realm and command your infrastructure.
            </p>
          </div>

          <button
            onClick={signInWithGoogle}
            className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-full border border-white/10 bg-white/5 py-4 text-sm font-bold tracking-widest text-white uppercase transition-all hover:bg-white/10 active:scale-95"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <svg className="relative z-10 size-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="currentColor"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="currentColor"
                className="opacity-50"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="currentColor"
                className="opacity-50"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="currentColor"
                className="opacity-50"
              />
            </svg>
            <span className="relative z-10">Continue with Google</span>
          </button>

          <div className="mt-8 flex flex-col items-center gap-4 text-center">
            <div className="h-px w-12 bg-zinc-800" />
            <p className="text-[10px] font-bold tracking-[0.2em] text-zinc-600 uppercase">
              By entering, you agree to the laws of the realm.
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase transition-colors hover:text-amber-500"
          >
            ← Back to Middle-earth
          </Link>
        </div>
      </motion.div>

      {/* Subtle Grain Overlay */}
      <div className="pointer-events-none fixed inset-0 z-[100] bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')] opacity-[0.03]" />
    </div>
  );
}
