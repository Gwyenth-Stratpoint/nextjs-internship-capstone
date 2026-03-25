import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { comments, labels, lists, projects, taskLabels, tasks, users } from "@/lib/db/schema";
import { recordActivity } from "@/lib/server/activity-crud";
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
  labels?: string[];
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
  labels: string[];
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

function toComparableDate(value: Date | null | undefined) {
  return value ? new Date(value).toISOString() : null;
}

function formatTaskChangeSummary(fields: string[]) {
  if (fields.length === 0) {
    return "updated this task";
  }

  if (fields.length === 1) {
    return `updated ${fields[0]}`;
  }

  if (fields.length === 2) {
    return `updated ${fields[0]} and ${fields[1]}`;
  }

  return `updated ${fields.slice(0, -1).join(", ")}, and ${fields.at(-1)}`;
}

const taskCommentCounts = db
  .select({
    taskId: comments.taskId,
    commentCount: sql<number>`cast(count(*) as integer)`.as("comment_count"),
  })
  .from(comments)
  .groupBy(comments.taskId)
  .as("task_comment_counts");

function buildTaskRecordsQuery() {
  return db
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
      reporterName: users.name,
      reporterAvatarUrl: users.avatarUrl,
      commentCount: sql<number>`coalesce(${taskCommentCounts.commentCount}, 0)`,
    })
    .from(tasks)
    .leftJoin(users, eq(tasks.reporterId, users.id))
    .leftJoin(taskCommentCounts, eq(taskCommentCounts.taskId, tasks.id));
}

async function getTaskRecordById(taskId: string) {
  const [task] = await buildTaskRecordsQuery().where(eq(tasks.id, taskId)).limit(1);

  if (!task) {
    throw new Error("NotFound");
  }

  const [normalizedTask] = await attachTaskLabels([task]);
  return normalizedTask;
}

async function getProjectScope(projectId: string) {
  const [project] = await db
    .select({
      id: projects.id,
      workspaceId: projects.workspaceId,
      name: projects.name,
    })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!project) {
    throw new Error("NotFound");
  }

  return project;
}

async function getListName(listId: string | null) {
  if (!listId) {
    return "Unassigned";
  }

  const [list] = await db
    .select({ name: lists.name })
    .from(lists)
    .where(eq(lists.id, listId))
    .limit(1);
  return list?.name ?? "Unknown list";
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

function normalizeLabelNames(labelNames: string[] | undefined) {
  if (!labelNames) {
    return [];
  }

  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const rawLabel of labelNames) {
    const trimmed = rawLabel.trim();

    if (!trimmed) {
      continue;
    }

    const key = trimmed.toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    normalized.push(trimmed);
  }

  return normalized;
}

async function attachTaskLabels<T extends { id: string; projectId: string }>(rows: T[]) {
  if (rows.length === 0) {
    return [] as Array<T & { labels: string[] }>;
  }

  const taskIdSet = new Set(rows.map((row) => row.id));
  const labelRows = await db
    .select({
      taskId: taskLabels.taskId,
      name: labels.name,
    })
    .from(taskLabels)
    .innerJoin(labels, eq(labels.id, taskLabels.labelId))
    .where(inArray(taskLabels.taskId, Array.from(taskIdSet)));

  const labelsByTaskId = new Map<string, string[]>();

  for (const row of labelRows) {
    const current = labelsByTaskId.get(row.taskId) ?? [];
    current.push(row.name);
    labelsByTaskId.set(row.taskId, current);
  }

  return rows.map((row) => ({
    ...row,
    labels: labelsByTaskId.get(row.id) ?? [],
  }));
}

async function syncTaskLabels(projectId: string, taskId: string, labelNames: string[]) {
  const normalizedLabelNames = normalizeLabelNames(labelNames);

  await db.delete(taskLabels).where(eq(taskLabels.taskId, taskId));

  if (normalizedLabelNames.length === 0) {
    return;
  }

  const labelIds: string[] = [];

  for (const labelName of normalizedLabelNames) {
    const [existingLabel] = await db
      .select({
        id: labels.id,
      })
      .from(labels)
      .where(
        and(
          eq(labels.projectId, projectId),
          sql`lower(${labels.name}) = ${labelName.toLowerCase()}`,
        ),
      )
      .limit(1);

    if (existingLabel) {
      labelIds.push(existingLabel.id);
      continue;
    }

    const [createdLabel] = await db
      .insert(labels)
      .values({
        projectId,
        name: labelName,
      })
      .returning({ id: labels.id });

    if (createdLabel) {
      labelIds.push(createdLabel.id);
    }
  }

  if (labelIds.length > 0) {
    await db.insert(taskLabels).values(labelIds.map((labelId) => ({ taskId, labelId })));
  }
}

async function persistTaskOrder(
  projectId: string,
  listId: string | null,
  orderedTaskIds?: string[],
) {
  const resolvedIds =
    orderedTaskIds ?? (await getTaskOrderRows(projectId, listId)).map((task) => task.id);

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
      workspaceId: projects.workspaceId,
    })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .where(eq(tasks.id, taskId))
    .limit(1);

  if (!task) {
    throw new Error("NotFound");
  }

  const membership = await getProjectMembership(task.projectId, userId);

  if (!membership) {
    throw new Error("Forbidden");
  }

  const [normalizedTask] = await attachTaskLabels([task]);
  return normalizedTask;
}

export async function listProjectTasks(projectId: string, userId: string) {
  await assertProjectRole(projectId, userId, ["admin", "member", "viewer"]);

  const rows = await buildTaskRecordsQuery()
    .where(eq(tasks.projectId, projectId))
    .orderBy(asc(tasks.listId), asc(tasks.position), asc(tasks.createdAt));

  return attachTaskLabels(rows);
}

export async function createProjectTask(userId: string, input: CreateTaskInput) {
  await assertProjectRole(input.projectId, userId, ["admin", "member"]);
  const project = await getProjectScope(input.projectId);

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
      reporterId: input.reporterId ?? userId,
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
  await syncTaskLabels(input.projectId, task.id, input.labels ?? []);

  const createdTask = await getTaskRecordById(task.id);
  const listName = await getListName(createdTask.listId);

  await recordActivity({
    workspaceId: project.workspaceId,
    projectId: project.id,
    taskId: createdTask.id,
    actorId: userId,
    action: "created",
    meta: {
      entityType: "task",
      taskTitle: createdTask.title,
      listId: createdTask.listId,
      listName,
      priority: createdTask.priority,
      status: createdTask.status,
      summary: "created this task",
    },
  });

  return createdTask;
}

export async function updateProjectTask(taskId: string, userId: string, input: UpdateTaskInput) {
  const existingTask = await getAccessibleTask(taskId, userId);
  await assertProjectRole(existingTask.projectId, userId, ["admin", "member"]);
  const { labels: nextLabelInput, ...taskUpdateValues } = input;

  const nextListId =
    taskUpdateValues.listId !== undefined ? taskUpdateValues.listId : existingTask.listId;
  const previousLabels = existingTask.labels ?? [];

  if (nextListId) {
    await assertListBelongsToProject(nextListId, existingTask.projectId);
  }

  const isMovingLists =
    taskUpdateValues.listId !== undefined && taskUpdateValues.listId !== existingTask.listId;
  const isRepositioning = taskUpdateValues.position !== undefined;

  if (isMovingLists || isRepositioning) {
    const destinationSiblings = await getTaskOrderRows(existingTask.projectId, nextListId ?? null);
    const destinationIds = destinationSiblings.map((task) => task.id).filter((id) => id !== taskId);
    const targetPosition = clampPosition(
      input.position ?? destinationIds.length,
      destinationIds.length,
    );

    const [task] = await db
      .update(tasks)
      .set({
        ...taskUpdateValues,
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

    const updatedTask = await getTaskRecordById(taskId);
    const sourceListName = await getListName(existingTask.listId);
    const destinationListName = await getListName(updatedTask.listId);

    await recordActivity({
      workspaceId: existingTask.workspaceId,
      projectId: existingTask.projectId,
      taskId,
      actorId: userId,
      action: isMovingLists ? "moved" : "updated",
      meta: {
        entityType: "task",
        taskTitle: updatedTask.title,
        sourceListId: existingTask.listId,
        sourceListName,
        destinationListId: updatedTask.listId,
        destinationListName,
        previousPosition: existingTask.position,
        nextPosition: updatedTask.position,
        summary: isMovingLists
          ? `moved this task from ${sourceListName} to ${destinationListName}`
          : "reordered this task",
      },
    });

    return updatedTask;
  }

  const [task] = await db
    .update(tasks)
    .set({
      ...taskUpdateValues,
      projectId: existingTask.projectId,
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, taskId))
    .returning();

  if (!task) {
    throw new Error("NotFound");
  }

  if (nextLabelInput !== undefined) {
    await syncTaskLabels(existingTask.projectId, taskId, nextLabelInput);
  }

  const updatedTask = await getTaskRecordById(taskId);
  const changedFields: string[] = [];

  if (existingTask.title !== updatedTask.title) {
    changedFields.push("title");
  }

  if ((existingTask.description ?? null) !== (updatedTask.description ?? null)) {
    changedFields.push("description");
  }

  if (existingTask.status !== updatedTask.status) {
    changedFields.push("status");
  }

  if (existingTask.priority !== updatedTask.priority) {
    changedFields.push("priority");
  }

  if (toComparableDate(existingTask.dueDate) !== toComparableDate(updatedTask.dueDate)) {
    changedFields.push("due date");
  }

  if (toComparableDate(existingTask.startDate) !== toComparableDate(updatedTask.startDate)) {
    changedFields.push("start date");
  }

  if ((existingTask.reporterId ?? null) !== (updatedTask.reporterId ?? null)) {
    changedFields.push("reporter");
  }

  const nextLabels = updatedTask.labels ?? [];
  const labelsChanged =
    previousLabels.length !== nextLabels.length ||
    previousLabels.some((label, index) => label !== nextLabels[index]);

  if (labelsChanged) {
    changedFields.push("labels");
  }

  if ((existingTask.assigneeId ?? null) !== (updatedTask.assigneeId ?? null)) {
    if (updatedTask.assigneeId) {
      await recordActivity({
        workspaceId: existingTask.workspaceId,
        projectId: existingTask.projectId,
        taskId,
        actorId: userId,
        action: "assigned",
        meta: {
          entityType: "task",
          taskTitle: updatedTask.title,
          assigneeId: updatedTask.assigneeId,
          previousAssigneeId: existingTask.assigneeId,
          summary: "assigned this task",
        },
      });
    } else {
      await recordActivity({
        workspaceId: existingTask.workspaceId,
        projectId: existingTask.projectId,
        taskId,
        actorId: userId,
        action: "unassigned",
        meta: {
          entityType: "task",
          taskTitle: updatedTask.title,
          previousAssigneeId: existingTask.assigneeId,
          summary: "unassigned this task",
        },
      });
    }
  }

  if (existingTask.archived !== updatedTask.archived) {
    await recordActivity({
      workspaceId: existingTask.workspaceId,
      projectId: existingTask.projectId,
      taskId,
      actorId: userId,
      action: updatedTask.archived ? "archived" : "unarchived",
      meta: {
        entityType: "task",
        taskTitle: updatedTask.title,
        summary: `${updatedTask.archived ? "archived" : "restored"} this task`,
      },
    });
  }

  if (changedFields.length > 0) {
    await recordActivity({
      workspaceId: existingTask.workspaceId,
      projectId: existingTask.projectId,
      taskId,
      actorId: userId,
      action: "updated",
      meta: {
        entityType: "task",
        taskTitle: updatedTask.title,
        changedFields,
        summary: formatTaskChangeSummary(changedFields),
      },
    });
  }

  return updatedTask;
}

export async function deleteProjectTask(taskId: string, userId: string) {
  const task = await getAccessibleTask(taskId, userId);
  await assertProjectRole(task.projectId, userId, ["admin", "member"]);

  const [deletedTask] = await db.delete(tasks).where(eq(tasks.id, taskId)).returning();

  if (!deletedTask) {
    throw new Error("NotFound");
  }

  await persistTaskOrder(task.projectId, task.listId);

  await recordActivity({
    workspaceId: task.workspaceId,
    projectId: task.projectId,
    actorId: userId,
    action: "updated",
    meta: {
      entityType: "task",
      event: "deleted",
      deletedTaskId: task.id,
      taskTitle: task.title,
      summary: `deleted task "${task.title}"`,
    },
  });

  return deletedTask;
}

export async function reorderProjectTasks(userId: string, input: ReorderTasksInput) {
  await assertProjectRole(input.projectId, userId, ["admin", "member"]);
  const project = await getProjectScope(input.projectId);

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
  await recordActivity({
    workspaceId: project.workspaceId,
    projectId: project.id,
    actorId: userId,
    action: "updated",
    meta: {
      entityType: "task",
      event: "reordered",
      listId: input.listId,
      orderedTaskIds: input.orderedTaskIds,
      summary: `reordered tasks in project "${project.name}"`,
    },
  });

  return listProjectTasks(input.projectId, userId);
}
