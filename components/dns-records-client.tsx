"use client";

import { Search, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { DnsAuditDialog } from "@/components/dns-audit-dialog";
import { SubdomainRow } from "@/components/subdomain-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [auditOpen, setAuditOpen] = useState(false);

  const types = useMemo(() => {
    const set = new Set(records.map((r) => r.type));
    return Array.from(set).sort();
  }, [records]);

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
          r.content.toLowerCase().includes(q)
      );
    }
    return result;
  }, [records, typeFilter, search]);

  const showProxy = platform === "cloudflare";

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
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setAuditOpen(true)}
          className="h-9 gap-2 border border-white/10 bg-white/5 text-xs font-medium text-zinc-400 hover:bg-white/10 hover:text-white"
        >
          <ShieldCheck className="size-3.5" />
          Health Audit
        </Button>
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          <button
            onClick={() => setTypeFilter(null)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
              typeFilter === null
                ? "border border-amber-500/40 bg-amber-500/20 text-amber-400"
                : "border border-white/5 bg-white/5 text-zinc-500 hover:border-white/10"
            }`}
          >
            All
          </button>
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                typeFilter === t
                  ? "border border-amber-500/40 bg-amber-500/20 text-amber-400"
                  : "border border-white/5 bg-white/5 text-zinc-500 hover:border-white/10"
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
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="pl-8 text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
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
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <DnsAuditDialog
        records={records}
        domain={domain}
        open={auditOpen}
        onOpenChange={setAuditOpen}
      />
    </div>
  );
}
