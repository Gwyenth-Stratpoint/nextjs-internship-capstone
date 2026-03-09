import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function requireDbUserId() {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    throw new Error("Unauthorized");
  }

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

