"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type DnsRecord = {
  id: string;
  name: string;
  type: string;
  content: string;
  proxied: boolean;
};

export function SubdomainRow({ record }: { record: DnsRecord }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [removed, setRemoved] = useState(false);

  if (removed) return null;

  async function handleDelete() {
    setPending(true);

    try {
      const res = await fetch("/api/subdomains", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cloudflareRecordId: record.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Something went wrong");
        return;
      }

      toast.success(`${record.name} deleted`);
      setRemoved(true);
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setPending(false);
    }
  }

  return (
    <TableRow>
      <TableCell className="font-medium">{record.name}</TableCell>
      <TableCell>
        <Badge variant="secondary">{record.type}</Badge>
      </TableCell>
      <TableCell className="font-mono text-sm">{record.content}</TableCell>
      <TableCell>
        {record.proxied ? (
          <Badge className="bg-orange-500/10 text-orange-600 hover:bg-orange-500/10">
            Proxied
          </Badge>
        ) : (
          <Badge variant="outline">DNS only</Badge>
        )}
      </TableCell>
      <TableCell className="text-right">
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={pending}
        >
          {pending ? "Deleting..." : "Delete"}
        </Button>
      </TableCell>
    </TableRow>
  );
}
