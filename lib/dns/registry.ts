import type { PlatformAdapter, DnsProvider } from "./types";
import { cloudflareAdapter } from "./cloudflare";
import { vercelAdapter } from "./vercel";
import { netlifyAdapter } from "./netlify";

const adapters: Record<string, PlatformAdapter> = {
  cloudflare: cloudflareAdapter,
  vercel: vercelAdapter,
  netlify: netlifyAdapter,
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
