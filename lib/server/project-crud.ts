import { and, desc, eq } from "drizzle-orm";

import { getActiveClerkOrgRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { projectMembers, projects, workspaces } from "@/lib/db/schema";
import { ensureProjectDefaultLists, type ProjectTemplate } from "@/lib/server/list-crud";
import { assertProjectRole } from "@/lib/server/project-permissions";
import { requireWorkspaceForClerkOrg } from "@/lib/server/workspace-crud";

type CreateProjectInput = {
  name: string;
  description?: string | null;
  dueDate?: Date | null;
  key?: string | null;
  template?: ProjectTemplate;
};

type UpdateProjectInput = Partial<{
  name: string;
  description: string | null;
  dueDate: Date | null;
  key: string | null;
  archived: boolean;
}>;

function mapOrganizationRoleToProjectRole(orgRole: string | null) {
  if (orgRole === "org:owner") {
    return "owner" as const;
  }

  if (orgRole === "org:admin") {
    return "admin" as const;
  }

  return null;
}

export async function listAccessibleProjects(userId: string, clerkOrgId: string) {
  const organizationRole = mapOrganizationRoleToProjectRole(await getActiveClerkOrgRole());

  if (organizationRole) {
    const rows = await db
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
        role: projectMembers.role,
      })
      .from(projects)
      .innerJoin(workspaces, eq(workspaces.id, projects.workspaceId))
      .leftJoin(
        projectMembers,
        and(eq(projectMembers.projectId, projects.id), eq(projectMembers.userId, userId)),
      )
      .where(eq(workspaces.clerkOrgId, clerkOrgId))
      .orderBy(desc(projects.createdAt));

    return rows.map((row) => ({
      ...row,
      role: row.role ?? organizationRole,
    }));
  }

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
      role: projectMembers.role,
    })
    .from(projects)
    .innerJoin(
      projectMembers,
      and(
        eq(projectMembers.projectId, projects.id),
        eq(projectMembers.userId, userId),
      ),
    )
    .innerJoin(workspaces, eq(workspaces.id, projects.workspaceId))
    .where(eq(workspaces.clerkOrgId, clerkOrgId))
    .orderBy(desc(projects.createdAt));
}

export async function getAccessibleProjectById(projectId: string, userId: string, clerkOrgId: string) {
  const membership = await assertProjectRole(projectId, userId, ["owner", "admin", "member", "viewer"]);
  const [project] = await db
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
      role: projectMembers.role,
    })
    .from(projects)
    .innerJoin(
      projectMembers,
      and(eq(projectMembers.projectId, projects.id), eq(projectMembers.userId, userId)),
    )
    .innerJoin(workspaces, eq(workspaces.id, projects.workspaceId))
    .where(and(eq(projects.id, projectId), eq(workspaces.clerkOrgId, clerkOrgId)))
    .limit(1);

  if (!project) {
    throw new Error("NotFound");
  }

  return {
    ...project,
    role: membership.role,
  };
}

export async function createOwnedProject(userId: string, clerkOrgId: string, input: CreateProjectInput) {
  const workspace = await requireWorkspaceForClerkOrg(clerkOrgId, userId);

  const [project] = await db
    .insert(projects)
    .values({
      workspaceId: workspace.id,
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

    await ensureProjectDefaultLists(project.id, input.template ?? "simple");
  } catch (error) {
    await db.delete(projects).where(eq(projects.id, project.id));
    throw error;
  }

  return project;
}

export async function updateOwnedProject(
  projectId: string,
  userId: string,
  clerkOrgId: string,
  input: UpdateProjectInput,
) {
  await assertProjectRole(projectId, userId, ["owner", "admin"]);

  const [scopedProject] = await db
    .select({ id: projects.id })
    .from(projects)
    .innerJoin(workspaces, eq(workspaces.id, projects.workspaceId))
    .where(and(eq(projects.id, projectId), eq(workspaces.clerkOrgId, clerkOrgId)))
    .limit(1);

  if (!scopedProject) {
    throw new Error("NotFound");
  }

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

export async function deleteOwnedProject(projectId: string, userId: string, clerkOrgId: string) {
  await assertProjectRole(projectId, userId, ["owner", "admin"]);

  const [scopedProject] = await db
    .select({ id: projects.id })
    .from(projects)
    .innerJoin(workspaces, eq(workspaces.id, projects.workspaceId))
    .where(and(eq(projects.id, projectId), eq(workspaces.clerkOrgId, clerkOrgId)))
    .limit(1);

  if (!scopedProject) {
    throw new Error("NotFound");
  }

  const [project] = await db.delete(projects).where(eq(projects.id, projectId)).returning();

  if (!project) {
    throw new Error("NotFound");
  }

  return project;
}
