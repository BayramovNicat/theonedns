import { azureAdapter } from "./azure";
import { cloudflareAdapter } from "./cloudflare";
import { digitaloceanAdapter } from "./digitalocean";
import { dnsimpleAdapter } from "./dnsimple";
import { gandiAdapter } from "./gandi";
import { gcloudAdapter } from "./gcloud";
import { godaddyAdapter } from "./godaddy";
import { hetznerAdapter } from "./hetzner";
import { linodeAdapter } from "./linode";
import { namecheapAdapter } from "./namecheap";
import { namecomAdapter } from "./namecom";
import { netlifyAdapter } from "./netlify";
import { ovhAdapter } from "./ovh";
import { porkbunAdapter } from "./porkbun";
import { route53Adapter } from "./route53";
import type { DnsProvider, PlatformAdapter } from "./types";
import { vercelAdapter } from "./vercel";
import { vultrAdapter } from "./vultr";

const adapters: Record<string, PlatformAdapter> = {
  cloudflare: cloudflareAdapter,
  vercel: vercelAdapter,
  netlify: netlifyAdapter,
  digitalocean: digitaloceanAdapter,
  hetzner: hetznerAdapter,
  godaddy: godaddyAdapter,
  gcloud: gcloudAdapter,
  porkbun: porkbunAdapter,
  dnsimple: dnsimpleAdapter,
  namecom: namecomAdapter,
  route53: route53Adapter,
  vultr: vultrAdapter,
  linode: linodeAdapter,
  gandi: gandiAdapter,
  ovh: ovhAdapter,
  namecheap: namecheapAdapter,
  azure: azureAdapter,
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
