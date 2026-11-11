import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { VAPID_PUBLIC_KEY } from "./push-config";

const Input = z.object({
  to: z.array(z.enum(["guilherme", "arlayne"])).min(1).max(2),
  title: z.string().min(1).max(120),
  body: z.string().max(400).default(""),
  url: z.string().startsWith("/").max(200).default("/"),
  badge: z.number().int().min(0).max(999).optional(),
});

/** Sends a phone notification to the given profiles. Caller must be signed in. */
export const sendPush = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    if (!privateKey) return { sent: 0 };
    const { buildPushPayload } = await import("@block65/webcrypto-web-push");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: subs } = await supabaseAdmin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .in("profile_id", data.to);
    const vapid = { subject: "https://airicards.lovable.app", publicKey: VAPID_PUBLIC_KEY, privateKey };
    const payload = JSON.stringify({ title: data.title, body: data.body, url: data.url, badge: data.badge });
    let sent = 0;
    await Promise.allSettled(
      (subs ?? []).map(async (s) => {
        const req = await buildPushPayload(
          { data: payload, options: { ttl: 60 * 60 * 24, urgency: "high" } },
          { endpoint: s.endpoint, expirationTime: null, keys: { p256dh: s.p256dh, auth: s.auth } },
          vapid,
        );
        const res = await fetch(s.endpoint, req);
        if (res.status === 404 || res.status === 410) {
          await supabaseAdmin.from("push_subscriptions").delete().eq("id", s.id);
        } else if (res.ok) sent++;
        else console.error("push failed", res.status, await res.text());
      }),
    );
    return { sent };
  });
