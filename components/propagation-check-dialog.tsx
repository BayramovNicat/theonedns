"use client";

import { CheckCircle2, Globe, Loader2, RefreshCw, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ResolverResult = {
  resolver: string;
  ip: string;
  values: string[];
  match: boolean;
  error?: string;
  latencyMs: number;
};

export function PropagationCheckDialog({
  record,
  open,
  onOpenChange,
}: {
  record: { name: string; type: string; content: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [results, setResults] = useState<ResolverResult[]>([]);
  const [loading, setLoading] = useState(false);

  const check = useCallback(async () => {
    setLoading(true);
    setResults([]);
    try {
      const res = await fetch("/api/dns/propagation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: record.name,
          type: record.type,
          expected: record.content,
        }),
      });
      const data = await res.json();
      setResults(data.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [record.name, record.type, record.content]);

  useEffect(() => {
    if (open) check();
  }, [open, check]);

  const matched = results.filter((r) => r.match).length;
  const total = results.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-zinc-900 shadow-2xl backdrop-blur-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-white">
            <Globe className="size-5 text-amber-500" />
            Propagation Check
          </DialogTitle>
          <DialogDescription className="font-serif text-zinc-500 italic break-all">
            Querying global resolvers for{" "}
            <span className="font-bold text-amber-500 not-italic">
              {record.name}
            </span>
          </DialogDescription>
        </DialogHeader>

        {!loading && total > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-24 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${(matched / total) * 100}%` }}
                />
              </div>
              <span className="text-sm text-zinc-400">
                {matched}/{total} propagated
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={check}
              disabled={loading}
              className="text-zinc-400 hover:bg-white/5 hover:text-white"
            >
              <RefreshCw className="mr-1.5 size-3.5" />
              Recheck
            </Button>
          </div>
        )}

        <div className="space-y-2">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/2 p-3"
                >
                  <Loader2 className="size-4 animate-spin text-zinc-500" />
                  <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
                  <div className="ml-auto h-4 w-16 animate-pulse rounded bg-white/10" />
                </div>
              ))
            : results.map((r) => (
                <div
                  key={r.resolver}
                  className="flex items-center gap-3 overflow-hidden rounded-lg border border-white/5 bg-white/2 p-3"
                >
                  {r.error ? (
                    <XCircle className="size-4 shrink-0 text-zinc-500" />
                  ) : r.match ? (
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                  ) : (
                    <XCircle className="size-4 shrink-0 text-red-400" />
                  )}

                  <div className="min-w-0 flex-1 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-white">
                        {r.resolver}
                      </span>
                      <span className="shrink-0 text-xs text-zinc-600">
                        {r.ip}
                      </span>
                    </div>
                    {r.error ? (
                      <span className="text-xs text-zinc-500">{r.error}</span>
                    ) : r.values.length > 0 ? (
                      <span
                        className="block break-all font-mono text-xs text-zinc-500"
                        title={r.values.join(", ")}
                      >
                        {r.values.join(", ")}
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-600">No records</span>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-[10px] text-zinc-600">
                      {r.latencyMs}ms
                    </span>
                    {!r.error && (
                      <Badge
                        className={
                          r.match
                            ? "border-emerald-500/20 bg-emerald-500/10 text-[10px] font-bold text-emerald-500 uppercase"
                            : "border-red-500/20 bg-red-500/10 text-[10px] font-bold text-red-400 uppercase"
                        }
                      >
                        {r.match ? "Resolved" : "Not found"}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
        </div>

        {!loading && total > 0 && matched === total && (
          <p className="text-center font-serif text-sm text-emerald-500/80 italic">
            Fully propagated across all resolvers
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
