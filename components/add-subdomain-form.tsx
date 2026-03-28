"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

export function AddSubdomainForm({
  domain,
  projectId,
  platform,
}: {
  domain: string;
  projectId: string;
  platform: string;
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
      <DialogTrigger className="group relative inline-flex h-10 items-center gap-2 overflow-hidden rounded-full bg-amber-500 px-6 text-xs font-black tracking-widest text-black uppercase shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all hover:scale-105 active:scale-95">
        <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
        <Plus className="relative z-10 size-4 stroke-[3px]" />
        <span className="relative z-10">Add record</span>
      </DialogTrigger>
      <DialogContent className="max-w-md border-white/10 bg-zinc-900 shadow-2xl backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">
            New DNS record
          </DialogTitle>
          <p className="font-serif text-sm text-zinc-500 italic">
            Forge a new entry in the DNS registry of this realm.
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-4 space-y-6">
          <div className="space-y-2">
            <Label
              htmlFor="subdomain"
              className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase"
            >
              Subdomain
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="subdomain"
                placeholder="blog"
                required
                className="flex-1 border-white/10 bg-white/5 text-white placeholder:text-zinc-700"
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value)}
              />
              <span className="shrink-0 font-serif text-sm text-zinc-500 italic">
                .{domain}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
              Record type
            </Label>
            <Select
              value={recordType}
              onValueChange={(v) => v && setRecordType(v)}
            >
              <SelectTrigger className="w-full border-white/10 bg-white/5 text-white">
                <SelectValue>
                  {recordType === "A" ? "A (IPv4 address)" : "CNAME (alias)"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-zinc-900 text-white">
                <SelectItem
                  value="A"
                  className="cursor-pointer hover:bg-white/5"
                >
                  A (IPv4 address)
                </SelectItem>
                <SelectItem
                  value="CNAME"
                  className="cursor-pointer hover:bg-white/5"
                >
                  CNAME (alias)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="content"
              className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase"
            >
              Target
            </Label>
            <Input
              id="content"
              placeholder={recordType === "A" ? "192.0.2.1" : "example.com"}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="border-white/10 bg-white/5 text-white placeholder:text-zinc-700"
            />
          </div>

          {platform === "cloudflare" && (
            <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
              <div>
                <Label className="text-[10px] font-bold tracking-widest text-white uppercase">
                  Proxy through Cloudflare
                </Label>
                <p className="font-serif text-[10px] text-zinc-500 italic">
                  Enable CDN and DDoS protection
                </p>
              </div>
              <Switch checked={proxied} onCheckedChange={setProxied} />
            </div>
          )}

          <Button
            type="submit"
            disabled={pending}
            className="group relative h-12 w-full overflow-hidden rounded-full bg-amber-500 text-xs font-black tracking-widest text-black uppercase transition-all hover:bg-amber-400 disabled:opacity-50"
          >
            {pending ? "Creating..." : "Create record"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
