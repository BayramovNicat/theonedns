export const PLATFORMS = {
  cloudflare: {
    name: "Cloudflare",
    fields: [
      {
        key: "api_token",
        label: "API Token",
        type: "text" as const,
        placeholder: "Your Cloudflare API token",
        help: "Create one at Cloudflare Dashboard > My Profile > API Tokens with Zone.DNS Edit permission.",
      },
      {
        key: "zone_id",
        label: "Zone ID",
        type: "text" as const,
        placeholder: "e.g. 023e105f4ecef8ad9ca31a8372d0c353",
        help: "Found on your domain's Overview page in Cloudflare.",
      },
    ],
  },
  vercel: {
    name: "Vercel",
    fields: [
      {
        key: "api_token",
        label: "API Token",
        type: "text" as const,
        placeholder: "Your Vercel API token",
        help: "Create one at Vercel Dashboard > Settings > Tokens.",
      },
      {
        key: "team_id",
        label: "Team ID (optional)",
        type: "text" as const,
        placeholder: "team_xxxxx",
        help: "Required if the domain belongs to a team.",
      },
    ],
  },
  netlify: {
    name: "Netlify",
    fields: [
      {
        key: "api_token",
        label: "Personal Access Token",
        type: "text" as const,
        placeholder: "Your Netlify access token",
        help: "Create one at Netlify > User Settings > Applications > Personal access tokens.",
      },
      {
        key: "zone_id",
        label: "DNS Zone ID",
        type: "text" as const,
        placeholder: "e.g. 5c1234abcdef",
        help: "Found in your domain's DNS settings on Netlify.",
      },
    ],
  },
  digitalocean: {
    name: "DigitalOcean",
    fields: [
      {
        key: "api_token",
        label: "API Token",
        type: "text" as const,
        placeholder: "Your DigitalOcean API token",
        help: "Create one at DigitalOcean > API > Tokens with read+write scope.",
      },
    ],
  },
  hetzner: {
    name: "Hetzner",
    fields: [
      {
        key: "api_token",
        label: "API Token",
        type: "text" as const,
        placeholder: "Your Hetzner DNS API token",
        help: "Create one at Hetzner DNS Console > API Tokens.",
      },
      {
        key: "zone_id",
        label: "Zone ID",
        type: "text" as const,
        placeholder: "e.g. abcdef1234567890",
        help: "Found in your domain's settings on Hetzner DNS Console.",
      },
    ],
  },
  godaddy: {
    name: "GoDaddy",
    fields: [
      {
        key: "api_key",
        label: "API Key",
        type: "text" as const,
        placeholder: "Your GoDaddy API key",
        help: "Create one at GoDaddy Developer Portal > API Keys.",
      },
      {
        key: "api_secret",
        label: "API Secret",
        type: "text" as const,
        placeholder: "Your GoDaddy API secret",
        help: "Shown once when you create the API key — save it immediately.",
      },
    ],
  },
  gcloud: {
    name: "Google Cloud DNS",
    fields: [
      {
        key: "project_id",
        label: "Project ID",
        type: "text" as const,
        placeholder: "e.g. my-project-123",
        help: "Your Google Cloud project ID (not the project number).",
      },
      {
        key: "managed_zone",
        label: "Managed Zone Name",
        type: "text" as const,
        placeholder: "e.g. my-zone",
        help: "The name of your Cloud DNS managed zone (not the DNS name).",
      },
      {
        key: "service_account_json",
        label: "Service Account JSON",
        type: "text" as const,
        placeholder: "Paste your service account key JSON",
        help: "Create a service account with DNS Administrator role, then generate a JSON key.",
      },
    ],
  },
  porkbun: {
    name: "Porkbun",
    fields: [
      {
        key: "api_key",
        label: "API Key",
        type: "text" as const,
        placeholder: "pk1_xxxxx",
        help: "Create one at Porkbun > Account > API Access.",
      },
      {
        key: "secret_api_key",
        label: "Secret API Key",
        type: "text" as const,
        placeholder: "sk1_xxxxx",
        help: "Shown once when you create the API key — save it immediately.",
      },
    ],
  },
  dnsimple: {
    name: "DNSimple",
    fields: [
      {
        key: "api_token",
        label: "API Token",
        type: "text" as const,
        placeholder: "Your DNSimple API token",
        help: "Create one at DNSimple > Account > Automation > API Tokens.",
      },
      {
        key: "account_id",
        label: "Account ID",
        type: "text" as const,
        placeholder: "e.g. 12345",
        help: "Found at DNSimple > Account settings (numeric ID).",
      },
    ],
  },
  namecom: {
    name: "Name.com",
    fields: [
      {
        key: "username",
        label: "Username",
        type: "text" as const,
        placeholder: "Your Name.com username",
        help: "The username you use to log in to Name.com.",
      },
      {
        key: "api_token",
        label: "API Token",
        type: "text" as const,
        placeholder: "Your Name.com API token",
        help: "Generate one at Name.com > Account > API Tokens.",
      },
    ],
  },
  route53: {
    name: "AWS Route 53",
    fields: [
      {
        key: "access_key_id",
        label: "Access Key ID",
        type: "text" as const,
        placeholder: "AKIAIOSFODNN7EXAMPLE",
        help: "IAM user access key with Route 53 permissions.",
      },
      {
        key: "secret_access_key",
        label: "Secret Access Key",
        type: "text" as const,
        placeholder: "Your AWS secret access key",
        help: "The secret key paired with your access key ID.",
      },
      {
        key: "hosted_zone_id",
        label: "Hosted Zone ID",
        type: "text" as const,
        placeholder: "Z1234567890ABC",
        help: "Found in Route 53 > Hosted zones — the zone ID for your domain.",
      },
    ],
  },
  vultr: {
    name: "Vultr",
    fields: [
      {
        key: "api_token",
        label: "API Token",
        type: "text" as const,
        placeholder: "Your Vultr API token",
        help: "Create one at Vultr > Account > API with DNS permissions.",
      },
    ],
  },
} as const;

export type Platform = keyof typeof PLATFORMS;
