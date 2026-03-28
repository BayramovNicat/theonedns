"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { verifyToken } from "@/lib/cloudflare";

type ActionResult = { error?: string };

export async function saveCloudflareConfig(
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const apiToken = (formData.get("apiToken") as string)?.trim();
  const zoneId = (formData.get("zoneId") as string)?.trim();
  const domain = (formData.get("domain") as string)?.trim().toLowerCase();

  if (!apiToken || !zoneId || !domain) {
    return { error: "All fields are required" };
  }

  // Verify the token is valid before saving
  try {
    const valid = await verifyToken(apiToken);
    if (!valid) return { error: "Invalid Cloudflare API token" };
  } catch {
    return { error: "Could not verify Cloudflare token" };
  }

  // Upsert: insert or update existing config
  const { error: dbError } = await supabase.from("cloudflare_configs").upsert(
    {
      user_id: user.id,
      api_token: apiToken,
      zone_id: zoneId,
      domain,
    },
    { onConflict: "user_id" }
  );

  if (dbError) return { error: dbError.message };

  revalidatePath("/");
  return {};
}

export async function disconnectCloudflare(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase.from("cloudflare_configs").delete().eq("user_id", user.id);

  revalidatePath("/");
}
