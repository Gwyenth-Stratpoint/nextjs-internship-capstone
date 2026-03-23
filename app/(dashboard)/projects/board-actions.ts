"use server";

import { z } from "zod";

import { requireDbUserId } from "@/lib/auth";
import { createTaskComment } from "@/lib/server/comment-crud";
import {
  createProjectList,
  deleteProjectList,
  reorderProjectLists,
  updateProjectList,
} from "@/lib/server/list-crud";
import {
  createProjectTask,
  deleteProjectTask,
  reorderProjectTasks,
  updateProjectTask,
} from "@/lib/server/task-crud";
import {
  listDeleteSchema,
  listReorderSchema,
  listSchema,
  listUpdateSchema,
  commentSchema,
  taskReorderSchema,
  taskSchema,
  taskUpdateSchema,
} from "@/lib/validations";

const listIdSchema = z.string().uuid("Invalid list id");
const taskIdSchema = z.string().uuid("Invalid task id");

export async function createListAction(input: z.input<typeof listSchema>) {
  const userId = await requireDbUserId();
  const payload = listSchema.parse(input);
  return createProjectList(userId, payload);
}

export async function updateListAction(listId: string, input: z.input<typeof listUpdateSchema>) {
  const userId = await requireDbUserId();
  const id = listIdSchema.parse(listId);
  const payload = listUpdateSchema.parse(input);
  return updateProjectList(id, userId, payload);
}

export async function deleteListAction(listId: string, input?: z.input<typeof listDeleteSchema>) {
  const userId = await requireDbUserId();
  const id = listIdSchema.parse(listId);
  const payload = listDeleteSchema.parse(input ?? {});
  return deleteProjectList(id, userId, payload);
}

export async function reorderListsAction(input: z.input<typeof listReorderSchema>) {
  const userId = await requireDbUserId();
  const payload = listReorderSchema.parse(input);
  return reorderProjectLists(userId, payload);
}

export async function createTaskAction(input: z.input<typeof taskSchema>) {
  const userId = await requireDbUserId();
  const payload = taskSchema.parse(input);
  return createProjectTask(userId, payload);
}

export async function updateTaskAction(taskId: string, input: z.input<typeof taskUpdateSchema>) {
  const userId = await requireDbUserId();
  const id = taskIdSchema.parse(taskId);
  const payload = taskUpdateSchema.parse(input);
  return updateProjectTask(id, userId, payload);
}

export async function deleteTaskAction(taskId: string) {
  const userId = await requireDbUserId();
  const id = taskIdSchema.parse(taskId);
  return deleteProjectTask(id, userId);
}

export async function reorderTasksAction(input: z.input<typeof taskReorderSchema>) {
  const userId = await requireDbUserId();
  const payload = taskReorderSchema.parse(input);
  return reorderProjectTasks(userId, payload);
}

export async function createCommentAction(input: z.input<typeof commentSchema>) {
  const userId = await requireDbUserId();
  const payload = commentSchema.parse(input);
  return createTaskComment(payload.taskId, userId, payload);
}
