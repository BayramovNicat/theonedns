"use client";

import { Check, Pencil, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { TableCell, TableRow } from "@/components/ui/table";

type DnsRecord = {
  id: string;
  name: string;
  type: string;
  content: string;
  ttl?: number;
  priority?: number;
  proxied?: boolean;
};

const TTL_OPTIONS = [
  { value: "60", label: "1 min" },
  { value: "300", label: "5 min" },
  { value: "600", label: "10 min" },
  { value: "1800", label: "30 min" },
  { value: "3600", label: "1 hour" },
  { value: "86400", label: "1 day" },
];

function formatTtl(ttl?: number): string {
  if (!ttl) return "Auto";
  if (ttl < 60) return `${ttl}s`;
  if (ttl < 3600) return `${Math.round(ttl / 60)}m`;
  if (ttl < 86400) return `${Math.round(ttl / 3600)}h`;
  return `${Math.round(ttl / 86400)}d`;
}

export function SubdomainRow({
  record,
  projectId,
  platform,
}: {
  record: DnsRecord;
  projectId: string;
  platform: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [recordType, setRecordType] = useState(record.type);
  const [content, setContent] = useState(record.content);
  const [ttl, setTtl] = useState(String(record.ttl ?? ""));
  const [proxied, setProxied] = useState(record.proxied ?? false);
  const showProxy = platform === "cloudflare";
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (removed) return null;

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/dns`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recordId: record.id,
          type: recordType,
          content,
          ttl: ttl ? Number(ttl) : undefined,
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
    setTtl(String(record.ttl ?? ""));
    setProxied(record.proxied ?? false);
    setEditing(false);
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/dns`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordId: record.id }),
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
      setConfirmOpen(false);
    }
  }

  return (
    <>
      <TableRow className="border-white/5 transition-colors hover:bg-white/2">
        <TableCell className="pl-8 font-mono text-sm text-zinc-300">
          {record.name}
        </TableCell>
        <TableCell>
          {editing ? (
            <Select
              value={recordType}
              onValueChange={(v) => v && setRecordType(v)}
            >
              <SelectTrigger
                size="sm"
                className="w-24 border-white/10 bg-white/5 text-white"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-zinc-900 text-white">
                <SelectItem value="A">A</SelectItem>
                <SelectItem value="AAAA">AAAA</SelectItem>
                <SelectItem value="CNAME">CNAME</SelectItem>
                <SelectItem value="MX">MX</SelectItem>
                <SelectItem value="TXT">TXT</SelectItem>
                <SelectItem value="NS">NS</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Badge className="border-amber-500/20 bg-amber-500/10 text-[10px] font-bold text-amber-500 uppercase">
              {record.type}
            </Badge>
          )}
        </TableCell>
        <TableCell>
          {editing ? (
            <Input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="h-8 border-white/10 bg-white/5 font-mono text-sm text-white"
            />
          ) : (
            <span className="font-mono text-sm text-zinc-500">
              {record.priority != null
                ? `${record.priority} ${record.content}`
                : record.content}
            </span>
          )}
        </TableCell>
        <TableCell>
          {editing ? (
            <Select value={ttl} onValueChange={(v) => setTtl(v ?? "")}>
              <SelectTrigger
                size="sm"
                className="w-24 border-white/10 bg-white/5 text-white"
              >
                <SelectValue>
                  {ttl ? formatTtl(Number(ttl)) : "Auto"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-zinc-900 text-white">
                <SelectItem value="">Auto</SelectItem>
                {TTL_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className="font-mono text-xs text-zinc-500">
              {formatTtl(record.ttl)}
            </span>
          )}
        </TableCell>
        {showProxy && (
          <TableCell>
            {editing ? (
              <Switch
                checked={proxied}
                onCheckedChange={setProxied}
                size="sm"
              />
            ) : record.proxied ? (
              <Badge className="border-orange-500/20 bg-orange-500/10 text-[10px] font-bold tracking-widest text-orange-500 uppercase hover:bg-orange-500/10">
                Proxied
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="border-white/10 text-[10px] font-bold tracking-widest text-zinc-500 uppercase"
              >
                DNS only
              </Badge>
            )}
          </TableCell>
        )}
        <TableCell className="pr-8 text-right">
          {editing ? (
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={saving}
                className="size-8 p-0 text-zinc-500 hover:bg-white/5 hover:text-white"
              >
                <X className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="size-8 p-0 text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-400"
              >
                <Check className="size-4" />
              </Button>
            </div>
          ) : (
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditing(true)}
                className="size-8 p-0 text-zinc-500 hover:bg-white/5 hover:text-white"
              >
                <Pencil className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmOpen(true)}
                disabled={deleting}
                className="size-8 p-0 text-zinc-500 hover:bg-red-500/10 hover:text-red-500"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          )}
        </TableCell>
      </TableRow>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="border-white/10 bg-zinc-900 shadow-2xl backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold text-white">
              Delete record
            </AlertDialogTitle>
            <AlertDialogDescription className="font-serif text-zinc-500 italic">
              Are you sure you want to banish the record{" "}
              <span className="font-bold text-amber-500 not-italic">
                {record.name}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleting}
              className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
              Cancel
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-500/80 font-bold hover:bg-red-500"
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
