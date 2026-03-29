'use client';

import { BookTemplate, Globe, Mail, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DNS_TEMPLATES, type DnsTemplate } from '@/lib/dns/templates';

const CATEGORY_META: Record<
  DnsTemplate['category'],
  { label: string; icon: typeof Mail }
> = {
  email: { label: 'Email', icon: Mail },
  hosting: { label: 'Hosting', icon: Globe },
  security: { label: 'Security', icon: Shield },
};

const CATEGORIES: DnsTemplate['category'][] = ['email', 'hosting', 'security'];

function hasPlaceholders(template: DnsTemplate): string[] {
  const placeholders = new Set<string>();
  for (const r of template.records) {
    const matches = r.content.matchAll(/\{\{(\w+)\}\}/g);
    for (const m of matches) {
      if (m[1] !== 'domain') placeholders.add(m[1]);
    }
  }
  return Array.from(placeholders);
}

function resolveContent(
  content: string,
  domain: string,
  vars: Record<string, string>,
): string {
  let result = content.replace(/\{\{domain\}\}/g, domain.replace(/\./g, '-'));
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  return result;
}

export function DnsTemplates({
  domain,
  projectId,
}: {
  domain: string;
  projectId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<DnsTemplate | null>(null);
  const [vars, setVars] = useState<Record<string, string>>({});
  const [applying, setApplying] = useState(false);

  function handleSelect(template: DnsTemplate) {
    const placeholders = hasPlaceholders(template);
    if (placeholders.length > 0) {
      setVars(Object.fromEntries(placeholders.map((p) => [p, ''])));
      setSelected(template);
    } else {
      setSelected(template);
      setVars({});
    }
  }

  function handleBack() {
    setSelected(null);
    setVars({});
  }

  async function handleApply() {
    if (!selected) return;

    const placeholders = hasPlaceholders(selected);
    for (const p of placeholders) {
      if (!vars[p]?.trim()) {
        toast.error(`Please fill in the "${p}" field`);
        return;
      }
    }

    setApplying(true);
    let created = 0;
    let failed = 0;

    for (const record of selected.records) {
      try {
        const res = await fetch(`/api/projects/${projectId}/dns`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subdomain: record.subdomain === '@' ? '@' : record.subdomain,
            recordType: record.recordType,
            content: resolveContent(record.content, domain, vars),
            ttl: record.ttl,
            priority: record.priority,
          }),
        });

        if (res.ok) {
          created++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    setApplying(false);

    if (failed === 0) {
      toast.success(
        `${selected.name} — ${created} record${created !== 1 ? 's' : ''} created`,
      );
    } else {
      toast.warning(
        `${created} created, ${failed} failed. Some records may already exist.`,
      );
    }

    setSelected(null);
    setVars({});
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setSelected(null);
          setVars({});
        }
      }}
    >
      <DialogTrigger className="group relative inline-flex h-10 items-center gap-2 overflow-hidden rounded-full border border-white/10 bg-white/5 px-6 text-xs font-black tracking-widest text-zinc-400 uppercase transition-all hover:border-white/20 hover:text-white active:scale-95">
        <BookTemplate className="relative z-10 size-4" />
        <span className="relative z-10">Templates</span>
      </DialogTrigger>
      <DialogContent className="border-white/10 bg-zinc-900 shadow-2xl backdrop-blur-xl sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">
            {selected ? selected.name : 'DNS Templates'}
          </DialogTitle>
          <p className="font-serif text-sm text-zinc-500 italic">
            {selected
              ? selected.description
              : 'Apply pre-configured DNS records with a single click.'}
          </p>
        </DialogHeader>

        {selected ? (
          <div className="mt-4 space-y-6">
            {/* Placeholder inputs */}
            {Object.keys(vars).length > 0 && (
              <div className="space-y-4">
                {Object.keys(vars).map((key) => (
                  <div key={key} className="space-y-2">
                    <Label className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                      {key}
                    </Label>
                    <Input
                      placeholder={key}
                      value={vars[key]}
                      onChange={(e) =>
                        setVars((prev) => ({ ...prev, [key]: e.target.value }))
                      }
                      className="border-white/10 bg-white/5 text-white placeholder:text-zinc-700"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Preview records */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                Records to create
              </p>
              <div className="space-y-2 rounded-2xl border border-white/5 bg-white/5 p-4">
                {selected.records.map((r) => (
                  <div
                    key={`${r.recordType}-${r.subdomain}-${r.content}`}
                    className="flex items-center gap-3 text-sm"
                  >
                    <Badge className="border-amber-500/20 bg-amber-500/10 text-[10px] font-bold text-amber-500 uppercase">
                      {r.recordType}
                    </Badge>
                    <span className="font-mono text-zinc-400">
                      {r.subdomain === '@'
                        ? domain
                        : `${r.subdomain}.${domain}`}
                    </span>
                    <span className="text-zinc-600">&rarr;</span>
                    <span className="truncate font-mono text-zinc-500">
                      {r.priority != null && `${r.priority} `}
                      {resolveContent(r.content, domain, vars)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={applying}
                className="flex-1 border border-white/10 text-zinc-400 hover:bg-white/5 hover:text-white"
              >
                Back
              </Button>
              <Button
                onClick={handleApply}
                disabled={applying}
                className="flex-1 bg-amber-500 font-bold text-black hover:bg-amber-400"
              >
                {applying
                  ? 'Applying...'
                  : `Apply ${selected.records.length} records`}
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-6">
            {CATEGORIES.map((cat) => {
              const meta = CATEGORY_META[cat];
              const Icon = meta.icon;
              const templates = DNS_TEMPLATES.filter((t) => t.category === cat);

              return (
                <div
                  key={cat}
                  className={cat === 'security' ? 'col-span-2' : ''}
                >
                  <div className="mb-3 flex items-center gap-2">
                    <Icon className="size-4 text-zinc-500" />
                    <h3 className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                      {meta.label}
                    </h3>
                  </div>
                  <div
                    className={`gap-2 ${cat === 'security' ? 'grid grid-cols-2' : 'space-y-2'}`}
                  >
                    {templates.map((t) => (
                      <button
                        type="button"
                        key={t.id}
                        onClick={() => handleSelect(t)}
                        className="flex w-full items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-left transition-all hover:border-white/10 hover:bg-white/8"
                      >
                        <div>
                          <p className="text-sm font-bold text-white">
                            {t.name}
                          </p>
                          <p className="font-serif text-xs text-zinc-500 italic">
                            {t.description}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="shrink-0 border-white/10 text-[10px] text-zinc-500"
                        >
                          {t.records.length} record
                          {t.records.length !== 1 && 's'}
                        </Badge>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
