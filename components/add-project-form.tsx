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
      <DialogTrigger className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring inline-flex h-9 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none">
        New project
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="platform">Platform</Label>
            <select
              id="platform"
              value={platform}
              onChange={(e) => {
                setPlatform(e.target.value as Platform);
                setCredentials({});
              }}
              className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
            >
              {Object.entries(PLATFORMS).map(([key, cfg]) => (
                <option key={key} value={key}>
                  {cfg.name}
                </option>
              ))}
            </select>
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

          <div className="space-y-3">
            <Label className="text-muted-foreground text-xs tracking-wide uppercase">
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
                  value={credentials[field.key] ?? ""}
                  onChange={(e) => updateCredential(field.key, e.target.value)}
                />
                {field.help && (
                  <p className="text-muted-foreground text-xs">{field.help}</p>
                )}
              </div>
            ))}
          </div>

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Creating..." : "Create project"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
