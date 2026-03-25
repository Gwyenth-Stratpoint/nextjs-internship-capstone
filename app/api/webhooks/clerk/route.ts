import { headers } from "next/headers";
import { Webhook } from "svix";
import type { WebhookEvent } from "@clerk/nextjs/server";

import { db } from "@/lib/db";
import { users, workspaces } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { resolvePendingProjectInvitationsForWorkspaceMember } from "@/lib/server/project-members-crud";
import { syncWorkspaceFromClerkOrganization } from "@/lib/server/workspace-crud";

function getStringValue(value: unknown) {
  return typeof value === "string" ? value : null;
}

function getMembershipUserId(data: unknown) {
  if (!data || typeof data !== "object") {
    return null;
  }

  const publicUserData =
    "public_user_data" in data
      ? (data as { public_user_data?: Record<string, unknown> }).public_user_data
      : "publicUserData" in data
        ? (data as { publicUserData?: Record<string, unknown> }).publicUserData
        : null;

  if (!publicUserData || typeof publicUserData !== "object") {
    return null;
  }

  return (
    getStringValue(publicUserData.user_id) ??
    getStringValue(publicUserData.userId) ??
    getStringValue("user_id" in data ? (data as { user_id?: unknown }).user_id : null)
  );
}

function getMembershipEmail(data: unknown) {
  if (!data || typeof data !== "object") {
    return null;
  }

  const publicUserData =
    "public_user_data" in data
      ? (data as { public_user_data?: Record<string, unknown> }).public_user_data
      : "publicUserData" in data
        ? (data as { publicUserData?: Record<string, unknown> }).publicUserData
        : null;

  if (!publicUserData || typeof publicUserData !== "object") {
    return null;
  }

  return (
    getStringValue(publicUserData.identifier) ??
    getStringValue(publicUserData.email_address) ??
    getStringValue(publicUserData.emailAddress)
  );
}

function getMembershipOrgId(data: unknown) {
  if (!data || typeof data !== "object") {
    return null;
  }

  const organization =
    "organization" in data
      ? (data as { organization?: Record<string, unknown> }).organization
      : null;

  return getStringValue(organization?.id);
}

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) return new Response("Missing CLERK_WEBHOOK_SECRET", { status: 500 });

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

      const email = data.email_addresses?.[0]?.email_address ?? ""; // you can enforce required if you want

      const name = [data.first_name, data.last_name].filter(Boolean).join(" ") || null;
      const avatarUrl = data.image_url ?? null;

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

    if (type === "organization.created" || type === "organization.updated") {
      await syncWorkspaceFromClerkOrganization({
        id: data.id,
        name: data.name,
        slug: "slug" in data ? (data.slug ?? null) : null,
      });
    }

    if (type === "organization.deleted" && data.id) {
      await db.delete(workspaces).where(eq(workspaces.clerkOrgId, data.id));
    }

    if (type === "organizationMembership.created" || type === "organizationMembership.updated") {
      const clerkUserId = getMembershipUserId(data);
      const clerkOrgId = getMembershipOrgId(data);
      const email = getMembershipEmail(data);

      if (clerkUserId && clerkOrgId) {
        await resolvePendingProjectInvitationsForWorkspaceMember({
          clerkOrgId,
          clerkUserId,
          email,
        });
      }
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Webhook handler error:", err);
    return new Response("Webhook error", { status: 500 });
  }
}
