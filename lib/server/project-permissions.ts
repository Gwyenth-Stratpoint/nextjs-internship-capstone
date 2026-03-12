import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/lib/db";
import { projectMembers } from "@/lib/db/schema";

export type ProjectRole = "owner" | "admin" | "member" | "viewer";

export async function getProjectMembership(projectId: string, userId: string) {
  const [membership] = await db
    .select({
      projectId: projectMembers.projectId,
      userId: projectMembers.userId,
      role: projectMembers.role,
    })
    .from(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)))
    .limit(1);

  return membership ?? null;
}

export async function assertProjectRole(projectId: string, userId: string, allowedRoles: ProjectRole[]) {
  const membership = await getProjectMembership(projectId, userId);

  if (!membership || !allowedRoles.includes(membership.role)) {
    throw new Error("Forbidden");
  }

  return membership;
}

export async function getProjectMemberships(projectIds: string[], userId: string) {
  if (projectIds.length === 0) {
    return [];
  }

  return db
    .select({
      projectId: projectMembers.projectId,
      userId: projectMembers.userId,
      role: projectMembers.role,
    })
    .from(projectMembers)
    .where(and(eq(projectMembers.userId, userId), inArray(projectMembers.projectId, projectIds)));
}
