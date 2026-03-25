import { and, asc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { activity, comments, projects, tasks, users } from "@/lib/db/schema";
import { recordActivity } from "@/lib/server/activity-crud";
import { describeActivity } from "@/lib/server/activity-format";
import { assertProjectRole, getProjectMembership } from "@/lib/server/project-permissions";

type CreateTaskCommentInput = {
  content: string;
};

type TaskActivityItem = {
  id: string;
  description: string;
  createdAt: Date;
};

async function getAccessibleTaskScope(taskId: string, userId: string) {
  const [task] = await db
    .select({
      id: tasks.id,
      projectId: tasks.projectId,
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

  return task;
}

export async function listTaskComments(taskId: string, userId: string) {
  const task = await getAccessibleTaskScope(taskId, userId);
  await assertProjectRole(task.projectId, userId, ["admin", "member", "viewer"]);

  return db
    .select({
      id: comments.id,
      authorId: comments.authorId,
      authorName: users.name,
      content: comments.content,
      createdAt: comments.createdAt,
      updatedAt: comments.updatedAt,
    })
    .from(comments)
    .innerJoin(users, eq(comments.authorId, users.id))
    .where(and(eq(comments.taskId, taskId), eq(comments.deleted, false)))
    .orderBy(asc(comments.createdAt));
}

export async function createTaskComment(
  taskId: string,
  userId: string,
  input: CreateTaskCommentInput,
) {
  const task = await getAccessibleTaskScope(taskId, userId);
  await assertProjectRole(task.projectId, userId, ["admin", "member"]);

  const [createdComment] = await db
    .insert(comments)
    .values({
      taskId,
      authorId: userId,
      content: input.content.trim(),
    })
    .returning();

  if (!createdComment) {
    throw new Error("Failed to create comment");
  }

  await recordActivity({
    workspaceId: task.workspaceId,
    projectId: task.projectId,
    taskId,
    actorId: userId,
    action: "commented",
    meta: {
      commentId: createdComment.id,
      contentPreview: createdComment.content.slice(0, 120),
      summary: "commented on this task",
    },
  });

  const [normalizedComment] = await db
    .select({
      id: comments.id,
      authorId: comments.authorId,
      authorName: users.name,
      content: comments.content,
      createdAt: comments.createdAt,
      updatedAt: comments.updatedAt,
    })
    .from(comments)
    .innerJoin(users, eq(comments.authorId, users.id))
    .where(eq(comments.id, createdComment.id))
    .limit(1);

  if (!normalizedComment) {
    throw new Error("Failed to load comment");
  }

  return normalizedComment;
}

export async function listTaskActivity(
  taskId: string,
  userId: string,
): Promise<TaskActivityItem[]> {
  const task = await getAccessibleTaskScope(taskId, userId);
  await assertProjectRole(task.projectId, userId, ["admin", "member", "viewer"]);

  const rows = await db
    .select({
      id: activity.id,
      action: activity.action,
      meta: activity.meta,
      createdAt: activity.createdAt,
      actorName: users.name,
    })
    .from(activity)
    .leftJoin(users, eq(activity.actorId, users.id))
    .where(eq(activity.taskId, taskId))
    .orderBy(asc(activity.createdAt));

  return rows.map((row) => ({
    id: row.id,
    description: describeActivity(
      row.action,
      row.actorName,
      (row.meta ?? {}) as Record<string, unknown>,
    ),
    createdAt: row.createdAt,
  }));
}
