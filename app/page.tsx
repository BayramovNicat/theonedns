import { createClient } from "@/lib/supabase/server";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddSubdomainForm } from "@/components/add-subdomain-form";
import { SubdomainRow } from "@/components/subdomain-row";
import { ConnectCloudflare } from "@/components/connect-cloudflare";
import { DisconnectButton } from "@/components/disconnect-button";
import { SignOutButton } from "@/components/sign-out-button";
import { listDnsRecords } from "@/lib/cloudflare";

export default async function Dashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: config } = await supabase
    .from("cloudflare_configs")
    .select("*")
    .eq("user_id", user!.id)
    .single();

  return (
    <div className="bg-background min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold">Domnix</h1>
            {config && (
              <p className="text-muted-foreground text-sm">{config.domain}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {config && <DisconnectButton />}
            <span className="text-muted-foreground text-sm">{user?.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {config ? (
          <SubdomainDashboard
            config={{
              api_token: config.api_token,
              zone_id: config.zone_id,
              domain: config.domain,
            }}
          />
        ) : (
          <ConnectCloudflare />
        )}
      </main>
    </div>
  );
}

async function SubdomainDashboard({
  config,
}: {
  config: { api_token: string; zone_id: string; domain: string };
}) {
  const records = await listDnsRecords(config);

  // Filter to only subdomains of the configured domain, exclude root
  const subdomains = records.filter(
    (r) =>
      r.name !== config.domain &&
      r.name.endsWith(`.${config.domain}`) &&
      (r.type === "A" || r.type === "AAAA" || r.type === "CNAME")
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Subdomains</CardTitle>
        <AddSubdomainForm domain={config.domain} />
      </CardHeader>
      <CardContent>
        {subdomains.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subdomain</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Proxy</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subdomains.map((record) => (
                <SubdomainRow key={record.id} record={record} />
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-muted-foreground py-12 text-center">
            No subdomains yet. Add one to get started.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
