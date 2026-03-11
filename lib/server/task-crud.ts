import { and, asc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { projectMembers, tasks } from "@/lib/db/schema";

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

async function assertProjectMember(projectId: string, userId: string) {
  const [membership] = await db
    .select({ userId: projectMembers.userId })
    .from(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)))
    .limit(1);

  if (!membership) {
    throw new Error("Forbidden");
  }
}

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
    .innerJoin(
      projectMembers,
      and(eq(projectMembers.projectId, tasks.projectId), eq(projectMembers.userId, userId)),
    )
    .where(eq(tasks.id, taskId))
    .limit(1);

  if (!task) {
    throw new Error("NotFound");
  }

  return task;
}

export async function listProjectTasks(projectId: string, userId: string) {
  await assertProjectMember(projectId, userId);

  return db.select().from(tasks).where(eq(tasks.projectId, projectId)).orderBy(asc(tasks.createdAt));
}

export async function createProjectTask(userId: string, input: CreateTaskInput) {
  await assertProjectMember(input.projectId, userId);

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
  await getAccessibleTask(taskId, userId);

  const [task] = await db.delete(tasks).where(eq(tasks.id, taskId)).returning();

  if (!task) {
    throw new Error("NotFound");
  }

  return task;
}
