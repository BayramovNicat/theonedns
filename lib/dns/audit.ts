import { Resolver } from 'node:dns';

type DnsRecord = {
  id: string;
  name: string;
  type: string;
  content: string;
  ttl?: number;
  priority?: number;
  proxied?: boolean;
};

export type AuditSeverity = 'error' | 'warning' | 'info';

export type AuditIssue = {
  severity: AuditSeverity;
  title: string;
  description: string;
  record?: string;
};

function resolveWithTimeout(
  name: string,
  type: string,
  server = '8.8.8.8',
): Promise<string[]> {
  return new Promise((resolve) => {
    const resolver = new Resolver();
    resolver.setServers([server]);

    const timeout = setTimeout(() => {
      resolver.cancel();
      resolve([]);
    }, 5000);

    const cb = (err: NodeJS.ErrnoException | null, records: unknown) => {
      clearTimeout(timeout);
      if (err) {
        resolve([]);
        return;
      }
      if (Array.isArray(records)) {
        resolve(
          records.map((r) => (Array.isArray(r) ? r.join('') : String(r))),
        );
      } else {
        resolve([]);
      }
    };

    switch (type) {
      case 'TXT':
        resolver.resolveTxt(name, cb);
        break;
      case 'MX':
        resolver.resolveMx(name, (err, records) => {
          clearTimeout(timeout);
          if (err || !records) {
            resolve([]);
            return;
          }
          resolve(records.map((r) => `${r.priority} ${r.exchange}`));
        });
        break;
      default:
        clearTimeout(timeout);
        resolve([]);
    }
  });
}

export async function auditDnsRecords(
  records: DnsRecord[],
  domain: string,
): Promise<AuditIssue[]> {
  const issues: AuditIssue[] = [];

  // Check from actual DNS for SPF/DMARC (catches records not in the provider)
  const [liveTxt, liveDmarcTxt, liveMx] = await Promise.all([
    resolveWithTimeout(domain, 'TXT'),
    resolveWithTimeout(`_dmarc.${domain}`, 'TXT'),
    resolveWithTimeout(domain, 'MX'),
  ]);

  // --- SPF check ---
  const spfRecords = liveTxt.filter((r) => r.startsWith('v=spf1'));
  if (spfRecords.length === 0) {
    issues.push({
      severity: 'error',
      title: 'Missing SPF record',
      description:
        'No SPF record found. Email from this domain may be marked as spam. Add a TXT record with your SPF policy.',
    });
  } else if (spfRecords.length > 1) {
    issues.push({
      severity: 'error',
      title: 'Multiple SPF records',
      description:
        'Multiple SPF records found. RFC 7208 requires exactly one SPF record per domain. Merge them into a single record.',
    });
  }

  // --- DMARC check ---
  const dmarcRecords = liveDmarcTxt.filter((r) => r.startsWith('v=DMARC1'));
  if (dmarcRecords.length === 0) {
    issues.push({
      severity: 'error',
      title: 'Missing DMARC record',
      description:
        'No DMARC record found at _dmarc.' +
        domain +
        '. Add a DMARC policy to prevent email spoofing.',
    });
  } else {
    const dmarc = dmarcRecords[0];
    if (dmarc.includes('p=none')) {
      issues.push({
        severity: 'warning',
        title: 'DMARC policy is set to none',
        description:
          'Your DMARC policy is monitoring-only (p=none). Consider upgrading to p=quarantine or p=reject for better protection.',
      });
    }
  }

  // --- MX check ---
  if (liveMx.length === 0) {
    issues.push({
      severity: 'info',
      title: 'No MX records',
      description:
        'No MX records found. This domain cannot receive email. Add MX records if email is needed.',
    });
  }

  // --- Conflicting CNAME + other records on same name ---
  const byName = new Map<string, DnsRecord[]>();
  for (const r of records) {
    const existing = byName.get(r.name) ?? [];
    existing.push(r);
    byName.set(r.name, existing);
  }

  for (const [name, recs] of byName) {
    const hasCname = recs.some((r) => r.type === 'CNAME');
    if (hasCname && recs.length > 1) {
      issues.push({
        severity: 'error',
        title: 'CNAME conflict',
        description: `${name} has a CNAME record alongside other records. CNAME must be the only record for a name (RFC 1034).`,
        record: name,
      });
    }
  }

  // --- Duplicate records ---
  const seen = new Set<string>();
  for (const r of records) {
    const key = `${r.name}|${r.type}|${r.content}`;
    if (seen.has(key)) {
      issues.push({
        severity: 'warning',
        title: 'Duplicate record',
        description: `${r.name} has duplicate ${r.type} records with the same content (${r.content}).`,
        record: r.name,
      });
    }
    seen.add(key);
  }

  // --- High TTL warning ---
  for (const r of records) {
    if (r.ttl && r.ttl >= 86400) {
      issues.push({
        severity: 'info',
        title: 'High TTL',
        description: `${r.name} (${r.type}) has a TTL of ${Math.round(r.ttl / 3600)}h. Changes will be slow to propagate.`,
        record: r.name,
      });
    }
  }

  // Sort: errors first, then warnings, then info
  const order: Record<AuditSeverity, number> = {
    error: 0,
    warning: 1,
    info: 2,
  };
  issues.sort((a, b) => order[a.severity] - order[b.severity]);

  return issues;
}
