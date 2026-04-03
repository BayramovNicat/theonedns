import Link from 'next/link';

export default function LandingHeader() {
  return (
    <header className="absolute top-0 right-0 left-0 z-50 border-b border-white/5 bg-transparent px-4 py-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-xl font-black text-transparent">
            TheOneDNS
          </span>
        </Link>
        <nav className="flex items-center gap-8">
          <Link
            href="/docs"
            className="text-[10px] font-bold tracking-[0.3em] text-zinc-500 uppercase transition-colors hover:text-amber-500"
          >
            Archives
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-amber-500/20 bg-amber-500/5 px-6 py-2 text-[10px] font-bold tracking-[0.2em] text-amber-500 uppercase transition-all hover:bg-amber-500/10"
          >
            Enter Throne
          </Link>
        </nav>
      </div>
    </header>
  );
}
