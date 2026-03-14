import { headers } from "next/headers";
import { Webhook } from "svix";
import type { WebhookEvent } from "@clerk/nextjs/server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) return new Response("Missing CLERK_WEBHOOK_SECRET", { status: 500 });

  // IMPORTANT: use raw body for signature verification
  const payload = await req.text();
  const h = await headers();

  const svixHeaders = {
    "svix-id": h.get("svix-id") ?? "",
    "svix-timestamp": h.get("svix-timestamp") ?? "",
    "svix-signature": h.get("svix-signature") ?? "",
  };

  let evt: WebhookEvent;

  try {
    const wh = new Webhook(secret);
    evt = wh.verify(payload, svixHeaders) as WebhookEvent;
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    const { type, data } = evt;

    if (type === "user.created" || type === "user.updated") {
      const clerkId = data.id;

      const email =
        data.email_addresses?.[0]?.email_address ??
        ""; // you can enforce required if you want

      const name = [data.first_name, data.last_name].filter(Boolean).join(" ") || null;
      const avatarUrl = data.image_url ?? null;

      // Upsert (simple version: select then insert/update)
      const existing = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);

      if (!existing.length) {
        await db.insert(users).values({
          clerkId,
          email,
          name,
          avatarUrl,
        });
      } else {
        await db
          .update(users)
          .set({ email, name, avatarUrl, updatedAt: new Date() })
          .where(eq(users.clerkId, clerkId));
      }
    }

    if (type === "user.deleted") {
      
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Webhook handler error:", err);
    return new Response("Webhook error", { status: 500 });
  }
}