"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Pencil, Trash2, Check, X } from "lucide-react";

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
  const [confirmOpen, setConfirmOpen] = useState(false);

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
      setConfirmOpen(false);
    }
  }

  return (
    <>
      <TableRow className="border-border/40">
        <TableCell className="pl-6 font-medium">{record.name}</TableCell>
        <TableCell>
          {editing ? (
            <Select value={recordType} onValueChange={setRecordType}>
              <SelectTrigger size="sm" className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A">A</SelectItem>
                <SelectItem value="AAAA">AAAA</SelectItem>
                <SelectItem value="CNAME">CNAME</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Badge variant="secondary" className="font-mono text-xs">
              {record.type}
            </Badge>
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
            <span className="text-muted-foreground font-mono text-sm">
              {record.content}
            </span>
          )}
        </TableCell>
        <TableCell>
          {editing ? (
            <Switch checked={proxied} onCheckedChange={setProxied} size="sm" />
          ) : record.proxied ? (
            <Badge className="border-0 bg-orange-500/10 text-orange-500 hover:bg-orange-500/10">
              Proxied
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              DNS only
            </Badge>
          )}
        </TableCell>
        <TableCell className="pr-6 text-right">
          {editing ? (
            <div className="flex justify-end gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={saving}
                className="size-8 p-0"
              >
                <X className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="size-8 p-0 text-green-500 hover:text-green-400"
              >
                <Check className="size-4" />
              </Button>
            </div>
          ) : (
            <div className="flex justify-end gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditing(true)}
                className="text-muted-foreground hover:text-foreground size-8 p-0"
              >
                <Pencil className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmOpen(true)}
                disabled={deleting}
                className="text-muted-foreground hover:text-destructive size-8 p-0"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          )}
        </TableCell>
      </TableRow>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="text-foreground font-medium">{record.name}</span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
