'use client';

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
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
  const [refreshing, setRefreshing] = useState(false);
  const [sortField, setSortField] = useState<
    'name' | 'type' | 'content' | 'ttl' | 'proxied' | null
  >(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(
    null,
  );

  function handleSort(field: 'name' | 'type' | 'content' | 'ttl' | 'proxied') {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortField(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/dns/clear-cache`, {
        method: 'POST',
      });
      if (res.ok) {
        router.refresh();
        toast.success('Records refreshed');
      } else {
        toast.error('Failed to clear cache');
      }
    } catch {
      toast.error('Failed to refresh');
    } finally {
      setRefreshing(false);
    }
  }

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

    const results = await Promise.allSettled(
      [...selected].map(async (id) => {
        const res = await fetch(`/api/projects/${projectId}/dns`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recordId: id }),
        });
        if (!res.ok) throw new Error('Delete failed');
      }),
    );

    const success = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

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

    // Apply sorting
    if (sortField && sortDirection) {
      result = [...result].sort((a, b) => {
        let aVal: string | number | boolean = '';
        let bVal: string | number | boolean = '';

        if (sortField === 'ttl') {
          aVal = a.ttl ?? 0;
          bVal = b.ttl ?? 0;
        } else if (sortField === 'proxied') {
          aVal = a.proxied ?? false;
          bVal = b.proxied ?? false;
        } else {
          aVal = (a[sortField] || '').toString().toLowerCase();
          bVal = (b[sortField] || '').toString().toLowerCase();
        }

        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [records, typeFilter, search, sortField, sortDirection]);

  const showProxy = platform === 'cloudflare';

  function getSortIcon(field: 'name' | 'type' | 'content' | 'ttl' | 'proxied') {
    if (sortField !== field) {
      return <ArrowUpDown className="size-3 text-zinc-600" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="size-3 text-amber-500" />;
    }
    if (sortDirection === 'desc') {
      return <ArrowDown className="size-3 text-amber-500" />;
    }
    return <ArrowUpDown className="size-3 text-zinc-600" />;
  }

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
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-9 gap-2 border border-white/10 bg-white/5 text-xs font-medium text-zinc-400 hover:bg-white/10 hover:text-white"
          >
            <RefreshCw
              className={`size-3.5 ${refreshing ? 'animate-spin' : ''}`}
            />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
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
                  <TableHead
                    className="cursor-pointer text-[10px] font-bold tracking-widest text-zinc-500 uppercase hover:text-zinc-400"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1">
                      Name
                      {getSortIcon('name')}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer text-[10px] font-bold tracking-widest text-zinc-500 uppercase hover:text-zinc-400"
                    onClick={() => handleSort('type')}
                  >
                    <div className="flex items-center gap-1">
                      Type
                      {getSortIcon('type')}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer text-[10px] font-bold tracking-widest text-zinc-500 uppercase hover:text-zinc-400"
                    onClick={() => handleSort('content')}
                  >
                    <div className="flex items-center gap-1">
                      Content
                      {getSortIcon('content')}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer text-[10px] font-bold tracking-widest text-zinc-500 uppercase hover:text-zinc-400"
                    onClick={() => handleSort('ttl')}
                  >
                    <div className="flex items-center gap-1">
                      TTL
                      {getSortIcon('ttl')}
                    </div>
                  </TableHead>
                  {showProxy && (
                    <TableHead
                      className="cursor-pointer text-[10px] font-bold tracking-widest text-zinc-500 uppercase hover:text-zinc-400"
                      onClick={() => handleSort('proxied')}
                    >
                      <div className="flex items-center gap-1">
                        Proxy
                        {getSortIcon('proxied')}
                      </div>
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
