import { cloudflareAdapter } from "./cloudflare";
import { digitaloceanAdapter } from "./digitalocean";
import { godaddyAdapter } from "./godaddy";
import { hetznerAdapter } from "./hetzner";
import { netlifyAdapter } from "./netlify";
import type { DnsProvider, PlatformAdapter } from "./types";
import { vercelAdapter } from "./vercel";

const adapters: Record<string, PlatformAdapter> = {
  cloudflare: cloudflareAdapter,
  vercel: vercelAdapter,
  netlify: netlifyAdapter,
  digitalocean: digitaloceanAdapter,
  hetzner: hetznerAdapter,
  godaddy: godaddyAdapter,
};

export function getAdapter(platform: string): PlatformAdapter {
  const adapter = adapters[platform];
  if (!adapter) {
    throw new Error(`Unsupported platform: ${platform}`);
  }
  return adapter;
}

export function getProvider(
  platform: string,
  credentials: Record<string, string>,
  domain: string
): DnsProvider {
  return getAdapter(platform).createProvider(credentials, domain);
}

export function isSupported(platform: string): boolean {
  return platform in adapters;
}
