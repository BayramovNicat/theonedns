'use client';

import {
  Calendar,
  Edit,
  Filter,
  History,
  Loader2,
  Minus,
  Plus,
  RefreshCw,
  Trash2,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type DnsChange = {
  id: string;
  action: 'create' | 'update' | 'delete';
  record_type: string;
  record_name: string;
  old_value: {
    type?: string;
    content?: string;
    ttl?: number;
    priority?: number;
    proxied?: boolean;
  } | null;
  new_value: {
    type?: string;
    content?: string;
    ttl?: number;
    priority?: number;
    proxied?: boolean;
  } | null;
  created_at: string;
};

const actionConfig = {
  create: {
    icon: Plus,
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    label: 'Created',
  },
  update: {
    icon: Edit,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    label: 'Updated',
  },
  delete: {
    icon: Trash2,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    label: 'Deleted',
  },
};

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

function ChangeDetails({ change }: { change: DnsChange }) {
  const { old_value, new_value, action } = change;

  if (action === 'create' && new_value) {
    return (
      <div className="mt-2 space-y-1 text-sm">
        <div className="text-zinc-400">
          <span className="text-zinc-500">Type:</span> {new_value.type}
        </div>
        <div className="text-zinc-400">
          <span className="text-zinc-500">Content:</span> {new_value.content}
        </div>
        {new_value.ttl && (
          <div className="text-zinc-400">
            <span className="text-zinc-500">TTL:</span> {new_value.ttl}
          </div>
        )}
        {new_value.priority !== undefined && (
          <div className="text-zinc-400">
            <span className="text-zinc-500">Priority:</span>{' '}
            {new_value.priority}
          </div>
        )}
        {new_value.proxied !== undefined && (
          <div className="text-zinc-400">
            <span className="text-zinc-500">Proxied:</span>{' '}
            {new_value.proxied ? 'Yes' : 'No'}
          </div>
        )}
      </div>
    );
  }

  if (action === 'delete' && old_value) {
    return (
      <div className="mt-2 space-y-1 text-sm">
        <div className="text-zinc-400 line-through">
          <span className="text-zinc-500">Type:</span> {old_value.type}
        </div>
        <div className="text-zinc-400 line-through">
          <span className="text-zinc-500">Content:</span> {old_value.content}
        </div>
        {old_value.ttl && (
          <div className="text-zinc-400 line-through">
            <span className="text-zinc-500">TTL:</span> {old_value.ttl}
          </div>
        )}
      </div>
    );
  }

  if (action === 'update' && old_value && new_value) {
    const changes: { field: string; old: string; new: string }[] = [];

    if (old_value.type !== new_value.type && new_value.type) {
      changes.push({
        field: 'Type',
        old: old_value.type || '',
        new: new_value.type,
      });
    }
    if (old_value.content !== new_value.content && new_value.content) {
      changes.push({
        field: 'Content',
        old: old_value.content || '',
        new: new_value.content,
      });
    }
    if (old_value.ttl !== new_value.ttl && new_value.ttl !== undefined) {
      changes.push({
        field: 'TTL',
        old: String(old_value.ttl || ''),
        new: String(new_value.ttl),
      });
    }
    if (
      old_value.priority !== new_value.priority &&
      new_value.priority !== undefined
    ) {
      changes.push({
        field: 'Priority',
        old: String(old_value.priority || ''),
        new: String(new_value.priority),
      });
    }
    if (
      old_value.proxied !== new_value.proxied &&
      new_value.proxied !== undefined
    ) {
      changes.push({
        field: 'Proxied',
        old: old_value.proxied ? 'Yes' : 'No',
        new: new_value.proxied ? 'Yes' : 'No',
      });
    }

    return (
      <div className="mt-2 space-y-2 text-sm">
        {changes.map((change, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="text-zinc-500">{change.field}:</span>
            <span className="text-red-400 line-through">{change.old}</span>
            <Minus className="h-3 w-3 text-zinc-600" />
            <span className="text-green-400">{change.new}</span>
          </div>
        ))}
      </div>
    );
  }

  return null;
}

export function DnsHistoryDialog({
  projectId,
  open,
  onOpenChange,
}: {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [changes, setChanges] = useState<DnsChange[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [recordTypeFilter, setRecordTypeFilter] = useState<string>('all');

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (actionFilter !== 'all') params.set('action', actionFilter);
      if (recordTypeFilter !== 'all')
        params.set('recordType', recordTypeFilter);

      const res = await fetch(
        `/api/projects/${projectId}/dns/history?${params.toString()}`,
      );
      const data = await res.json();
      setChanges(data.changes ?? []);
    } catch {
      setChanges([]);
    } finally {
      setLoading(false);
    }
  }, [projectId, actionFilter, recordTypeFilter]);

  useEffect(() => {
    if (open) fetchHistory();
  }, [open, fetchHistory]);

  const recordTypes = Array.from(
    new Set(changes.map((c) => c.record_type)),
  ).sort();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[80vh] max-w-3xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            DNS Change History
          </DialogTitle>
          <DialogDescription>
            View all DNS record changes for this project
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 border-b border-zinc-800 pb-4">
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[140px]" size="default">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="create">Created</SelectItem>
              <SelectItem value="update">Updated</SelectItem>
              <SelectItem value="delete">Deleted</SelectItem>
            </SelectContent>
          </Select>

          <Select value={recordTypeFilter} onValueChange={setRecordTypeFilter}>
            <SelectTrigger className="w-[140px]" size="default">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {recordTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="lg"
            onClick={fetchHistory}
            disabled={loading}
            className="ml-auto h-10"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto pr-2">
          {loading && changes.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
            </div>
          ) : changes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <History className="mb-3 h-12 w-12 text-zinc-700" />
              <p className="text-zinc-400">No changes recorded yet</p>
              <p className="mt-1 text-sm text-zinc-600">
                DNS record changes will appear here
              </p>
            </div>
          ) : (
            changes.map((change) => {
              const config = actionConfig[change.action];
              const Icon = config.icon;

              return (
                <div
                  key={change.id}
                  className="rounded-lg border border-zinc-800 p-4 transition-colors hover:border-zinc-700"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`${config.bg} flex-shrink-0 rounded-lg p-2`}
                    >
                      <Icon className={`h-4 w-4 ${config.color}`} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className={`font-medium ${config.color}`}>
                          {config.label}
                        </span>
                        <span className="text-zinc-400">
                          {change.record_type}
                        </span>
                        <span className="text-zinc-500">record</span>
                        <code className="rounded bg-zinc-900 px-2 py-0.5 text-sm text-zinc-300">
                          {change.record_name}
                        </code>
                      </div>

                      <ChangeDetails change={change} />

                      <div className="mt-3 flex items-center gap-2 text-xs text-zinc-600">
                        <Calendar className="h-3 w-3" />
                        {formatDate(change.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
