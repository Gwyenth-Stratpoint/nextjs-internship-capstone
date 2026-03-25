import { clerkClient } from "@clerk/nextjs/server";
import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { projectInvitations, projectMembers, projects, users, workspaces } from "@/lib/db/schema";
import { recordActivity } from "@/lib/server/activity-crud";
import { assertProjectRole } from "@/lib/server/project-permissions";

type ProjectRole = "owner" | "admin" | "member" | "viewer";
type WorkspaceRoleKey = "org:admin" | "org:member";

type ClerkOrganizationMember = {
  role?: string | null;
  publicUserData?: {
    userId?: string | null;
    user_id?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    identifier?: string | null;
    emailAddress?: string | null;
    imageUrl?: string | null;
    image_url?: string | null;
  };
};

function toMemberships(value: unknown): ClerkOrganizationMember[] {
  if (Array.isArray(value)) {
    return value as ClerkOrganizationMember[];
  }

  if (value && typeof value === "object" && Array.isArray((value as { data?: unknown[] }).data)) {
    return (value as { data: ClerkOrganizationMember[] }).data;
  }

  return [];
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getMembershipEmail(membership: ClerkOrganizationMember) {
  const publicUserData = membership.publicUserData ?? {};
  return normalizeEmail(publicUserData.identifier ?? publicUserData.emailAddress ?? "");
}

function getMembershipClerkUserId(membership: ClerkOrganizationMember) {
  const publicUserData = membership.publicUserData ?? {};
  return publicUserData.userId ?? publicUserData.user_id ?? null;
}

function getMembershipName(membership: ClerkOrganizationMember) {
  const publicUserData = membership.publicUserData ?? {};
  const fullName = [publicUserData.firstName, publicUserData.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || publicUserData.identifier || publicUserData.emailAddress || "Workspace member";
}

function getMembershipAvatarUrl(membership: ClerkOrganizationMember) {
  const publicUserData = membership.publicUserData ?? {};
  return publicUserData.imageUrl ?? publicUserData.image_url ?? null;
}

async function getProjectScope(projectId: string) {
  const [project] = await db
    .select({
      id: projects.id,
      name: projects.name,
      workspaceId: projects.workspaceId,
      clerkOrgId: workspaces.clerkOrgId,
    })
    .from(projects)
    .innerJoin(workspaces, eq(workspaces.id, projects.workspaceId))
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!project || !project.clerkOrgId) {
    throw new Error("NotFound");
  }

  return project;
}

async function getOrCreateUserFromMembership(membership: ClerkOrganizationMember) {
  const clerkId = getMembershipClerkUserId(membership);

  if (!clerkId) {
    throw new Error("WorkspaceMemberNotReady");
  }

  const [existingUser] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);

  if (existingUser) {
    return existingUser;
  }

  const email = getMembershipEmail(membership);

  if (!email) {
    throw new Error("WorkspaceMemberNotReady");
  }

  const [createdUser] = await db
    .insert(users)
    .values({
      clerkId,
      email,
      name: getMembershipName(membership),
      avatarUrl: getMembershipAvatarUrl(membership),
    })
    .returning();

  if (!createdUser) {
    throw new Error("Failed to initialize user");
  }

  return createdUser;
}

async function upsertProjectMember(projectId: string, userId: string, role: ProjectRole) {
  const [existingMembership] = await db
    .select()
    .from(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)))
    .limit(1);

  if (existingMembership) {
    const [updatedMembership] = await db
      .update(projectMembers)
      .set({
        role,
        updatedAt: new Date(),
      })
      .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)))
      .returning();

    return {
      membership: updatedMembership ?? existingMembership,
      event: "updated" as const,
      previousRole: existingMembership.role,
    };
  }

  const [createdMembership] = await db
    .insert(projectMembers)
    .values({
      projectId,
      userId,
      role,
    })
    .returning();

  if (!createdMembership) {
    throw new Error("Failed to add project member");
  }

  return {
    membership: createdMembership,
    event: "created" as const,
    previousRole: null,
  };
}

export async function getProjectMembersSnapshot(projectId: string, userId: string) {
  await assertProjectRole(projectId, userId, ["owner", "admin"]);
  const project = await getProjectScope(projectId);

  const [members, invitations] = await Promise.all([
    db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        avatarUrl: users.avatarUrl,
        role: projectMembers.role,
        joinedAt: projectMembers.createdAt,
      })
      .from(projectMembers)
      .innerJoin(users, eq(users.id, projectMembers.userId))
      .where(eq(projectMembers.projectId, projectId))
      .orderBy(desc(projectMembers.createdAt)),
    db
      .select({
        id: projectInvitations.id,
        email: projectInvitations.email,
        role: projectInvitations.role,
        workspaceRoleKey: projectInvitations.workspaceRoleKey,
        status: projectInvitations.status,
        createdAt: projectInvitations.createdAt,
      })
      .from(projectInvitations)
      .where(
        and(eq(projectInvitations.projectId, projectId), eq(projectInvitations.status, "pending")),
      )
      .orderBy(desc(projectInvitations.createdAt)),
  ]);

  return {
    project: {
      id: project.id,
      name: project.name,
      clerkOrgId: project.clerkOrgId,
    },
    members,
    invitations,
  };
}

export async function inviteProjectMember(input: {
  projectId: string;
  inviterUserId: string;
  inviterClerkUserId: string;
  email: string;
  role: ProjectRole;
  workspaceRoleKey: WorkspaceRoleKey;
}) {
  await assertProjectRole(input.projectId, input.inviterUserId, ["owner", "admin"]);
  const project = await getProjectScope(input.projectId);
  const normalizedEmail = normalizeEmail(input.email);
  const client = await clerkClient();

  const membershipResult: unknown = await client.organizations.getOrganizationMembershipList({
    organizationId: project.clerkOrgId,
    limit: 100,
  });

  const existingWorkspaceMember = toMemberships(membershipResult).find(
    (membership) => getMembershipEmail(membership) === normalizedEmail,
  );

  if (existingWorkspaceMember) {
    const user = await getOrCreateUserFromMembership(existingWorkspaceMember);
    const membershipResult = await upsertProjectMember(project.id, user.id, input.role);

    await recordActivity({
      workspaceId: project.workspaceId,
      projectId: project.id,
      actorId: input.inviterUserId,
      action: "updated",
      meta: {
        entityType: "project_member",
        event: membershipResult.event === "created" ? "granted" : "role_updated",
        memberUserId: user.id,
        memberEmail: user.email,
        role: input.role,
        previousRole: membershipResult.previousRole,
        summary:
          membershipResult.event === "created"
            ? `added ${user.name ?? user.email} to project "${project.name}"`
            : `updated ${user.name ?? user.email} project role to ${input.role}`,
      },
    });

    return {
      status: "granted" as const,
      message: "Workspace member added to project",
    };
  }

  const [existingPendingInvitation] = await db
    .select({ id: projectInvitations.id })
    .from(projectInvitations)
    .where(
      and(
        eq(projectInvitations.projectId, project.id),
        eq(projectInvitations.email, normalizedEmail),
        eq(projectInvitations.status, "pending"),
      ),
    )
    .limit(1);

  if (existingPendingInvitation) {
    throw new Error("A pending project invitation already exists for this email");
  }

  const invitationResult = await client.organizations.createOrganizationInvitation({
    organizationId: project.clerkOrgId,
    inviterUserId: input.inviterClerkUserId,
    emailAddress: normalizedEmail,
    role: input.workspaceRoleKey,
  });

  const [createdInvitation] = await db
    .insert(projectInvitations)
    .values({
      projectId: project.id,
      clerkOrgId: project.clerkOrgId,
      email: normalizedEmail,
      role: input.role,
      workspaceRoleKey: input.workspaceRoleKey,
      clerkInvitationId:
        invitationResult && typeof invitationResult === "object" && "id" in invitationResult
          ? String((invitationResult as { id: string }).id)
          : null,
      invitedById: input.inviterUserId,
      status: "pending",
    })
    .returning();

  if (!createdInvitation) {
    throw new Error("Failed to create project invitation");
  }

  await recordActivity({
    workspaceId: project.workspaceId,
    projectId: project.id,
    actorId: input.inviterUserId,
    action: "updated",
    meta: {
      entityType: "project_invitation",
      event: "created",
      invitationId: createdInvitation.id,
      email: normalizedEmail,
      role: input.role,
      workspaceRoleKey: input.workspaceRoleKey,
      summary: `sent a project invite to ${normalizedEmail}`,
    },
  });

  return {
    status: "pending" as const,
    message: "Workspace invite sent. Project access will be granted after acceptance.",
  };
}

export async function resolvePendingProjectInvitationsForWorkspaceMember(input: {
  clerkOrgId: string;
  clerkUserId: string;
  email?: string | null;
}) {
  const normalizedEmail = input.email ? normalizeEmail(input.email) : null;

  let user =
    (await db.select().from(users).where(eq(users.clerkId, input.clerkUserId)).limit(1))[0] ?? null;

  if (!user && normalizedEmail) {
    user =
      (
        await db
          .select()
          .from(users)
          .where(sql`lower(${users.email}) = ${normalizedEmail}`)
          .limit(1)
      )[0] ?? null;
  }

  if (!user) {
    return { resolvedCount: 0 };
  }

  const pendingInvitations = await db
    .select()
    .from(projectInvitations)
    .where(
      and(
        eq(projectInvitations.clerkOrgId, input.clerkOrgId),
        eq(projectInvitations.status, "pending"),
        normalizedEmail ? sql`lower(${projectInvitations.email}) = ${normalizedEmail}` : sql`true`,
      ),
    );

  if (pendingInvitations.length === 0) {
    return { resolvedCount: 0 };
  }

  let resolvedCount = 0;

  for (const invitation of pendingInvitations) {
    const membershipResult = await upsertProjectMember(
      invitation.projectId,
      user.id,
      invitation.role,
    );

    await db
      .update(projectInvitations)
      .set({
        status: "accepted",
        acceptedByUserId: user.id,
        acceptedAt: new Date(),
      })
      .where(eq(projectInvitations.id, invitation.id));

    const [project] = await db
      .select({
        id: projects.id,
        name: projects.name,
        workspaceId: projects.workspaceId,
      })
      .from(projects)
      .where(eq(projects.id, invitation.projectId))
      .limit(1);

    if (project) {
      await recordActivity({
        workspaceId: project.workspaceId,
        projectId: project.id,
        actorId: user.id,
        action: "updated",
        meta: {
          entityType: "project_invitation",
          event: "accepted",
          invitationId: invitation.id,
          email: invitation.email,
          role: invitation.role,
          membershipEvent: membershipResult.event,
          summary: `accepted project invite for "${project.name}"`,
        },
      });
    }

    resolvedCount += 1;
  }

  return { resolvedCount };
}
