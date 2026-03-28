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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { PLATFORMS, type Platform } from "@/lib/platforms";
import { Plus } from "lucide-react";

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
      <DialogTrigger className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors">
        <Plus className="size-4" />
        New project
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect a domain</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className="space-y-5"
          autoComplete="one-time-code"
        >
          <div className="space-y-2">
            <Label>Platform</Label>
            <Select
              value={platform}
              onValueChange={(v: Platform) => {
                setPlatform(v);
                setCredentials({});
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PLATFORMS).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>
                    {cfg.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="domain">Domain</Label>
            <Input
              id="domain"
              placeholder="example.com"
              required
              autoComplete="one-time-code"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            <Label className="text-muted-foreground text-xs tracking-wider uppercase">
              {platformConfig.name} credentials
            </Label>
            {platformConfig.fields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>{field.label}</Label>
                <Input
                  id={field.key}
                  type={field.type}
                  placeholder={field.placeholder}
                  required={!field.label.includes("optional")}
                  autoComplete="one-time-code"
                  value={credentials[field.key] ?? ""}
                  onChange={(e) => updateCredential(field.key, e.target.value)}
                />
                {field.help && (
                  <p className="text-muted-foreground text-xs">{field.help}</p>
                )}
              </div>
            ))}
          </div>

          <Button type="submit" className="h-10 w-full" disabled={pending}>
            {pending ? "Connecting..." : "Connect domain"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
