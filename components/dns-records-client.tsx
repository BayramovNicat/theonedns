'use client';

import { Search, ShieldCheck, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { DnsAuditDialog } from '@/components/dns-audit-dialog';
import { DnsExportImport } from '@/components/dns-export-import';
import { SubdomainRow } from '@/components/subdomain-row';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type DnsRecord = {
  id: string;
  name: string;
  type: string;
  content: string;
  ttl?: number;
  priority?: number;
  proxied?: boolean;
};

export function DnsRecordsClient({
  records,
  projectId,
  platform,
  domain,
}: {
  records: DnsRecord[];
  projectId: string;
  platform: string;
  domain: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [auditOpen, setAuditOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((r) => r.id)));
    }
  }

  async function handleBulkDelete() {
    setBulkDeleting(true);
    let success = 0;
    let failed = 0;

    for (const id of selected) {
      try {
        const res = await fetch(`/api/projects/${projectId}/dns`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recordId: id }),
        });
        if (res.ok) success++;
        else failed++;
      } catch {
        failed++;
      }
    }

    if (success > 0) {
      toast.success(`Deleted ${success} record${success > 1 ? 's' : ''}`);
      router.refresh();
    }
    if (failed > 0) {
      toast.error(`Failed to delete ${failed} record${failed > 1 ? 's' : ''}`);
    }

    setSelected(new Set());
    setBulkDeleting(false);
    setBulkDeleteOpen(false);
  }

  const types = useMemo(() => {
    const set = new Set(records.map((r) => r.type));
    return Array.from(set).sort();
  }, [records]);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const filtered = useMemo(() => {
    let result = records;
    if (typeFilter) {
      result = result.filter((r) => r.type === typeFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.content.toLowerCase().includes(q),
      );
    }
    return result;
  }, [records, typeFilter, search]);

  const showProxy = platform === 'cloudflare';

  return (
    <div>
      <div className="flex flex-col gap-3 border-b border-white/5 px-8 py-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Search records..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 border-white/10 bg-white/5 pl-9 text-sm text-white placeholder:text-zinc-600"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAuditOpen(true)}
            className="h-9 gap-2 border border-white/10 bg-white/5 text-xs font-medium text-zinc-400 hover:bg-white/10 hover:text-white"
          >
            <ShieldCheck className="size-3.5" />
            Health Audit
          </Button>
          <DnsExportImport
            records={records}
            domain={domain}
            projectId={projectId}
            platform={platform}
          />
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setTypeFilter(null)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
              typeFilter === null
                ? 'border border-amber-500/40 bg-amber-500/20 text-amber-400'
                : 'border border-white/5 bg-white/5 text-zinc-500 hover:border-white/10'
            }`}
          >
            All
          </button>
          {types.map((t) => (
            <button
              type="button"
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                typeFilter === t
                  ? 'border border-amber-500/40 bg-amber-500/20 text-amber-400'
                  : 'border border-white/5 bg-white/5 text-zinc-500 hover:border-white/10'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="px-8 py-16 text-center">
          <p className="font-serif text-sm text-zinc-500 italic">
            No records match your search.
          </p>
        </div>
      ) : (
        <>
          {selected.size > 0 && (
            <div className="flex items-center gap-3 border-b border-white/5 bg-amber-500/5 px-8 py-3">
              <span className="text-sm font-medium text-amber-400">
                {selected.size} selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setBulkDeleteOpen(true)}
                className="h-7 gap-1.5 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300"
              >
                <Trash2 className="size-3" />
                Delete
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelected(new Set())}
                className="h-7 text-xs text-zinc-500 hover:bg-white/5 hover:text-white"
              >
                Clear
              </Button>
            </div>
          )}
          <div className="relative overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="w-10 pl-8">
                    <input
                      type="checkbox"
                      checked={
                        filtered.length > 0 && selected.size === filtered.length
                      }
                      onChange={toggleAll}
                      className="size-3.5 cursor-pointer appearance-none rounded border border-white/20 bg-white/5 checked:border-amber-500 checked:bg-amber-500"
                    />
                  </TableHead>
                  <TableHead className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                    Name
                  </TableHead>
                  <TableHead className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                    Type
                  </TableHead>
                  <TableHead className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                    Content
                  </TableHead>
                  <TableHead className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                    TTL
                  </TableHead>
                  {showProxy && (
                    <TableHead className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                      Proxy
                    </TableHead>
                  )}
                  <TableHead className="pr-8 text-right text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((record) => (
                  <SubdomainRow
                    key={record.id}
                    record={record}
                    projectId={projectId}
                    platform={platform}
                    selected={selected.has(record.id)}
                    onToggleSelect={() => toggleSelect(record.id)}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
      <DnsAuditDialog
        records={records}
        domain={domain}
        open={auditOpen}
        onOpenChange={setAuditOpen}
      />

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent className="border-white/10 bg-zinc-900 shadow-2xl backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold text-white">
              Delete {selected.size} records
            </AlertDialogTitle>
            <AlertDialogDescription className="font-serif text-zinc-500 italic">
              Are you sure you want to banish{' '}
              <span className="font-bold text-amber-500 not-italic">
                {selected.size}
              </span>{' '}
              record{selected.size > 1 ? 's' : ''}? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={bulkDeleting}
              className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
              Cancel
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="bg-red-500/80 font-bold hover:bg-red-500"
            >
              {bulkDeleting ? 'Deleting...' : 'Delete all'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
