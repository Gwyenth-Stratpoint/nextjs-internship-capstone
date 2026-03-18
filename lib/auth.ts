import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function requireClerkUserId() {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    throw new Error("Unauthorized");
  }

  return clerkId;
}

export async function getActiveClerkOrgId() {
  const { orgId } = await auth();
  return orgId ?? null;
}

export async function requireActiveClerkOrgId() {
  const orgId = await getActiveClerkOrgId();

  if (!orgId) {
    throw new Error("OrganizationRequired");
  }

  return orgId;
}

export async function getActiveClerkOrgRole() {
  const clerkUserId = await requireClerkUserId();
  const clerkOrgId = await requireActiveClerkOrgId();
  const client = (await clerkClient()) as any;
  const membershipResult = await client.organizations.getOrganizationMembershipList({
    organizationId: clerkOrgId,
    limit: 100,
  });

  const memberships = Array.isArray(membershipResult)
    ? membershipResult
    : Array.isArray(membershipResult?.data)
      ? membershipResult.data
      : [];

  const membership = memberships.find((entry: any) => {
    return entry.publicUserData?.userId === clerkUserId || entry.publicUserData?.user_id === clerkUserId;
  });

  return (membership?.role as string | undefined) ?? null;
}

export async function requireDbUserId() {
  const clerkId = await requireClerkUserId();

  const [existingUser] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);

  if (existingUser) {
    return existingUser.id;
  }

  const clerkUser = await currentUser();
  const email = clerkUser?.primaryEmailAddress?.emailAddress ?? clerkUser?.emailAddresses?.[0]?.emailAddress;

  if (!clerkUser || !email) {
    throw new Error("Unauthorized");
  }

  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim();

  const [createdUser] = await db
    .insert(users)
    .values({
      clerkId,
      email,
      name: name || null,
      avatarUrl: clerkUser.imageUrl ?? null,
    })
    .returning();

  if (!createdUser) {
    throw new Error("Failed to initialize user");
  }

  return createdUser.id;
}
