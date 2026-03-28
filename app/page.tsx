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
import { signOut } from "@/lib/supabase/actions";
import { disconnectCloudflare } from "@/lib/actions/cloudflare-config";
import { Button } from "@/components/ui/button";

export default async function Dashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch user's Cloudflare config
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
            {config && (
              <form action={disconnectCloudflare}>
                <Button variant="ghost" size="sm">
                  Disconnect
                </Button>
              </form>
            )}
            <span className="text-muted-foreground text-sm">{user?.email}</span>
            <form action={signOut}>
              <Button variant="outline" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {config ? (
          <SubdomainDashboard userId={user!.id} domain={config.domain} />
        ) : (
          <ConnectCloudflare />
        )}
      </main>
    </div>
  );
}

async function SubdomainDashboard({
  userId,
  domain,
}: {
  userId: string;
  domain: string;
}) {
  const supabase = await createClient();

  const { data: subdomains } = await supabase
    .from("subdomains")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Subdomains</CardTitle>
        <AddSubdomainForm domain={domain} />
      </CardHeader>
      <CardContent>
        {subdomains && subdomains.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subdomain</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Proxy</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subdomains.map((record) => (
                <SubdomainRow
                  key={record.id}
                  record={{ ...record, is_owner: true }}
                  domain={domain}
                />
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
