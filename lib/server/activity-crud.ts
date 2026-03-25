import { db } from "@/lib/db";
import { activity } from "@/lib/db/schema";

type ActivityAction =
  | "created"
  | "updated"
  | "commented"
  | "moved"
  | "assigned"
  | "unassigned"
  | "labeled"
  | "unlabeled"
  | "archived"
  | "unarchived";

type ActivityEntry = {
  workspaceId?: string | null;
  projectId?: string | null;
  taskId?: string | null;
  actorId?: string | null;
  action: ActivityAction;
  meta?: Record<string, unknown>;
};

function normalizeEntry(entry: ActivityEntry) {
  return {
    workspaceId: entry.workspaceId ?? null,
    projectId: entry.projectId ?? null,
    taskId: entry.taskId ?? null,
    actorId: entry.actorId ?? null,
    action: entry.action,
    meta: entry.meta ?? {},
  };
}

export async function recordActivity(entry: ActivityEntry) {
  await db.insert(activity).values(normalizeEntry(entry));
}

export async function recordActivities(entries: ActivityEntry[]) {
  if (entries.length === 0) {
    return;
  }

  await db.insert(activity).values(entries.map(normalizeEntry));
}
