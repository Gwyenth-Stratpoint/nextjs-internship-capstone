import { and, asc, eq, inArray } from "drizzle-orm";

import { db } from "@/lib/db";
import { lists, projects, tasks } from "@/lib/db/schema";
import { recordActivities, recordActivity } from "@/lib/server/activity-crud";
import { assertProjectRole, getProjectMembership } from "@/lib/server/project-permissions";

type CreateListInput = {
  projectId: string;
  name: string;
  position?: number;
  category?: "todo" | "in_progress" | "done";
};

type UpdateListInput = Partial<{
  name: string;
  position: number;
  archived: boolean;
  category: "todo" | "in_progress" | "done";
}>;

type ReorderListsInput = {
  projectId: string;
  orderedListIds: string[];
};

type DeleteListInput = {
  moveTasksToListId?: string | null;
};

export type ProjectTemplate = "simple" | "software";

const PROJECT_TEMPLATE_LISTS: Record<
  ProjectTemplate,
  Array<{
    name: string;
    position: number;
    category: "todo" | "in_progress" | "done";
  }>
> = {
  simple: [
    {
      name: "Backlog",
      position: 0,
      category: "todo",
    },
    {
      name: "In Progress",
      position: 1,
      category: "in_progress",
    },
    {
      name: "Done",
      position: 2,
      category: "done",
    },
  ],
  software: [
    {
      name: "Backlog",
      position: 0,
      category: "todo",
    },
    {
      name: "To Do",
      position: 1,
      category: "in_progress",
    },
    {
      name: "In Progress",
      position: 2,
      category: "in_progress",
    },
    {
      name: "Review",
      position: 3,
      category: "in_progress",
    },
    {
      name: "Done",
      position: 4,
      category: "done",
    },
  ],
};

function clampPosition(position: number, max: number) {
  return Math.max(0, Math.min(position, max));
}

function mapListCategoryToTaskStatus(category: "todo" | "in_progress" | "done") {
  switch (category) {
    case "todo":
      return "open" as const;
    case "done":
      return "done" as const;
    default:
      return "in_progress" as const;
  }
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

function buildListChangeMeta(
  previous: {
    name: string;
    category: "todo" | "in_progress" | "done";
    archived: boolean;
    position: number;
  },
  next: {
    name: string;
    category: "todo" | "in_progress" | "done";
    archived: boolean;
    position: number;
  },
) {
  const changes: Array<Record<string, unknown>> = [];

  if (previous.name !== next.name) {
    changes.push({ field: "name", from: previous.name, to: next.name });
  }

  if (previous.category !== next.category) {
    changes.push({ field: "category", from: previous.category, to: next.category });
  }

  if (previous.archived !== next.archived) {
    changes.push({ field: "archived", from: previous.archived, to: next.archived });
  }

  if (previous.position !== next.position) {
    changes.push({ field: "position", from: previous.position, to: next.position });
  }

  return changes;
}

async function getProjectListRows(projectId: string) {
  return db
    .select({
      id: lists.id,
      name: lists.name,
      category: lists.category,
      archived: lists.archived,
      createdAt: lists.createdAt,
    })
    .from(lists)
    .where(eq(lists.projectId, projectId))
    .orderBy(asc(lists.position), asc(lists.createdAt));
}

async function assertUniqueTerminalCategory(
  projectId: string,
  category: "todo" | "in_progress" | "done",
  options?: { excludeListId?: string },
) {
  if (category === "in_progress") {
    return;
  }

  const existingLists = await getProjectListRows(projectId);
  const duplicate = existingLists.find(
    (list) => !list.archived && list.category === category && list.id !== options?.excludeListId,
  );

  if (duplicate) {
    throw new Error(
      category === "todo"
        ? "A start list already exists for this project"
        : "An end list already exists for this project",
    );
  }
}

export async function ensureProjectDefaultLists(
  projectId: string,
  template: ProjectTemplate = "simple",
) {
  const existingLists = await getProjectListRows(projectId);

  if (existingLists.length > 0) {
    return false;
  }

  await db.insert(lists).values(
    PROJECT_TEMPLATE_LISTS[template].map((list) => ({
      projectId,
      name: list.name,
      position: list.position,
      category: list.category,
    })),
  );

  return true;
}

async function persistListOrder(projectId: string, orderedListIds?: string[]) {
  const resolvedIds =
    orderedListIds ?? (await getProjectListRows(projectId)).map((list) => list.id);

  for (const [position, listId] of resolvedIds.entries()) {
    await db
      .update(lists)
      .set({
        position,
        updatedAt: new Date(),
      })
      .where(eq(lists.id, listId));
  }
}

async function getAccessibleList(listId: string, userId: string) {
  const [list] = await db
    .select({
      id: lists.id,
      projectId: lists.projectId,
      workspaceId: projects.workspaceId,
      name: lists.name,
      position: lists.position,
      category: lists.category,
      archived: lists.archived,
      createdAt: lists.createdAt,
      updatedAt: lists.updatedAt,
    })
    .from(lists)
    .innerJoin(projects, eq(lists.projectId, projects.id))
    .where(eq(lists.id, listId))
    .limit(1);

  if (!list) {
    throw new Error("NotFound");
  }

  const membership = await getProjectMembership(list.projectId, userId);

  if (!membership) {
    throw new Error("Forbidden");
  }

  return list;
}

export async function listProjectLists(projectId: string, userId: string) {
  await assertProjectRole(projectId, userId, ["owner", "admin", "member", "viewer"]);

  await ensureProjectDefaultLists(projectId);

  return db
    .select()
    .from(lists)
    .where(eq(lists.projectId, projectId))
    .orderBy(asc(lists.position), asc(lists.createdAt));
}

export async function createProjectList(userId: string, input: CreateListInput) {
  await assertProjectRole(input.projectId, userId, ["owner", "admin"]);
  const project = await getProjectScope(input.projectId);
  await assertUniqueTerminalCategory(input.projectId, input.category ?? "in_progress");
  const existingLists = await getProjectListRows(input.projectId);
  const targetPosition = clampPosition(
    input.position ?? existingLists.length,
    existingLists.length,
  );

  const [list] = await db
    .insert(lists)
    .values({
      projectId: input.projectId,
      name: input.name,
      position: targetPosition,
      category: input.category ?? "in_progress",
    })
    .returning();

  if (!list) {
    throw new Error("Failed to create list");
  }

  const orderedListIds = existingLists.map((existing) => existing.id);
  orderedListIds.splice(targetPosition, 0, list.id);
  await persistListOrder(input.projectId, orderedListIds);

  const [createdList] = await db.select().from(lists).where(eq(lists.id, list.id)).limit(1);

  if (!createdList) {
    throw new Error("Failed to create list");
  }

  await recordActivity({
    workspaceId: project.workspaceId,
    projectId: project.id,
    actorId: userId,
    action: "created",
    meta: {
      entityType: "list",
      listId: createdList.id,
      listName: createdList.name,
      category: createdList.category,
      summary: `created list "${createdList.name}"`,
    },
  });

  return createdList;
}

export async function updateProjectList(listId: string, userId: string, input: UpdateListInput) {
  const existingList = await getAccessibleList(listId, userId);
  await assertProjectRole(existingList.projectId, userId, ["owner", "admin"]);
  const nextCategory = input.category ?? existingList.category;
  await assertUniqueTerminalCategory(existingList.projectId, nextCategory, {
    excludeListId: listId,
  });

  if (input.position !== undefined) {
    const siblingIds = (await getProjectListRows(existingList.projectId))
      .map((list) => list.id)
      .filter((id) => id !== listId);
    const targetPosition = clampPosition(input.position, siblingIds.length);

    const [updatedList] = await db
      .update(lists)
      .set({
        name: input.name,
        archived: input.archived,
        position: targetPosition,
        category: input.category,
        updatedAt: new Date(),
      })
      .where(eq(lists.id, listId))
      .returning();

    if (!updatedList) {
      throw new Error("NotFound");
    }

    siblingIds.splice(targetPosition, 0, listId);
    await persistListOrder(existingList.projectId, siblingIds);

    const [normalizedList] = await db.select().from(lists).where(eq(lists.id, listId)).limit(1);

    if (!normalizedList) {
      throw new Error("NotFound");
    }

    await recordActivity({
      workspaceId: existingList.workspaceId,
      projectId: existingList.projectId,
      actorId: userId,
      action: "updated",
      meta: {
        entityType: "list",
        listId: normalizedList.id,
        listName: normalizedList.name,
        changes: buildListChangeMeta(existingList, normalizedList),
        summary: `updated list "${normalizedList.name}"`,
      },
    });

    return normalizedList;
  }

  const [updatedList] = await db
    .update(lists)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(lists.id, listId))
    .returning();

  if (!updatedList) {
    throw new Error("NotFound");
  }

  const [normalizedList] = await db.select().from(lists).where(eq(lists.id, listId)).limit(1);

  if (!normalizedList) {
    throw new Error("NotFound");
  }

  const archiveChanged = existingList.archived !== normalizedList.archived;

  await recordActivity({
    workspaceId: existingList.workspaceId,
    projectId: existingList.projectId,
    actorId: userId,
    action: archiveChanged ? (normalizedList.archived ? "archived" : "unarchived") : "updated",
    meta: {
      entityType: "list",
      listId: normalizedList.id,
      listName: normalizedList.name,
      changes: buildListChangeMeta(existingList, normalizedList),
      summary: archiveChanged
        ? `${normalizedList.archived ? "archived" : "restored"} list "${normalizedList.name}"`
        : `updated list "${normalizedList.name}"`,
    },
  });

  return normalizedList;
}

export async function deleteProjectList(
  listId: string,
  userId: string,
  input: DeleteListInput = {},
) {
  const existingList = await getAccessibleList(listId, userId);
  await assertProjectRole(existingList.projectId, userId, ["owner", "admin"]);

  if (existingList.category === "todo" || existingList.category === "done") {
    throw new Error(
      existingList.category === "todo"
        ? "The project must keep one start list"
        : "The project must keep one end list",
    );
  }

  const listTasks = await db
    .select({
      id: tasks.id,
      position: tasks.position,
    })
    .from(tasks)
    .where(and(eq(tasks.projectId, existingList.projectId), eq(tasks.listId, listId)))
    .orderBy(asc(tasks.position), asc(tasks.createdAt));

  let movedTaskCount = 0;
  let destinationListName: string | null = null;

  if (listTasks.length > 0) {
    if (!input.moveTasksToListId) {
      throw new Error("MoveTargetRequired");
    }

    if (input.moveTasksToListId === listId) {
      throw new Error("InvalidMoveTarget");
    }

    const [destinationList] = await db
      .select({
        id: lists.id,
        name: lists.name,
        category: lists.category,
        projectId: lists.projectId,
        archived: lists.archived,
      })
      .from(lists)
      .where(eq(lists.id, input.moveTasksToListId))
      .limit(1);

    if (
      !destinationList ||
      destinationList.projectId !== existingList.projectId ||
      destinationList.archived
    ) {
      throw new Error("InvalidMoveTarget");
    }

    const destinationTasks = await db
      .select({
        id: tasks.id,
      })
      .from(tasks)
      .where(and(eq(tasks.projectId, existingList.projectId), eq(tasks.listId, destinationList.id)))
      .orderBy(asc(tasks.position), asc(tasks.createdAt));

    const destinationStatus = mapListCategoryToTaskStatus(destinationList.category);

    for (const [offset, task] of listTasks.entries()) {
      await db
        .update(tasks)
        .set({
          listId: destinationList.id,
          position: destinationTasks.length + offset,
          status: destinationStatus,
          updatedAt: new Date(),
        })
        .where(eq(tasks.id, task.id));
    }

    await recordActivities(
      listTasks.map((task) => ({
        workspaceId: existingList.workspaceId,
        projectId: existingList.projectId,
        taskId: task.id,
        actorId: userId,
        action: "moved" as const,
        meta: {
          sourceListId: existingList.id,
          sourceListName: existingList.name,
          destinationListId: destinationList.id,
          destinationListName: destinationList.name,
          reason: "list_deleted",
          summary: `moved this task from ${existingList.name} to ${destinationList.name}`,
        },
      })),
    );

    movedTaskCount = listTasks.length;
    destinationListName = destinationList.name;
  }

  const [deletedList] = await db.delete(lists).where(eq(lists.id, listId)).returning();

  if (!deletedList) {
    throw new Error("NotFound");
  }

  await persistListOrder(existingList.projectId);

  await recordActivity({
    workspaceId: existingList.workspaceId,
    projectId: existingList.projectId,
    actorId: userId,
    action: "updated",
    meta: {
      entityType: "list",
      event: "deleted",
      listId: existingList.id,
      listName: existingList.name,
      movedTaskCount,
      destinationListName,
      summary:
        movedTaskCount > 0 && destinationListName
          ? `deleted list "${existingList.name}" and moved ${movedTaskCount} task${movedTaskCount === 1 ? "" : "s"} to "${destinationListName}"`
          : `deleted list "${existingList.name}"`,
    },
  });

  return deletedList;
}

export async function reorderProjectLists(userId: string, input: ReorderListsInput) {
  await assertProjectRole(input.projectId, userId, ["owner", "admin"]);
  const project = await getProjectScope(input.projectId);

  const existingLists = await getProjectListRows(input.projectId);
  const existingIds = existingLists.map((list) => list.id);

  if (
    existingIds.length !== input.orderedListIds.length ||
    existingIds.some((id) => !input.orderedListIds.includes(id))
  ) {
    throw new Error("OrderMismatch");
  }

  const rows = await db
    .select({ id: lists.id })
    .from(lists)
    .where(inArray(lists.id, input.orderedListIds));

  if (rows.length !== input.orderedListIds.length) {
    throw new Error("OrderMismatch");
  }

  await persistListOrder(input.projectId, input.orderedListIds);
  await recordActivity({
    workspaceId: project.workspaceId,
    projectId: project.id,
    actorId: userId,
    action: "updated",
    meta: {
      entityType: "list",
      event: "reordered",
      orderedListIds: input.orderedListIds,
      summary: `reordered lists in project "${project.name}"`,
    },
  });

  return listProjectLists(input.projectId, userId);
}
