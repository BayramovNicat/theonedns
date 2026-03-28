"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus } from "lucide-react";

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

      toast.success("Record created");
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
      <DialogTrigger className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors">
        <Plus className="size-4" />
        Add record
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New DNS record</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
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
              <span className="text-muted-foreground shrink-0 text-sm">
                .{domain}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Record type</Label>
            <Select value={recordType} onValueChange={setRecordType}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A">A (IPv4 address)</SelectItem>
                <SelectItem value="CNAME">CNAME (alias)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Target</Label>
            <Input
              id="content"
              placeholder={recordType === "A" ? "192.0.2.1" : "example.com"}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          <div className="border-border/60 flex items-center justify-between rounded-lg border px-4 py-3">
            <div>
              <Label className="text-sm">Proxy through Cloudflare</Label>
              <p className="text-muted-foreground text-xs">
                Enable CDN and DDoS protection
              </p>
            </div>
            <Switch checked={proxied} onCheckedChange={setProxied} />
          </div>

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Creating..." : "Create record"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
