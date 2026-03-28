import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Globe, Shield, Zap, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="bg-background min-h-screen">
      {/* Nav */}
      <header className="border-border/40 border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Globe className="text-primary size-5" />
            <span className="text-lg font-semibold tracking-tight">Domnix</span>
          </div>
          <Link href="/login">
            <Button variant="secondary" size="sm">
              Sign in
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-24 text-center sm:py-32">
        <div className="mx-auto max-w-2xl">
          <div className="border-border/60 bg-secondary/50 text-muted-foreground mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm">
            <Zap className="size-3.5" />
            Manage DNS across all your platforms
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            One dashboard for
            <br />
            <span className="text-primary">all your DNS records</span>
          </h1>
          <p className="text-muted-foreground mt-6 text-lg leading-relaxed">
            Stop switching between Cloudflare, Vercel, and Netlify dashboards.
            Connect your accounts and manage every DNS record from a single,
            clean interface.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/login">
              <Button size="lg" className="gap-2">
                Get started
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-border/40 border-t">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-8 sm:grid-cols-3">
            <div className="border-border/60 bg-card rounded-xl border p-6">
              <div className="bg-secondary mb-4 flex size-10 items-center justify-center rounded-lg">
                <Globe className="text-primary size-5" />
              </div>
              <h3 className="font-semibold">Multi-Platform</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                Connect Cloudflare, Vercel, or Netlify. Add your credentials
                once and manage all domains from here.
              </p>
            </div>
            <div className="border-border/60 bg-card rounded-xl border p-6">
              <div className="bg-secondary mb-4 flex size-10 items-center justify-center rounded-lg">
                <Zap className="text-primary size-5" />
              </div>
              <h3 className="font-semibold">Live Records</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                View and edit DNS records in real-time. Changes are pushed
                directly to your platform via their API.
              </p>
            </div>
            <div className="border-border/60 bg-card rounded-xl border p-6">
              <div className="bg-secondary mb-4 flex size-10 items-center justify-center rounded-lg">
                <Shield className="text-primary size-5" />
              </div>
              <h3 className="font-semibold">Secure by Design</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                Your credentials are encrypted and scoped per-project. Row-level
                security ensures complete data isolation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-border/40 border-t">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <span className="text-muted-foreground text-sm">Domnix</span>
          <span className="text-muted-foreground text-xs">
            Built with Next.js &amp; Supabase
          </span>
        </div>
      </footer>
    </div>
  );
}
