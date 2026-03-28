"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export function AddSubdomainForm({
  domain,
  projectId,
}: {
  domain: string;
  projectId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [subdomain, setSubdomain] = useState("");
  const [recordType, setRecordType] = useState("A");
  const [content, setContent] = useState("");
  const [proxied, setProxied] = useState(true);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);

    try {
      const res = await fetch(`/api/projects/${projectId}/dns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subdomain, recordType, content, proxied }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Something went wrong");
        return;
      }

      toast.success("Subdomain created");
      setSubdomain("");
      setContent("");
      setRecordType("A");
      setProxied(true);
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring inline-flex h-9 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none">
        Add subdomain
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New subdomain</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subdomain">Subdomain</Label>
            <div className="flex items-center gap-2">
              <Input
                id="subdomain"
                placeholder="blog"
                required
                className="flex-1"
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value)}
              />
              <span className="text-muted-foreground text-sm">.{domain}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="recordType">Record type</Label>
            <select
              id="recordType"
              value={recordType}
              onChange={(e) => setRecordType(e.target.value)}
              className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
            >
              <option value="A">A (IPv4 address)</option>
              <option value="CNAME">CNAME (alias)</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Target</Label>
            <Input
              id="content"
              placeholder="192.0.2.1 or example.com"
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="proxied"
              checked={proxied}
              onChange={(e) => setProxied(e.target.checked)}
              className="border-input h-4 w-4 rounded"
            />
            <Label htmlFor="proxied" className="text-sm font-normal">
              Proxy through Cloudflare (recommended)
            </Label>
          </div>

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Creating..." : "Create"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
