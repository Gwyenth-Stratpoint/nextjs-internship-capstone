import { and, asc, eq, inArray, isNull } from "drizzle-orm";

import { db } from "@/lib/db";
import { lists, tasks } from "@/lib/db/schema";
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

type ReorderTasksInput = {
  projectId: string;
  listId: string | null;
  orderedTaskIds: string[];
};

function clampPosition(position: number, max: number) {
  return Math.max(0, Math.min(position, max));
}

function listScopeCondition(listId: string | null) {
  return listId === null ? isNull(tasks.listId) : eq(tasks.listId, listId);
}

async function assertListBelongsToProject(listId: string, projectId: string) {
  const [list] = await db
    .select({
      id: lists.id,
      projectId: lists.projectId,
    })
    .from(lists)
    .where(eq(lists.id, listId))
    .limit(1);

  if (!list || list.projectId !== projectId) {
    throw new Error("InvalidList");
  }

  return list;
}

async function getTaskOrderRows(projectId: string, listId: string | null) {
  return db
    .select({
      id: tasks.id,
      createdAt: tasks.createdAt,
    })
    .from(tasks)
    .where(and(eq(tasks.projectId, projectId), listScopeCondition(listId)))
    .orderBy(asc(tasks.position), asc(tasks.createdAt));
}

async function persistTaskOrder(projectId: string, listId: string | null, orderedTaskIds?: string[]) {
  const resolvedIds =
    orderedTaskIds ??
    (await getTaskOrderRows(projectId, listId)).map((task) => task.id);

  for (const [position, taskId] of resolvedIds.entries()) {
    await db
      .update(tasks)
      .set({
        position,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, taskId));
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

  return db
    .select()
    .from(tasks)
    .where(eq(tasks.projectId, projectId))
    .orderBy(asc(tasks.listId), asc(tasks.position), asc(tasks.createdAt));
}

export async function createProjectTask(userId: string, input: CreateTaskInput) {
  await assertProjectRole(input.projectId, userId, ["owner", "admin", "member"]);

  if (input.listId) {
    await assertListBelongsToProject(input.listId, input.projectId);
  }

  const existingTasks = await getTaskOrderRows(input.projectId, input.listId ?? null);
  const targetPosition = clampPosition(
    input.position ?? existingTasks.length,
    existingTasks.length,
  );

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
      position: targetPosition,
    })
    .returning();

  if (!task) {
    throw new Error("Failed to create task");
  }

  const orderedTaskIds = existingTasks.map((existing) => existing.id);
  orderedTaskIds.splice(targetPosition, 0, task.id);
  await persistTaskOrder(input.projectId, input.listId ?? null, orderedTaskIds);

  return task;
}

export async function updateProjectTask(taskId: string, userId: string, input: UpdateTaskInput) {
  const existingTask = await getAccessibleTask(taskId, userId);
  await assertProjectRole(existingTask.projectId, userId, ["owner", "admin", "member"]);

  const nextListId = input.listId !== undefined ? input.listId : existingTask.listId;

  if (nextListId) {
    await assertListBelongsToProject(nextListId, existingTask.projectId);
  }

  const isMovingLists = input.listId !== undefined && input.listId !== existingTask.listId;
  const isRepositioning = input.position !== undefined;

  if (isMovingLists || isRepositioning) {
    const destinationSiblings = await getTaskOrderRows(existingTask.projectId, nextListId ?? null);
    const destinationIds = destinationSiblings
      .map((task) => task.id)
      .filter((id) => id !== taskId);
    const targetPosition = clampPosition(
      input.position ?? destinationIds.length,
      destinationIds.length,
    );

    const [task] = await db
      .update(tasks)
      .set({
        ...input,
        projectId: existingTask.projectId,
        listId: nextListId ?? null,
        position: targetPosition,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, taskId))
      .returning();

    if (!task) {
      throw new Error("NotFound");
    }

    destinationIds.splice(targetPosition, 0, taskId);

    if (isMovingLists) {
      await persistTaskOrder(existingTask.projectId, existingTask.listId);
    }

    await persistTaskOrder(existingTask.projectId, nextListId ?? null, destinationIds);

    const [normalizedTask] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);

    if (!normalizedTask) {
      throw new Error("NotFound");
    }

    return normalizedTask;
  }

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

  await persistTaskOrder(task.projectId, task.listId);

  return deletedTask;
}

export async function reorderProjectTasks(userId: string, input: ReorderTasksInput) {
  await assertProjectRole(input.projectId, userId, ["owner", "admin", "member"]);

  if (input.listId) {
    await assertListBelongsToProject(input.listId, input.projectId);
  }

  const existingTasks = await getTaskOrderRows(input.projectId, input.listId);
  const existingIds = existingTasks.map((task) => task.id);

  if (
    existingIds.length !== input.orderedTaskIds.length ||
    existingIds.some((id) => !input.orderedTaskIds.includes(id))
  ) {
    throw new Error("OrderMismatch");
  }

  const rows = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(
      and(
        eq(tasks.projectId, input.projectId),
        listScopeCondition(input.listId),
        inArray(tasks.id, input.orderedTaskIds),
      ),
    );

  if (rows.length !== input.orderedTaskIds.length) {
    throw new Error("OrderMismatch");
  }

  await persistTaskOrder(input.projectId, input.listId, input.orderedTaskIds);
  return listProjectTasks(input.projectId, userId);
}
