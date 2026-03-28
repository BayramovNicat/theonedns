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
import { PLATFORMS, type Platform } from "@/lib/platforms";

export function AddProjectForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [platform, setPlatform] = useState<Platform>("cloudflare");
  const [domain, setDomain] = useState("");
  const [credentials, setCredentials] = useState<Record<string, string>>({});

  const platformConfig = PLATFORMS[platform];

  function updateCredential(key: string, value: string) {
    setCredentials((prev) => ({ ...prev, [key]: value }));
  }

  function resetForm() {
    setPlatform("cloudflare");
    setDomain("");
    setCredentials({});
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, domain, credentials }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Something went wrong");
        return;
      }

      toast.success("Project created");
      resetForm();
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
      <DialogTrigger className="group relative inline-flex h-12 items-center gap-2 overflow-hidden rounded-full bg-amber-500 px-8 text-xs font-black tracking-widest text-black uppercase shadow-[0_0_30px_rgba(245,158,11,0.3)] transition-all hover:scale-105 active:scale-95">
        <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
        <Plus className="relative z-10 size-4 stroke-[3px]" />
        <span className="relative z-10">New project</span>
      </DialogTrigger>
      <DialogContent className="max-w-md border-white/10 bg-zinc-900 shadow-2xl backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">
            Connect a domain
          </DialogTitle>
          <p className="font-serif text-sm text-zinc-500 italic">
            Forge a new connection across the digital realms.
          </p>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className="mt-4 space-y-6"
          autoComplete="one-time-code"
        >
          <div className="space-y-2">
            <Label className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
              Platform
            </Label>
            <Select
              value={platform}
              onValueChange={(v) => {
                if (v) {
                  setPlatform(v as Platform);
                  setCredentials({});
                }
              }}
            >
              <SelectTrigger className="w-full border-white/10 bg-white/5 text-white">
                <SelectValue placeholder="Select platform">
                  {PLATFORMS[platform].name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-zinc-900 text-white">
                {Object.entries(PLATFORMS)
                  .sort((a, b) => a[1].name.localeCompare(b[1].name))
                  .map(([key, cfg]) => (
                    <SelectItem
                      key={key}
                      value={key}
                      className="cursor-pointer hover:bg-white/5"
                    >
                      {cfg.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="domain"
              className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase"
            >
              Domain
            </Label>
            <Input
              id="domain"
              placeholder="example.com"
              required
              autoComplete="one-time-code"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="border-white/10 bg-white/5 text-white placeholder:text-zinc-700"
            />
          </div>

          <div className="space-y-4">
            <Label className="text-[10px] font-bold tracking-[0.2em] text-amber-500/50 uppercase">
              {platformConfig.name} credentials
            </Label>
            {platformConfig.fields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label
                  htmlFor={field.key}
                  className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase"
                >
                  {field.label}
                </Label>
                <Input
                  id={field.key}
                  type={field.type}
                  placeholder={field.placeholder}
                  required={!field.label.includes("optional")}
                  autoComplete="one-time-code"
                  value={credentials[field.key] ?? ""}
                  onChange={(e) => updateCredential(field.key, e.target.value)}
                  className="border-white/10 bg-white/5 text-white placeholder:text-zinc-700"
                />
                {field.help && (
                  <p className="font-serif text-[10px] text-zinc-600 italic">
                    {field.help}
                  </p>
                )}
              </div>
            ))}
          </div>

          <Button
            type="submit"
            disabled={pending}
            className="group relative h-12 w-full overflow-hidden rounded-full bg-amber-500 text-xs font-black tracking-widest text-black uppercase transition-all hover:bg-amber-400 disabled:opacity-50"
          >
            {pending ? "Connecting..." : "Connect domain"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
