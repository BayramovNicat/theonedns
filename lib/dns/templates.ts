export type DnsTemplate = {
  id: string;
  name: string;
  description: string;
  category: "email" | "hosting" | "security";
  records: {
    subdomain: string;
    recordType: string;
    content: string;
    priority?: number;
    ttl?: number;
  }[];
};

export const DNS_TEMPLATES: DnsTemplate[] = [
  // ── Email ──────────────────────────────────────────────
  {
    id: "google-workspace",
    name: "Google Workspace",
    description: "MX records for Gmail with Google Workspace",
    category: "email",
    records: [
      {
        subdomain: "@",
        recordType: "MX",
        content: "aspmx.l.google.com",
        priority: 1,
      },
      {
        subdomain: "@",
        recordType: "MX",
        content: "alt1.aspmx.l.google.com",
        priority: 5,
      },
      {
        subdomain: "@",
        recordType: "MX",
        content: "alt2.aspmx.l.google.com",
        priority: 5,
      },
      {
        subdomain: "@",
        recordType: "MX",
        content: "alt3.aspmx.l.google.com",
        priority: 10,
      },
      {
        subdomain: "@",
        recordType: "MX",
        content: "alt4.aspmx.l.google.com",
        priority: 10,
      },
    ],
  },
  {
    id: "microsoft-365",
    name: "Microsoft 365",
    description: "MX record for Outlook with Microsoft 365",
    category: "email",
    records: [
      {
        subdomain: "@",
        recordType: "MX",
        content: "{{domain}}.mail.protection.outlook.com",
        priority: 0,
      },
      {
        subdomain: "autodiscover",
        recordType: "CNAME",
        content: "autodiscover.outlook.com",
      },
    ],
  },
  {
    id: "zoho-mail",
    name: "Zoho Mail",
    description: "MX records for Zoho Mail",
    category: "email",
    records: [
      {
        subdomain: "@",
        recordType: "MX",
        content: "mx.zoho.com",
        priority: 10,
      },
      {
        subdomain: "@",
        recordType: "MX",
        content: "mx2.zoho.com",
        priority: 20,
      },
      {
        subdomain: "@",
        recordType: "MX",
        content: "mx3.zoho.com",
        priority: 50,
      },
    ],
  },
  {
    id: "proton-mail",
    name: "Proton Mail",
    description: "MX records for Proton Mail",
    category: "email",
    records: [
      {
        subdomain: "@",
        recordType: "MX",
        content: "mail.protonmail.ch",
        priority: 10,
      },
      {
        subdomain: "@",
        recordType: "MX",
        content: "mailsec.protonmail.ch",
        priority: 20,
      },
    ],
  },

  // ── Hosting ────────────────────────────────────────────
  {
    id: "vercel",
    name: "Vercel",
    description: "CNAME record pointing to Vercel",
    category: "hosting",
    records: [
      {
        subdomain: "www",
        recordType: "CNAME",
        content: "cname.vercel-dns.com",
      },
    ],
  },
  {
    id: "netlify",
    name: "Netlify",
    description: "CNAME record pointing to Netlify",
    category: "hosting",
    records: [
      {
        subdomain: "www",
        recordType: "CNAME",
        content: "{{slug}}.netlify.app",
      },
    ],
  },
  {
    id: "github-pages",
    name: "GitHub Pages",
    description: "A records and CNAME for GitHub Pages",
    category: "hosting",
    records: [
      {
        subdomain: "@",
        recordType: "A",
        content: "185.199.108.153",
      },
      {
        subdomain: "@",
        recordType: "A",
        content: "185.199.109.153",
      },
      {
        subdomain: "@",
        recordType: "A",
        content: "185.199.110.153",
      },
      {
        subdomain: "@",
        recordType: "A",
        content: "185.199.111.153",
      },
      {
        subdomain: "www",
        recordType: "CNAME",
        content: "{{username}}.github.io",
      },
    ],
  },
  {
    id: "cloudflare-pages",
    name: "Cloudflare Pages",
    description: "CNAME record pointing to Cloudflare Pages",
    category: "hosting",
    records: [
      {
        subdomain: "www",
        recordType: "CNAME",
        content: "{{project}}.pages.dev",
      },
    ],
  },

  // ── Security ───────────────────────────────────────────
  {
    id: "spf-google",
    name: "SPF (Google)",
    description: "SPF record allowing Google to send email",
    category: "security",
    records: [
      {
        subdomain: "@",
        recordType: "TXT",
        content: "v=spf1 include:_spf.google.com ~all",
      },
    ],
  },
  {
    id: "spf-microsoft",
    name: "SPF (Microsoft 365)",
    description: "SPF record allowing Microsoft 365 to send email",
    category: "security",
    records: [
      {
        subdomain: "@",
        recordType: "TXT",
        content: "v=spf1 include:spf.protection.outlook.com ~all",
      },
    ],
  },
  {
    id: "dmarc-reject",
    name: "DMARC (strict)",
    description: "Reject emails that fail SPF/DKIM checks",
    category: "security",
    records: [
      {
        subdomain: "_dmarc",
        recordType: "TXT",
        content: "v=DMARC1; p=reject; adkim=s; aspf=s",
      },
    ],
  },
  {
    id: "dmarc-quarantine",
    name: "DMARC (quarantine)",
    description: "Quarantine emails that fail SPF/DKIM checks",
    category: "security",
    records: [
      {
        subdomain: "_dmarc",
        recordType: "TXT",
        content: "v=DMARC1; p=quarantine; pct=100",
      },
    ],
  },
  {
    id: "dmarc-monitor",
    name: "DMARC (monitor only)",
    description: "Monitor SPF/DKIM failures without blocking",
    category: "security",
    records: [
      {
        subdomain: "_dmarc",
        recordType: "TXT",
        content: "v=DMARC1; p=none; rua=mailto:dmarc@{{domain}}",
      },
    ],
  },
];
