import { clerkClient } from "@clerk/nextjs/server";
import { and, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { projectMembers, projects, users } from "@/lib/db/schema";
import { requireWorkspaceForClerkOrg } from "@/lib/server/workspace-crud";

type ClerkOrganizationSummary = {
  name?: string | null;
};

type ClerkOrganizationMember = {
  id: string;
  role?: string | null;
  createdAt?: number | string | null;
  publicUserData?: {
    userId?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    identifier?: string | null;
    emailAddress?: string | null;
    imageUrl?: string | null;
  };
};

type ClerkOrganizationInvitation = {
  id: string;
  emailAddress?: string | null;
  role?: string | null;
  status?: string | null;
  createdAt?: number | string | null;
};

function toArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }

  if (value && typeof value === "object" && Array.isArray((value as { data?: unknown[] }).data)) {
    return (value as { data: T[] }).data;
  }

  return [];
}

export async function getOrganizationTeamSnapshot(clerkOrgId: string) {
  const workspace = await requireWorkspaceForClerkOrg(clerkOrgId);
  const client = await clerkClient();

  const [organization, membershipResult, invitationResult, projectCountRows] = await Promise.all([
    client.organizations.getOrganization({ organizationId: clerkOrgId }),
    client.organizations.getOrganizationMembershipList({ organizationId: clerkOrgId, limit: 100 }),
    client.organizations.getOrganizationInvitationList({ organizationId: clerkOrgId, limit: 100 }),
    db
      .select({
        clerkId: users.clerkId,
        projectCount: sql<number>`count(distinct ${projectMembers.projectId})`,
      })
      .from(projectMembers)
      .innerJoin(users, eq(users.id, projectMembers.userId))
      .innerJoin(
        projects,
        and(eq(projects.id, projectMembers.projectId), eq(projects.workspaceId, workspace.id)),
      )
      .groupBy(users.clerkId),
  ]);

  const projectCountByClerkId = new Map(
    projectCountRows.map((row) => [row.clerkId, Number(row.projectCount ?? 0)]),
  );

  const members = toArray<ClerkOrganizationMember>(membershipResult).map((membership) => {
    const publicUserData = membership.publicUserData ?? {};
    const fullName = [publicUserData.firstName, publicUserData.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();

    return {
      id: membership.id,
      userId: publicUserData.userId ?? null,
      role: membership.role ?? "org:member",
      email: publicUserData.identifier ?? publicUserData.emailAddress ?? "",
      name: fullName || publicUserData.identifier || "Workspace member",
      avatarUrl: publicUserData.imageUrl ?? null,
      projectCount: publicUserData.userId
        ? (projectCountByClerkId.get(publicUserData.userId) ?? 0)
        : 0,
      joinedAt: membership.createdAt ?? null,
    };
  });

  const invitations = toArray<ClerkOrganizationInvitation>(invitationResult)
    .map((invitation) => ({
      id: invitation.id,
      email: invitation.emailAddress ?? "",
      role: invitation.role ?? "org:member",
      status: invitation.status ?? "pending",
      createdAt: invitation.createdAt ?? null,
    }))
    .filter((invitation) => invitation.status.toLowerCase() === "pending");

  return {
    workspace: {
      id: workspace.id,
      name: workspace.name,
      clerkOrgId,
      organizationName: (organization as ClerkOrganizationSummary | null)?.name ?? workspace.name,
    },
    members,
    invitations,
  };
}

export async function createOrganizationInvitation(input: {
  clerkOrgId: string;
  inviterClerkUserId: string;
  emailAddress: string;
  role: "org:admin" | "org:member";
}) {
  const client = await clerkClient();

  return client.organizations.createOrganizationInvitation({
    organizationId: input.clerkOrgId,
    inviterUserId: input.inviterClerkUserId,
    emailAddress: input.emailAddress,
    role: input.role,
  });
}
