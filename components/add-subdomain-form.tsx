"use client";

import { useRef, useState, useTransition } from "react";
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
import { addSubdomain } from "@/lib/actions/subdomains";
import { toast } from "sonner";

export function AddSubdomainForm({ domain }: { domain: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await addSubdomain(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Subdomain created");
        formRef.current?.reset();
        setOpen(false);
      }
    });
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
        <form ref={formRef} action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subdomain">Subdomain</Label>
            <div className="flex items-center gap-2">
              <Input
                id="subdomain"
                name="subdomain"
                placeholder="blog"
                required
                className="flex-1"
              />
              <span className="text-muted-foreground text-sm">.{domain}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="recordType">Record type</Label>
            <select
              id="recordType"
              name="recordType"
              defaultValue="A"
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
              name="content"
              placeholder="192.0.2.1 or example.com"
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="proxied"
              name="proxied"
              defaultChecked
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
