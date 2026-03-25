import { and, desc, eq } from "drizzle-orm";

import { getActiveClerkOrgRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { projectMembers, projects, workspaces } from "@/lib/db/schema";
import { recordActivity } from "@/lib/server/activity-crud";
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
  if (orgRole === "org:owner" || orgRole === "org:admin") {
    return "admin" as const;
  }

  return null;
}

function toComparableDate(value: Date | null | undefined) {
  return value ? new Date(value).toISOString() : null;
}

function buildProjectChangeMeta(
  previous: {
    name: string;
    description: string | null;
    key: string | null;
    dueDate: Date | null;
    archived: boolean;
  },
  next: {
    name: string;
    description: string | null;
    key: string | null;
    dueDate: Date | null;
    archived: boolean;
  },
) {
  const changes: Array<Record<string, unknown>> = [];

  if (previous.name !== next.name) {
    changes.push({ field: "name", from: previous.name, to: next.name });
  }

  if ((previous.description ?? null) !== (next.description ?? null)) {
    changes.push({
      field: "description",
      from: previous.description ?? null,
      to: next.description ?? null,
    });
  }

  if ((previous.key ?? null) !== (next.key ?? null)) {
    changes.push({ field: "key", from: previous.key ?? null, to: next.key ?? null });
  }

  if (toComparableDate(previous.dueDate) !== toComparableDate(next.dueDate)) {
    changes.push({
      field: "dueDate",
      from: toComparableDate(previous.dueDate),
      to: toComparableDate(next.dueDate),
    });
  }

  if (previous.archived !== next.archived) {
    changes.push({ field: "archived", from: previous.archived, to: next.archived });
  }

  return changes;
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
      and(eq(projectMembers.projectId, projects.id), eq(projectMembers.userId, userId)),
    )
    .innerJoin(workspaces, eq(workspaces.id, projects.workspaceId))
    .where(eq(workspaces.clerkOrgId, clerkOrgId))
    .orderBy(desc(projects.createdAt));
   }

export async function getAccessibleProjectById(
  projectId: string,
  userId: string,
  clerkOrgId: string,
) {
  const membership = await assertProjectRole(projectId, userId, [
    "admin",
    "member",
    "viewer",
  ]);
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
    .leftJoin(
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

export async function createProject(
  userId: string,
  clerkOrgId: string,
  input: CreateProjectInput,
) {
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
      role: "admin",
    });

    await ensureProjectDefaultLists(project.id, input.template ?? "simple");
  } catch (error) {
    await db.delete(projects).where(eq(projects.id, project.id));
    throw error;
  }

  await recordActivity({
    workspaceId: workspace.id,
    projectId: project.id,
    actorId: userId,
    action: "created",
    meta: {
      entityType: "project",
      projectName: project.name,
      summary: `created project "${project.name}"`,
    },
  });

  return {
    ...project,
    role: "admin" as const,
  };
}

export async function updateProject(
  projectId: string,
  userId: string,
  clerkOrgId: string,
  input: UpdateProjectInput,
) {
  const membership = await assertProjectRole(projectId, userId, ["admin"]);

  const [scopedProject] = await db
    .select({ id: projects.id })
    .from(projects)
    .innerJoin(workspaces, eq(workspaces.id, projects.workspaceId))
    .where(and(eq(projects.id, projectId), eq(workspaces.clerkOrgId, clerkOrgId)))
    .limit(1);

  if (!scopedProject) {
    throw new Error("NotFound");
  }

  const [projectBeforeUpdate] = await db
    .select({
      id: projects.id,
      workspaceId: projects.workspaceId,
      name: projects.name,
      description: projects.description,
      key: projects.key,
      dueDate: projects.dueDate,
      archived: projects.archived,
    })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!projectBeforeUpdate) {
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

  const changes = buildProjectChangeMeta(projectBeforeUpdate, project);
  const archiveChanged = projectBeforeUpdate.archived !== project.archived;

  await recordActivity({
    workspaceId: projectBeforeUpdate.workspaceId,
    projectId: project.id,
    actorId: userId,
    action: archiveChanged ? (project.archived ? "archived" : "unarchived") : "updated",
    meta: {
      entityType: "project",
      projectName: project.name,
      changes,
      summary: archiveChanged
        ? `${project.archived ? "archived" : "restored"} project "${project.name}"`
        : `updated project "${project.name}"`,
    },
  });

  return {
    ...project,
    role: membership.role,
  };
}

export async function deleteProject(projectId: string, userId: string, clerkOrgId: string) {
  await assertProjectRole(projectId, userId, ["admin"]);

  const [scopedProject] = await db
    .select({ id: projects.id })
    .from(projects)
    .innerJoin(workspaces, eq(workspaces.id, projects.workspaceId))
    .where(and(eq(projects.id, projectId), eq(workspaces.clerkOrgId, clerkOrgId)))
    .limit(1);

  if (!scopedProject) {
    throw new Error("NotFound");
  }

  const [projectBeforeDelete] = await db
    .select({
      id: projects.id,
      workspaceId: projects.workspaceId,
      name: projects.name,
    })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!projectBeforeDelete) {
    throw new Error("NotFound");
  }

  const [project] = await db.delete(projects).where(eq(projects.id, projectId)).returning();

  if (!project) {
    throw new Error("NotFound");
  }

  await recordActivity({
    workspaceId: projectBeforeDelete.workspaceId,
    actorId: userId,
    action: "updated",
    meta: {
      entityType: "project",
      event: "deleted",
      deletedProjectId: projectBeforeDelete.id,
      projectName: projectBeforeDelete.name,
      summary: `deleted project "${projectBeforeDelete.name}"`,
    },
  });

  return project;
}
