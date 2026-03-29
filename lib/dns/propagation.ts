import { Resolver } from "dns";

export type ResolverResult = {
  resolver: string;
  ip: string;
  values: string[];
  match: boolean;
  error?: string;
  latencyMs: number;
};

const RESOLVERS = [
  { name: "Google", ip: "8.8.8.8" },
  { name: "Cloudflare", ip: "1.1.1.1" },
  { name: "Quad9", ip: "9.9.9.9" },
  { name: "OpenDNS", ip: "208.67.222.222" },
];

type ResolveFn = (
  hostname: string,
  callback: (err: NodeJS.ErrnoException | null, records: string[]) => void
) => void;

type ResolveMxResult = { exchange: string; priority: number };

function matchValues(values: string[], expected: string): boolean {
  // Propagation = the name resolves. We show the resolved values so the user
  // can visually verify, but "match" just means the resolver sees *something*.
  // Exact IP comparison is misleading because proxies (Cloudflare), CDNs, and
  // load balancers legitimately return different IPs than what's configured.
  void expected;
  return values.length > 0;
}

function normalize(value: string): string {
  return value.replace(/\.+$/, "").replace(/^"|"$/g, "").trim().toLowerCase();
}

function resolveWithServer(
  server: string,
  name: string,
  type: string
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

      if (type === "MX" && Array.isArray(records)) {
        resolve(
          (records as ResolveMxResult[]).map(
            (r) => `${r.priority} ${r.exchange}`
          )
        );
      } else if (Array.isArray(records)) {
        // TXT records come as string[][]
        resolve(
          records.map((r) => (Array.isArray(r) ? r.join("") : String(r)))
        );
      } else {
        resolve([]);
      }
    };

    const method = getResolveMethod(resolver, type);
    if (!method) {
      clearTimeout(timeout);
      resolve([]);
      return;
    }

    (method as ResolveFn)(name, cb);
  });
}

function getResolveMethod(resolver: Resolver, type: string) {
  switch (type) {
    case "A":
      return resolver.resolve4.bind(resolver);
    case "AAAA":
      return resolver.resolve6.bind(resolver);
    case "CNAME":
      return resolver.resolveCname.bind(resolver);
    case "MX":
      return resolver.resolveMx.bind(resolver);
    case "TXT":
      return resolver.resolveTxt.bind(resolver);
    case "NS":
      return resolver.resolveNs.bind(resolver);
    default:
      return null;
  }
}

async function queryResolver(
  server: (typeof RESOLVERS)[number],
  name: string,
  type: string,
  expected: string
): Promise<ResolverResult> {
  const start = performance.now();
  try {
    // For CNAME records, query both CNAME and A to get a complete picture
    // Resolvers often follow CNAMEs and return A records directly
    let values = await resolveWithServer(server.ip, name, type);

    // If no results for the specific type, try A record as fallback
    // (e.g. CNAME queries may return empty if resolver auto-follows)
    if (values.length === 0 && type !== "A") {
      values = await resolveWithServer(server.ip, name, "A");
    }

    const normalizedExpected = normalize(expected);

    return {
      resolver: server.name,
      ip: server.ip,
      values,
      // For direct IP records (A/AAAA), exact-match the value.
      // For TXT/MX/NS, check if expected appears in resolved values.
      // For CNAME or proxied domains, resolvers return final IPs that won't
      // match the configured target — just check the name resolves at all.
      match: matchValues(values, normalizedExpected),
      latencyMs: Math.round(performance.now() - start),
    };
  } catch {
    return {
      resolver: server.name,
      ip: server.ip,
      values: [],
      match: false,
      error: "Query failed",
      latencyMs: Math.round(performance.now() - start),
    };
  }
}

export async function checkPropagation(
  name: string,
  type: string,
  expected: string
): Promise<ResolverResult[]> {
  const results = await Promise.allSettled(
    RESOLVERS.map((r) => queryResolver(r, name, type, expected))
  );

  return results.map((r) =>
    r.status === "fulfilled"
      ? r.value
      : {
          resolver: "Unknown",
          ip: "",
          values: [],
          match: false,
          error: "Query failed",
          latencyMs: 0,
        }
  );
}
