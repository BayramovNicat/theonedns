"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function DisconnectButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleDisconnect() {
    setPending(true);

    try {
      const res = await fetch("/api/cloudflare-config", {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Something went wrong");
        return;
      }

      toast.success("Cloudflare disconnected");
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDisconnect}
      disabled={pending}
    >
      {pending ? "Disconnecting..." : "Disconnect"}
    </Button>
  );
}
