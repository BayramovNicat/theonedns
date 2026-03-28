"use client";

import { useActionState } from "react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { saveCloudflareConfig } from "@/lib/actions/cloudflare-config";
import { toast } from "sonner";

type State = { error?: string };

export function ConnectCloudflare() {
  const [state, formAction, pending] = useActionState(
    async (_prev: State, formData: FormData): Promise<State> => {
      return await saveCloudflareConfig(formData);
    },
    {} as State
  );

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Connect Cloudflare</CardTitle>
          <CardDescription>
            Enter your Cloudflare API credentials to start managing subdomains.
            Your token is stored securely and never exposed to the browser.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiToken">API Token</Label>
              <Input
                id="apiToken"
                name="apiToken"
                type="password"
                placeholder="Your Cloudflare API token"
                required
              />
              <p className="text-muted-foreground text-xs">
                Create one at Cloudflare Dashboard &gt; My Profile &gt; API
                Tokens with <strong>Zone.DNS Edit</strong> permission.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="zoneId">Zone ID</Label>
              <Input
                id="zoneId"
                name="zoneId"
                placeholder="e.g. 023e105f4ecef8ad9ca31a8372d0c353"
                required
              />
              <p className="text-muted-foreground text-xs">
                Found on your domain&apos;s Overview page in Cloudflare.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="domain">Domain</Label>
              <Input
                id="domain"
                name="domain"
                placeholder="example.com"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Verifying..." : "Connect"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
