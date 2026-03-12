import { asc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { assertProjectRole, getProjectMembership } from "@/lib/server/project-permissions";

type CreateTaskInput = {
  projectId: string;
  listId?: string | null;
  title: string;
  description?: string | null;
  status?: "open" | "in_progress" | "blocked" | "done";
  priority?: "none" | "low" | "medium" | "high" | "urgent";
  assigneeId?: string | null;
  reporterId?: string | null;
  dueDate?: Date | null;
  startDate?: Date | null;
  position?: number;
};

type UpdateTaskInput = Partial<{
  listId: string | null;
  title: string;
  description: string | null;
  status: "open" | "in_progress" | "blocked" | "done";
  priority: "none" | "low" | "medium" | "high" | "urgent";
  assigneeId: string | null;
  reporterId: string | null;
  dueDate: Date | null;
  startDate: Date | null;
  position: number;
  archived: boolean;
}>;

async function getAccessibleTask(taskId: string, userId: string) {
  const [task] = await db
    .select({
      id: tasks.id,
      projectId: tasks.projectId,
      listId: tasks.listId,
      position: tasks.position,
      title: tasks.title,
      description: tasks.description,
      status: tasks.status,
      priority: tasks.priority,
      assigneeId: tasks.assigneeId,
      reporterId: tasks.reporterId,
      dueDate: tasks.dueDate,
      startDate: tasks.startDate,
      archived: tasks.archived,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
    })
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1);

  if (!task) {
    throw new Error("NotFound");
  }

  const membership = await getProjectMembership(task.projectId, userId);

  if (!membership) {
    throw new Error("Forbidden");
  }

  return task;
}

export async function listProjectTasks(projectId: string, userId: string) {
  await assertProjectRole(projectId, userId, ["owner", "admin", "member", "viewer"]);

  return db.select().from(tasks).where(eq(tasks.projectId, projectId)).orderBy(asc(tasks.createdAt));
}

export async function createProjectTask(userId: string, input: CreateTaskInput) {
  await assertProjectRole(input.projectId, userId, ["owner", "admin", "member"]);

  const [task] = await db
    .insert(tasks)
    .values({
      projectId: input.projectId,
      listId: input.listId ?? null,
      title: input.title,
      description: input.description ?? null,
      status: input.status ?? "open",
      priority: input.priority ?? "none",
      assigneeId: input.assigneeId ?? null,
      reporterId: input.reporterId ?? null,
      dueDate: input.dueDate ?? null,
      startDate: input.startDate ?? null,
      position: input.position ?? 0,
    })
    .returning();

  if (!task) {
    throw new Error("Failed to create task");
  }

  return task;
}

export async function updateProjectTask(taskId: string, userId: string, input: UpdateTaskInput) {
  const existingTask = await getAccessibleTask(taskId, userId);
  await assertProjectRole(existingTask.projectId, userId, ["owner", "admin", "member"]);

  const [task] = await db
    .update(tasks)
    .set({
      ...input,
      projectId: existingTask.projectId,
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, taskId))
    .returning();

  if (!task) {
    throw new Error("NotFound");
  }

  return task;
}

export async function deleteProjectTask(taskId: string, userId: string) {
  const task = await getAccessibleTask(taskId, userId);
  await assertProjectRole(task.projectId, userId, ["owner", "admin", "member"]);

  const [deletedTask] = await db.delete(tasks).where(eq(tasks.id, taskId)).returning();

  if (!deletedTask) {
    throw new Error("NotFound");
  }

  return deletedTask;
}
