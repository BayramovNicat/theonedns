"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type DnsRecord = {
  id: string;
  name: string;
  type: string;
  content: string;
  proxied: boolean;
};

export function SubdomainRow({
  record,
  projectId,
}: {
  record: DnsRecord;
  projectId: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [recordType, setRecordType] = useState(record.type);
  const [content, setContent] = useState(record.content);
  const [proxied, setProxied] = useState(record.proxied);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [removed, setRemoved] = useState(false);

  if (removed) return null;

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/dns`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cloudflareRecordId: record.id,
          type: recordType,
          content,
          proxied,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Something went wrong");
        return;
      }

      toast.success(`${record.name} updated`);
      setEditing(false);
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setRecordType(record.type);
    setContent(record.content);
    setProxied(record.proxied);
    setEditing(false);
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/dns`, {
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
      setDeleting(false);
    }
  }

  return (
    <TableRow>
      <TableCell className="font-medium">{record.name}</TableCell>
      <TableCell>
        {editing ? (
          <select
            value={recordType}
            onChange={(e) => setRecordType(e.target.value)}
            className="border-input focus-visible:ring-ring h-8 rounded-md border bg-transparent px-2 text-sm"
          >
            <option value="A">A</option>
            <option value="AAAA">AAAA</option>
            <option value="CNAME">CNAME</option>
          </select>
        ) : (
          <Badge variant="secondary">{record.type}</Badge>
        )}
      </TableCell>
      <TableCell>
        {editing ? (
          <Input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="h-8 font-mono text-sm"
          />
        ) : (
          <span className="font-mono text-sm">{record.content}</span>
        )}
      </TableCell>
      <TableCell>
        {editing ? (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={proxied}
              onChange={(e) => setProxied(e.target.checked)}
              className="border-input h-4 w-4 rounded"
            />
            <span className="text-xs">Proxied</span>
          </label>
        ) : record.proxied ? (
          <Badge className="bg-orange-500/10 text-orange-600 hover:bg-orange-500/10">
            Proxied
          </Badge>
        ) : (
          <Badge variant="outline">DNS only</Badge>
        )}
      </TableCell>
      <TableCell className="text-right">
        {editing ? (
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        ) : (
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
            >
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}
