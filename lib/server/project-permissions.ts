import { and, eq, inArray } from "drizzle-orm";

import { getActiveClerkOrgRole, requireActiveClerkOrgId } from "@/lib/auth";
import { db } from "@/lib/db";
import { projectMembers, projects, workspaces } from "@/lib/db/schema";

export type ProjectRole = "owner" | "admin" | "member" | "viewer";

function mapOrganizationRoleToProjectRole(orgRole: string | null): ProjectRole | null {
  if (orgRole === "org:owner") {
    return "owner";
  }

  if (orgRole === "org:admin") {
    return "admin";
  }

  return null;
}

export async function getProjectMembership(projectId: string, userId: string) {
  const orgId = await requireActiveClerkOrgId();
  const [membership] = await db
    .select({
      projectId: projectMembers.projectId,
      userId: projectMembers.userId,
      role: projectMembers.role,
    })
    .from(projectMembers)
    .innerJoin(projects, eq(projects.id, projectMembers.projectId))
    .innerJoin(workspaces, eq(workspaces.id, projects.workspaceId))
    .where(
      and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, userId),
        eq(workspaces.clerkOrgId, orgId),
      ),
    )
    .limit(1);

  if (membership) {
    return membership;
  }

  const elevatedRole = mapOrganizationRoleToProjectRole(await getActiveClerkOrgRole());

  if (!elevatedRole) {
    return null;
  }

  return {
    projectId,
    userId,
    role: elevatedRole,
  };
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

  const orgId = await requireActiveClerkOrgId();

  return db
    .select({
      projectId: projectMembers.projectId,
      userId: projectMembers.userId,
      role: projectMembers.role,
    })
    .from(projectMembers)
    .innerJoin(projects, eq(projects.id, projectMembers.projectId))
    .innerJoin(workspaces, eq(workspaces.id, projects.workspaceId))
    .where(
      and(
        eq(projectMembers.userId, userId),
        inArray(projectMembers.projectId, projectIds),
        eq(workspaces.clerkOrgId, orgId),
      ),
    );
}
