'use client';

import { Download, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type DnsRecord = {
  id: string;
  name: string;
  type: string;
  content: string;
  ttl?: number;
  priority?: number;
  proxied?: boolean;
};

function recordsToCsv(records: DnsRecord[]): string {
  const header = 'Name,Type,Content,TTL,Priority';
  const rows = records.map(
    (r) =>
      `${r.name},${r.type},"${r.content.replace(/"/g, '""')}",${r.ttl ?? ''},${r.priority ?? ''}`,
  );
  return [header, ...rows].join('\n');
}

function recordsToZone(records: DnsRecord[], domain: string): string {
  const lines = [
    `; Zone file for ${domain}`,
    `; Exported ${new Date().toISOString()}`,
    `$ORIGIN ${domain}.`,
    '',
  ];
  for (const r of records) {
    const name = r.name === domain ? '@' : r.name.replace(`.${domain}`, '');
    const ttl = r.ttl ?? 3600;
    const content =
      r.type === 'MX'
        ? `${r.priority ?? 10} ${r.content}.`
        : r.type === 'CNAME' || r.type === 'NS'
          ? `${r.content}.`
          : r.type === 'TXT'
            ? `"${r.content}"`
            : r.content;
    lines.push(`${name}\t${ttl}\tIN\t${r.type}\t${content}`);
  }
  return lines.join('\n');
}

function parseZoneFile(
  text: string,
  domain: string,
): {
  subdomain: string;
  recordType: string;
  content: string;
  ttl?: number;
  priority?: number;
}[] {
  const results: {
    subdomain: string;
    recordType: string;
    content: string;
    ttl?: number;
    priority?: number;
  }[] = [];

  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith(';') || trimmed.startsWith('$'))
      continue;

    // Parse: name [ttl] [class] type content
    const parts = trimmed.split(/\s+/);
    if (parts.length < 4) continue;

    let idx = 0;
    const name = parts[idx++];

    // Optional TTL (numeric)
    let ttl: number | undefined;
    if (/^\d+$/.test(parts[idx])) {
      ttl = Number(parts[idx++]);
    }

    // Optional class (IN)
    if (parts[idx] === 'IN') idx++;

    const recordType = parts[idx++];
    if (!['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS'].includes(recordType))
      continue;

    let priority: number | undefined;
    if (recordType === 'MX' && /^\d+$/.test(parts[idx])) {
      priority = Number(parts[idx++]);
    }

    let content = parts.slice(idx).join(' ');
    // Strip trailing dots and quotes
    content = content.replace(/\.+$/, '').replace(/^"|"$/g, '');

    const subdomain =
      name === '@' || name === domain || name === `${domain}.`
        ? '@'
        : name.replace(`.${domain}`, '').replace(/\.+$/, '');

    results.push({ subdomain, recordType, content, ttl, priority });
  }

  return results;
}

function parseCsvFile(text: string): {
  subdomain: string;
  recordType: string;
  content: string;
  ttl?: number;
  priority?: number;
}[] {
  const results: {
    subdomain: string;
    recordType: string;
    content: string;
    ttl?: number;
    priority?: number;
  }[] = [];

  const lines = text.split('\n').slice(1); // Skip header
  for (const line of lines) {
    if (!line.trim()) continue;

    // Simple CSV parse handling quoted fields
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    fields.push(current.trim());

    if (fields.length < 3) continue;

    const [name, recordType, content, ttlStr, priorityStr] = fields;
    if (!['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS'].includes(recordType))
      continue;

    results.push({
      subdomain: name,
      recordType,
      content,
      ttl: ttlStr ? Number(ttlStr) : undefined,
      priority: priorityStr ? Number(priorityStr) : undefined,
    });
  }

  return results;
}

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function DnsExportImport({
  records,
  domain,
  projectId,
  platform,
}: {
  records: DnsRecord[];
  domain: string;
  projectId: string;
  platform: string;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  function exportCsv() {
    downloadFile(recordsToCsv(records), `${domain}-dns.csv`, 'text/csv');
    toast.success('Exported as CSV');
  }

  function exportZone() {
    downloadFile(
      recordsToZone(records, domain),
      `${domain}-dns.zone`,
      'text/plain',
    );
    toast.success('Exported as zone file');
  }

  async function handleImport(file: File) {
    setImporting(true);
    try {
      const text = await file.text();
      const isZone =
        file.name.endsWith('.zone') ||
        file.name.endsWith('.txt') ||
        text.includes('$ORIGIN') ||
        text.includes('\tIN\t');

      const parsed = isZone ? parseZoneFile(text, domain) : parseCsvFile(text);

      if (parsed.length === 0) {
        toast.error('No valid records found in file');
        return;
      }

      const MAX_IMPORT_RECORDS = 100;
      if (parsed.length > MAX_IMPORT_RECORDS) {
        toast.error(
          `Import limited to ${MAX_IMPORT_RECORDS} records at a time (file has ${parsed.length})`,
        );
        return;
      }

      let success = 0;
      let failed = 0;

      for (const rec of parsed) {
        try {
          const res = await fetch(`/api/projects/${projectId}/dns`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subdomain: rec.subdomain,
              recordType: rec.recordType,
              content: rec.content,
              ttl: rec.ttl,
              priority: rec.priority,
              proxied: platform === 'cloudflare' ? false : undefined,
            }),
          });
          if (res.ok) success++;
          else failed++;
        } catch {
          failed++;
        }
      }

      if (success > 0) {
        toast.success(`Imported ${success} record${success > 1 ? 's' : ''}`);
        router.refresh();
      }
      if (failed > 0) {
        toast.error(
          `Failed to import ${failed} record${failed > 1 ? 's' : ''}`,
        );
      }
    } catch {
      toast.error('Failed to read file');
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".csv,.zone,.txt"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImport(file);
        }}
      />

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="sm"
              disabled={importing}
              className="h-9 gap-2 border border-white/10 bg-white/5 text-xs font-medium text-zinc-400 hover:bg-white/10 hover:text-white"
            />
          }
        >
          <Download className="size-3.5" />
          {importing ? 'Importing...' : 'Export / Import'}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="min-w-48 border-white/10 bg-zinc-900 shadow-2xl backdrop-blur-xl"
        >
          <DropdownMenuItem
            onClick={exportCsv}
            className="cursor-pointer px-2.5 py-1.5 font-bold text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <Download className="mr-2 size-4" />
            Export as CSV
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={exportZone}
            className="cursor-pointer px-2.5 py-1.5 font-bold text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <Download className="mr-2 size-4" />
            Export as Zone File
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => fileRef.current?.click()}
            className="cursor-pointer px-2.5 py-1.5 font-bold text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <Upload className="mr-2 size-4" />
            Import from File
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
