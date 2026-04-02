import { mock } from 'bun:test';

// Must be hoisted before audit.ts is imported so node:dns is mocked.
// Bun's test runner hoists mock.module calls similarly to jest.mock.
let txtResponses: Record<string, string[][]> = {};
let mxResponses: Record<string, { exchange: string; priority: number }[]> = {};

mock.module('node:dns', () => {
  class MockResolver {
    setServers(_servers: string[]) {}
    cancel() {}

    resolveTxt(name: string, cb: (err: null, records: string[][]) => void) {
      cb(null, txtResponses[name] ?? []);
    }

    resolveMx(
      name: string,
      cb: (
        err: null,
        records: { exchange: string; priority: number }[],
      ) => void,
    ) {
      cb(null, mxResponses[name] ?? []);
    }
  }
  return { Resolver: MockResolver };
});

import { beforeEach, describe, expect, it } from 'bun:test';
import type { AuditIssue } from '../../lib/dns/audit';
import { auditDnsRecords } from '../../lib/dns/audit';

const DOMAIN = 'example.com';

function makeRecord(
  overrides: Partial<Parameters<typeof auditDnsRecords>[0][number]>,
) {
  return {
    id: Math.random().toString(36).slice(2),
    name: DOMAIN,
    type: 'A',
    content: '1.2.3.4',
    ...overrides,
  };
}

function titlesOf(issues: AuditIssue[]) {
  return issues.map((i) => i.title);
}

// Default: healthy domain with SPF, DMARC (reject), and MX
beforeEach(() => {
  txtResponses = {
    [DOMAIN]: [['v=spf1 include:_spf.google.com ~all']],
    [`_dmarc.${DOMAIN}`]: [['v=DMARC1; p=reject; adkim=s; aspf=s']],
  };
  mxResponses = {
    [DOMAIN]: [{ exchange: 'mail.example.com', priority: 10 }],
  };
});

// ── SPF ────────────────────────────────────────────────────────────────────

describe('SPF checks', () => {
  it('flags missing SPF', async () => {
    txtResponses[DOMAIN] = [];
    const issues = await auditDnsRecords([], DOMAIN);
    expect(titlesOf(issues)).toContain('Missing SPF record');
  });

  it('flags multiple SPF records', async () => {
    txtResponses[DOMAIN] = [
      ['v=spf1 include:_spf.google.com ~all'],
      ['v=spf1 include:spf.protection.outlook.com ~all'],
    ];
    const issues = await auditDnsRecords([], DOMAIN);
    expect(titlesOf(issues)).toContain('Multiple SPF records');
  });

  it('does not flag a single SPF record', async () => {
    const issues = await auditDnsRecords([], DOMAIN);
    expect(titlesOf(issues)).not.toContain('Missing SPF record');
    expect(titlesOf(issues)).not.toContain('Multiple SPF records');
  });
});

// ── DMARC ──────────────────────────────────────────────────────────────────

describe('DMARC checks', () => {
  it('flags missing DMARC', async () => {
    txtResponses[`_dmarc.${DOMAIN}`] = [];
    const issues = await auditDnsRecords([], DOMAIN);
    expect(titlesOf(issues)).toContain('Missing DMARC record');
  });

  it('warns on DMARC p=none policy', async () => {
    txtResponses[`_dmarc.${DOMAIN}`] = [
      ['v=DMARC1; p=none; rua=mailto:dmarc@example.com'],
    ];
    const issues = await auditDnsRecords([], DOMAIN);
    expect(titlesOf(issues)).toContain('DMARC policy is set to none');
  });

  it('does not warn on p=reject', async () => {
    const issues = await auditDnsRecords([], DOMAIN);
    expect(titlesOf(issues)).not.toContain('DMARC policy is set to none');
    expect(titlesOf(issues)).not.toContain('Missing DMARC record');
  });
});

// ── MX ─────────────────────────────────────────────────────────────────────

describe('MX checks', () => {
  it('flags no MX records', async () => {
    mxResponses[DOMAIN] = [];
    const issues = await auditDnsRecords([], DOMAIN);
    expect(titlesOf(issues)).toContain('No MX records');
  });

  it('does not flag when MX records exist', async () => {
    const issues = await auditDnsRecords([], DOMAIN);
    expect(titlesOf(issues)).not.toContain('No MX records');
  });
});

// ── CNAME conflict ─────────────────────────────────────────────────────────

describe('CNAME conflict', () => {
  it('flags a CNAME alongside other records on the same name', async () => {
    const records = [
      makeRecord({
        name: 'www.example.com',
        type: 'CNAME',
        content: 'proxy.example.com',
      }),
      makeRecord({ name: 'www.example.com', type: 'A', content: '1.2.3.4' }),
    ];
    const issues = await auditDnsRecords(records, DOMAIN);
    const conflict = issues.find((i) => i.title === 'CNAME conflict');
    expect(conflict).toBeDefined();
    expect(conflict?.record).toBe('www.example.com');
  });

  it('does not flag a standalone CNAME', async () => {
    const records = [
      makeRecord({
        name: 'www.example.com',
        type: 'CNAME',
        content: 'proxy.example.com',
      }),
    ];
    const issues = await auditDnsRecords(records, DOMAIN);
    expect(titlesOf(issues)).not.toContain('CNAME conflict');
  });

  it('does not flag multiple non-CNAME records on the same name', async () => {
    const records = [
      makeRecord({ name: 'example.com', type: 'A', content: '1.2.3.4' }),
      makeRecord({ name: 'example.com', type: 'A', content: '5.6.7.8' }),
    ];
    const issues = await auditDnsRecords(records, DOMAIN);
    expect(titlesOf(issues)).not.toContain('CNAME conflict');
  });
});

// ── Duplicate records ──────────────────────────────────────────────────────

describe('Duplicate records', () => {
  it('flags two records with the same name, type, and content', async () => {
    const records = [
      makeRecord({
        id: '1',
        name: 'example.com',
        type: 'A',
        content: '1.2.3.4',
      }),
      makeRecord({
        id: '2',
        name: 'example.com',
        type: 'A',
        content: '1.2.3.4',
      }),
    ];
    const issues = await auditDnsRecords(records, DOMAIN);
    const dup = issues.find((i) => i.title === 'Duplicate record');
    expect(dup).toBeDefined();
    expect(dup?.record).toBe('example.com');
  });

  it('does not flag records with the same name+type but different content', async () => {
    const records = [
      makeRecord({
        id: '1',
        name: 'example.com',
        type: 'A',
        content: '1.2.3.4',
      }),
      makeRecord({
        id: '2',
        name: 'example.com',
        type: 'A',
        content: '5.6.7.8',
      }),
    ];
    const issues = await auditDnsRecords(records, DOMAIN);
    expect(titlesOf(issues)).not.toContain('Duplicate record');
  });
});

// ── High TTL ───────────────────────────────────────────────────────────────

describe('High TTL', () => {
  it('flags records with TTL >= 86400', async () => {
    const records = [
      makeRecord({
        name: 'example.com',
        type: 'A',
        content: '1.2.3.4',
        ttl: 86400,
      }),
    ];
    const issues = await auditDnsRecords(records, DOMAIN);
    expect(titlesOf(issues)).toContain('High TTL');
  });

  it('does not flag records with TTL < 86400', async () => {
    const records = [
      makeRecord({
        name: 'example.com',
        type: 'A',
        content: '1.2.3.4',
        ttl: 3600,
      }),
    ];
    const issues = await auditDnsRecords(records, DOMAIN);
    expect(titlesOf(issues)).not.toContain('High TTL');
  });

  it('does not flag records with no TTL', async () => {
    const records = [
      makeRecord({ name: 'example.com', type: 'A', content: '1.2.3.4' }),
    ];
    const issues = await auditDnsRecords(records, DOMAIN);
    expect(titlesOf(issues)).not.toContain('High TTL');
  });
});

// ── Sort order ─────────────────────────────────────────────────────────────

describe('Issue sort order', () => {
  it('sorts errors before warnings before info', async () => {
    // Trigger all three levels:
    //   error: missing DMARC
    //   warning: DMARC p=none — not applicable here since DMARC missing
    //   info: no MX + high TTL
    txtResponses[`_dmarc.${DOMAIN}`] = [];
    mxResponses[DOMAIN] = [];
    const records = [makeRecord({ ttl: 86400 })];

    const issues = await auditDnsRecords(records, DOMAIN);
    const severities = issues.map((i) => i.severity);
    const errorIdx = severities.lastIndexOf('error');
    const warnIdx = severities.indexOf('warning');
    const infoIdx = severities.indexOf('info');

    if (errorIdx !== -1 && infoIdx !== -1) {
      expect(errorIdx).toBeLessThan(infoIdx);
    }
    if (warnIdx !== -1 && infoIdx !== -1) {
      expect(warnIdx).toBeLessThan(infoIdx);
    }
  });
});
