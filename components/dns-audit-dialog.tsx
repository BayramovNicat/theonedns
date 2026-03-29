'use client';

import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type AuditSeverity = 'error' | 'warning' | 'info';

type AuditIssue = {
  severity: AuditSeverity;
  title: string;
  description: string;
  record?: string;
};

type DnsRecord = {
  id: string;
  name: string;
  type: string;
  content: string;
  ttl?: number;
  priority?: number;
  proxied?: boolean;
};

const severityConfig: Record<
  AuditSeverity,
  { icon: typeof XCircle; color: string; bg: string; border: string }
> = {
  error: {
    icon: XCircle,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  info: {
    icon: Info,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
};

export function DnsAuditDialog({
  records,
  domain,
  open,
  onOpenChange,
}: {
  records: DnsRecord[];
  domain: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [issues, setIssues] = useState<AuditIssue[]>([]);
  const [loading, setLoading] = useState(false);

  const audit = useCallback(async () => {
    setLoading(true);
    setIssues([]);
    try {
      const res = await fetch('/api/dns/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records, domain }),
      });
      const data = await res.json();
      setIssues(data.issues ?? []);
    } catch {
      setIssues([]);
    } finally {
      setLoading(false);
    }
  }, [records, domain]);

  useEffect(() => {
    if (open) audit();
  }, [open, audit]);

  const errors = issues.filter((i) => i.severity === 'error').length;
  const warnings = issues.filter((i) => i.severity === 'warning').length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-zinc-900 shadow-2xl backdrop-blur-xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-white">
            <ShieldCheck className="size-5 text-amber-500" />
            DNS Health Audit
          </DialogTitle>
          <DialogDescription className="font-serif text-zinc-500 italic">
            Checking configuration for{' '}
            <span className="font-bold text-amber-500 not-italic">
              {domain}
            </span>
          </DialogDescription>
        </DialogHeader>

        {!loading && issues.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm">
              {errors > 0 && (
                <span className="flex items-center gap-1 text-red-400">
                  <XCircle className="size-3.5" />
                  {errors} {errors === 1 ? 'error' : 'errors'}
                </span>
              )}
              {warnings > 0 && (
                <span className="flex items-center gap-1 text-amber-400">
                  <AlertTriangle className="size-3.5" />
                  {warnings} {warnings === 1 ? 'warning' : 'warnings'}
                </span>
              )}
              {errors === 0 && warnings === 0 && (
                <span className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 className="size-3.5" />
                  All checks passed
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={audit}
              disabled={loading}
              className="text-zinc-400 hover:bg-white/5 hover:text-white"
            >
              <RefreshCw className="mr-1.5 size-3.5" />
              Rerun
            </Button>
          </div>
        )}

        <div className="max-h-80 space-y-2 overflow-y-auto">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={`skeleton-${i}`}
                  className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/2 p-3"
                >
                  <Loader2 className="mt-0.5 size-4 animate-spin text-zinc-500" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
                    <div className="h-3 w-48 animate-pulse rounded bg-white/5" />
                  </div>
                </div>
              ))
            : issues.map((issue, i) => {
                const config = severityConfig[issue.severity];
                const Icon = config.icon;
                return (
                  <div
                    key={`issue-${i}`}
                    className={`flex items-start gap-3 rounded-lg border ${config.border} ${config.bg} p-3`}
                  >
                    <Icon
                      className={`mt-0.5 size-4 shrink-0 ${config.color}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white">
                        {issue.title}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-400">
                        {issue.description}
                      </p>
                    </div>
                  </div>
                );
              })}
        </div>

        {!loading && issues.length === 0 && (
          <div className="py-8 text-center">
            <CheckCircle2 className="mx-auto size-8 text-emerald-500" />
            <p className="mt-3 font-serif text-sm text-emerald-500/80 italic">
              All clear — no issues found
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
