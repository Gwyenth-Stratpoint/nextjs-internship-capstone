// lib/db/index.ts
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { and, asc, desc, eq } from "drizzle-orm";

import * as schema from "./schema";
import { workspaceMembers, projects, projectMembers, lists, tasks, comments } from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("Missing DATABASE_URL environment variable");
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });

// App-layer membership guards (you chose this approach)
async function assertWorkspaceMember(workspaceId: string, userId: string) {
  const rows = await db
    .select({ userId: workspaceMembers.userId })
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId)))
    .limit(1);

  if (!rows.length) throw new Error("Forbidden: not a workspace member");
}

async function assertProjectMember(projectId: string, userId: string) {
  const rows = await db
    .select({ userId: projectMembers.userId })
    .from(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)))
    .limit(1);

  if (!rows.length) throw new Error("Forbidden: not a project member");
}

async function assertAssigneeIsProjectMember(projectId: string, assigneeId: string) {
  const rows = await db
    .select({ userId: projectMembers.userId })
    .from(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, assigneeId)))
    .limit(1);

  if (!rows.length) throw new Error("Assignee must be a member of the project");
}

// Queries (kept intentionally small)
export const queries = {
  projects: {
    getAllByWorkspace: async (workspaceId: string, actingUserId: string) => {
      await assertWorkspaceMember(workspaceId, actingUserId);
      return db
        .select()
        .from(projects)
        .where(eq(projects.workspaceId, workspaceId))
        .orderBy(desc(projects.createdAt));
    },

    getById: async (projectId: string, actingUserId: string) => {
      await assertProjectMember(projectId, actingUserId);
      const [row] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
      return row ?? null;
    },

    create: async (data: {
      workspaceId: string;
      name: string;
      description?: string | null;
      dueDate?: Date | null;
      createdById: string; 
    }) => {
      await assertWorkspaceMember(data.workspaceId, data.createdById);

      const [proj] = await db
        .insert(projects)
        .values({
          workspaceId: data.workspaceId,
          name: data.name,
          description: data.description ?? null,
          dueDate: data.dueDate ?? null,
          createdById: data.createdById,
        })
        .returning();

      if (!proj) throw new Error("Failed to create project");

      try {
        await db.insert(projectMembers).values({
          projectId: proj.id,
          userId: data.createdById,
          role: "admin",
        });
      } catch (error) {
        await db.delete(projects).where(eq(projects.id, proj.id));
        throw error;
      }

      return proj;
    },

    update: async (
      projectId: string,
      actingUserId: string,
      data: Partial<{
        name: string;
        description: string | null;
        dueDate: Date | null;
        archived: boolean;
      }>,
    ) => {
      await assertProjectMember(projectId, actingUserId);
      const [row] = await db
        .update(projects)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(projects.id, projectId))
        .returning();
      return row ?? null;
    },

    delete: async (projectId: string, actingUserId: string) => {
      await assertProjectMember(projectId, actingUserId);
      const [row] = await db.delete(projects).where(eq(projects.id, projectId)).returning();
      return row ?? null;
    },
  },

  lists: {
    getByProject: async (projectId: string, actingUserId: string) => {
      await assertProjectMember(projectId, actingUserId);
      return db
        .select()
        .from(lists)
        .where(eq(lists.projectId, projectId))
        .orderBy(asc(lists.position));
    },

    create: async (data: {
      projectId: string;
      name: string;
      position?: number;
      actingUserId: string;
    }) => {
      await assertProjectMember(data.projectId, data.actingUserId);
      const [row] = await db
        .insert(lists)
        .values({
          projectId: data.projectId,
          name: data.name,
          position: data.position ?? 0,
        })
        .returning();
      return row ?? null;
    },
  },

  tasks: {
    getByProject: async (projectId: string, actingUserId: string) => {
      await assertProjectMember(projectId, actingUserId);
      return db
        .select()
        .from(tasks)
        .where(eq(tasks.projectId, projectId))
        .orderBy(asc(tasks.createdAt));
    },

    create: async (data: {
      projectId: string;
      listId?: string | null;
      title: string;
      description?: string | null;
      priority?: "none" | "low" | "medium" | "high" | "urgent";
      status?: "open" | "in_progress" | "blocked" | "done";
      dueDate?: Date | null;
      assigneeId?: string | null;
      reporterId?: string | null;
      position?: number;
      actingUserId: string;
    }) => {
      await assertProjectMember(data.projectId, data.actingUserId);

      if (data.assigneeId) {
        await assertAssigneeIsProjectMember(data.projectId, data.assigneeId);
      }

      const [row] = await db
        .insert(tasks)
        .values({
          projectId: data.projectId,
          listId: data.listId ?? null,
          title: data.title,
          description: data.description ?? null,
          priority: data.priority ?? "none",
          status: data.status ?? "open",
          dueDate: data.dueDate ?? null,
          assigneeId: data.assigneeId ?? null,
          reporterId: data.reporterId ?? null,
          position: data.position ?? 0,
        })
        .returning();

      return row ?? null;
    },
  },

  comments: {
    getByTask: async (taskId: string, projectId: string, actingUserId: string) => {
      await assertProjectMember(projectId, actingUserId);
      return db
        .select()
        .from(comments)
        .where(eq(comments.taskId, taskId))
        .orderBy(asc(comments.createdAt));
    },

    create: async (data: {
      taskId: string;
      authorId: string;
      content: string;
      projectId: string;
    }) => {
      await assertProjectMember(data.projectId, data.authorId);
      const [row] = await db
        .insert(comments)
        .values({
          taskId: data.taskId,
          authorId: data.authorId,
          content: data.content,
        })
        .returning();
      return row ?? null;
    },
  },
};
