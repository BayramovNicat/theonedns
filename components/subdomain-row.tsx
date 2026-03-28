"use client";

import { useState, useTransition } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { removeSubdomain } from "@/lib/actions/subdomains";
import { toast } from "sonner";

type Subdomain = {
  id: string;
  subdomain: string;
  record_type: string;
  content: string;
  proxied: boolean;
  created_at: string;
  is_owner: boolean;
};

export function SubdomainRow({
  record,
  domain,
}: {
  record: Subdomain;
  domain: string;
}) {
  const [pending, startTransition] = useTransition();
  const [removed, setRemoved] = useState(false);

  if (removed) return null;

  function handleDelete() {
    startTransition(async () => {
      const result = await removeSubdomain(record.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`${record.subdomain}.${domain} deleted`);
        setRemoved(true);
      }
    });
  }

  return (
    <TableRow>
      <TableCell className="font-medium">
        {record.subdomain}.{domain}
      </TableCell>
      <TableCell>
        <Badge variant="secondary">{record.record_type}</Badge>
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
      <TableCell className="text-muted-foreground text-sm">
        {new Date(record.created_at).toLocaleDateString()}
      </TableCell>
      <TableCell className="text-right">
        {record.is_owner && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={pending}
          >
            {pending ? "Deleting..." : "Delete"}
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}
