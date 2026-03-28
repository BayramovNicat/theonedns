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
} as const;

export type Platform = keyof typeof PLATFORMS;
