import { and, desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { projectMembers, projects, workspaceMembers, workspaces } from "@/lib/db/schema";

type CreateProjectInput = {
  name: string;
  description?: string | null;
  dueDate?: Date | null;
  key?: string | null;
};

type UpdateProjectInput = Partial<{
  name: string;
  description: string | null;
  dueDate: Date | null;
  key: string | null;
  archived: boolean;
}>;

function personalWorkspaceSlug(userId: string) {
  return `personal-${userId.slice(0, 12)}`;
}

async function getOrCreateOwnedWorkspace(userId: string) {
  const slug = personalWorkspaceSlug(userId);

  const [existingWorkspace] = await db.select().from(workspaces).where(eq(workspaces.slug, slug)).limit(1);

  const workspace =
    existingWorkspace ??
    (
      await db
        .insert(workspaces)
        .values({
          name: "My Workspace",
          slug,
          createdById: userId,
        })
        .returning()
    )[0];

  if (!workspace) {
    throw new Error("Failed to create workspace");
  }

  const [existingMembership] = await db
    .select()
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, workspace.id), eq(workspaceMembers.userId, userId)))
    .limit(1);

  if (!existingMembership) {
    await db.insert(workspaceMembers).values({
      workspaceId: workspace.id,
      userId,
      role: "owner",
      status: "active",
    });
  }

  return workspace.id;
}

async function assertProjectOwner(projectId: string, userId: string) {
  const [membership] = await db
    .select({ projectId: projectMembers.projectId })
    .from(projectMembers)
    .where(
      and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, userId),
        eq(projectMembers.role, "owner"),
      ),
    )
    .limit(1);

  if (!membership) {
    throw new Error("Forbidden");
  }
}

export async function listOwnedProjects(userId: string) {
  return db
    .select({
      id: projects.id,
      workspaceId: projects.workspaceId,
      name: projects.name,
      description: projects.description,
      key: projects.key,
      dueDate: projects.dueDate,
      createdById: projects.createdById,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      archived: projects.archived,
    })
    .from(projects)
    .innerJoin(
      projectMembers,
      and(
        eq(projectMembers.projectId, projects.id),
        eq(projectMembers.userId, userId),
        eq(projectMembers.role, "owner"),
      ),
    )
    .orderBy(desc(projects.createdAt));
}

export async function getOwnedProjectById(projectId: string, userId: string) {
  await assertProjectOwner(projectId, userId);

  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);

  if (!project) {
    throw new Error("NotFound");
  }

  return project;
}

export async function createOwnedProject(userId: string, input: CreateProjectInput) {
  const workspaceId = await getOrCreateOwnedWorkspace(userId);

  const [project] = await db
    .insert(projects)
    .values({
      workspaceId,
      name: input.name,
      description: input.description ?? null,
      dueDate: input.dueDate ?? null,
      key: input.key ?? null,
      createdById: userId,
    })
    .returning();

  if (!project) {
    throw new Error("Failed to create project");
  }

  try {
    await db.insert(projectMembers).values({
      projectId: project.id,
      userId,
      role: "owner",
    });
  } catch (error) {
    await db.delete(projects).where(eq(projects.id, project.id));
    throw error;
  }

  return project;
}

export async function updateOwnedProject(projectId: string, userId: string, input: UpdateProjectInput) {
  await assertProjectOwner(projectId, userId);

  const [project] = await db
    .update(projects)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(projects.id, projectId))
    .returning();

  if (!project) {
    throw new Error("NotFound");
  }

  return project;
}

export async function deleteOwnedProject(projectId: string, userId: string) {
  await assertProjectOwner(projectId, userId);

  const [project] = await db.delete(projects).where(eq(projects.id, projectId)).returning();

  if (!project) {
    throw new Error("NotFound");
  }

  return project;
}
