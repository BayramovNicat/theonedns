"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

export function ConnectCloudflare() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [apiToken, setApiToken] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [domain, setDomain] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);

    try {
      const res = await fetch("/api/cloudflare-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiToken, zoneId, domain }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Something went wrong");
        return;
      }

      toast.success("Cloudflare connected");
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Connect Cloudflare</CardTitle>
          <CardDescription>
            Enter your Cloudflare API credentials to start managing subdomains.
            Your token is stored securely and never exposed to the browser.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiToken">API Token</Label>
              <Input
                id="apiToken"
                type="password"
                placeholder="Your Cloudflare API token"
                required
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
              />
              <p className="text-muted-foreground text-xs">
                Create one at Cloudflare Dashboard &gt; My Profile &gt; API
                Tokens with <strong>Zone.DNS Edit</strong> permission.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="zoneId">Zone ID</Label>
              <Input
                id="zoneId"
                placeholder="e.g. 023e105f4ecef8ad9ca31a8372d0c353"
                required
                value={zoneId}
                onChange={(e) => setZoneId(e.target.value)}
              />
              <p className="text-muted-foreground text-xs">
                Found on your domain&apos;s Overview page in Cloudflare.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="domain">Domain</Label>
              <Input
                id="domain"
                placeholder="example.com"
                required
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Verifying..." : "Connect"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
