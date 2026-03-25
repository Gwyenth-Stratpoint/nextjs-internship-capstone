"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

import {
  createTaskAction,
  deleteTaskAction,
  reorderTasksAction,
  updateTaskAction,
} from "@/app/(dashboard)/projects/board-actions";
import { usePolling } from "@/hooks/use-polling";

type TaskFromApi = {
  id: string;
  projectId: string;
  listId: string | null;
  position: number;
  title: string;
  description: string | null;
  status: "open" | "in_progress" | "blocked" | "done";
  priority: "none" | "low" | "medium" | "high" | "urgent";
  assigneeId: string | null;
  reporterId: string | null;
  dueDate: string | null;
  startDate: string | null;
  labels: string[];
  reporterName: string | null;
  reporterAvatarUrl: string | null;
  commentCount: number;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
};

type ApiSuccess<T> = {
  success: true;
  data: T;
};

type ApiError = {
  success: false;
  error: {
    code: string;
    message: string;
  };
};

type ApiResponse<T> = ApiSuccess<T> | ApiError;

type CreateTaskInput = {
  projectId: string;
  listId?: string | null;
  title: string;
  description?: string | null;
  status?: TaskFromApi["status"];
  priority?: TaskFromApi["priority"];
  assigneeId?: string | null;
  reporterId?: string | null;
  dueDate?: string | null;
  startDate?: string | null;
  labels?: string[];
  position?: number;
};

type UpdateTaskInput = Partial<{
  listId: string | null;
  title: string;
  description: string | null;
  status: TaskFromApi["status"];
  priority: TaskFromApi["priority"];
  assigneeId: string | null;
  reporterId: string | null;
  dueDate: string | null;
  startDate: string | null;
  labels: string[];
  position: number;
  archived: boolean;
}>;

type ReorderTasksInput = {
  projectId?: string;
  listId: string | null;
  orderedTaskIds: string[];
};

type TaskApiRecord = {
  id: string;
  projectId: string;
  listId?: string | null;
  position?: number | string | null;
  title: string;
  description?: string | null;
  status: TaskFromApi["status"];
  priority: TaskFromApi["priority"];
  assigneeId?: string | null;
  reporterId?: string | null;
  dueDate?: string | Date | null;
  startDate?: string | Date | null;
  labels?: string[] | null;
  reporterName?: string | null;
  reporterAvatarUrl?: string | null;
  commentCount?: number | string | null;
  archived?: boolean | null;
  createdAt: string | Date;
  updatedAt: string | Date;
};

function normalizeTask(input: TaskApiRecord): TaskFromApi {
  return {
    id: input.id,
    projectId: input.projectId,
    listId: input.listId ?? null,
    position: Number(input.position ?? 0),
    title: input.title,
    description: input.description ?? null,
    status: input.status,
    priority: input.priority,
    assigneeId: input.assigneeId ?? null,
    reporterId: input.reporterId ?? null,
    dueDate: input.dueDate ? new Date(input.dueDate).toISOString() : null,
    startDate: input.startDate ? new Date(input.startDate).toISOString() : null,
    labels: input.labels ?? [],
    reporterName: input.reporterName ?? null,
    reporterAvatarUrl: input.reporterAvatarUrl ?? null,
    commentCount: Number(input.commentCount ?? 0),
    archived: Boolean(input.archived),
    createdAt: new Date(input.createdAt).toISOString(),
    updatedAt: new Date(input.updatedAt).toISOString(),
  };
}

async function parseApiResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload.success) {
    const message = payload.success ? "Request failed" : payload.error.message;
    throw new Error(message);
  }

  return payload.data;
}

export function useTasks(projectId: string) {
  const TASKS_POLL_INTERVAL_MS = 5000;
  const [tasks, setTasks] = useState<TaskFromApi[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(projectId));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchTasks = useCallback(
    async (options?: { silent?: boolean }) => {
      const isSilent = options?.silent ?? false;

      if (!projectId) {
        setTasks([]);
        setIsLoading(false);
        setError(null);
        return;
      }

      if (!isSilent) {
        setIsLoading(true);
        setError(null);
      }

      try {
        const response = await fetch(`/api/tasks?projectId=${encodeURIComponent(projectId)}`, {
          method: "GET",
          cache: "no-store",
        });
        const data = await parseApiResponse<TaskFromApi[]>(response);
        setTasks(data.map(normalizeTask));
      } catch (err) {
        if (!isSilent) {
          setError(err instanceof Error ? err.message : "Failed to fetch tasks");
        }
      } finally {
        if (!isSilent) {
          setIsLoading(false);
        }
      }
    },
    [projectId],
  );

  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks]);

  usePolling(() => fetchTasks({ silent: true }), {
    enabled: Boolean(projectId),
    intervalMs: TASKS_POLL_INTERVAL_MS,
  });

  const createTask = useCallback(
    async (input: Omit<CreateTaskInput, "projectId"> & { projectId?: string }) => {
      const resolvedProjectId = input.projectId ?? projectId;

      if (!resolvedProjectId) {
        throw new Error("Project id is required");
      }

      const payload: CreateTaskInput = {
        projectId: resolvedProjectId,
        listId: input.listId ?? null,
        title: input.title,
        description: input.description ?? null,
        status: input.status,
        priority: input.priority,
        assigneeId: input.assigneeId ?? null,
        reporterId: input.reporterId ?? null,
        dueDate: input.dueDate ?? null,
        startDate: input.startDate ?? null,
        labels: input.labels ?? [],
        position: input.position,
      };

      const optimisticTask: TaskFromApi = {
        id: `temp-${Date.now()}`,
        projectId: payload.projectId,
        listId: payload.listId ?? null,
        position: payload.position ?? 0,
        title: payload.title,
        description: payload.description ?? null,
        status: payload.status ?? "open",
        priority: payload.priority ?? "none",
        assigneeId: payload.assigneeId ?? null,
        reporterId: payload.reporterId ?? null,
        dueDate: payload.dueDate ?? null,
        startDate: payload.startDate ?? null,
        labels: payload.labels ?? [],
        reporterName: null,
        reporterAvatarUrl: null,
        commentCount: 0,
        archived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const previousTasks = tasks;
      startTransition(() => {
        setTasks((current) => [...current, optimisticTask]);
      });

      try {
        const created = normalizeTask(await createTaskAction(payload));
        await fetchTasks();
        return created;
      } catch (err) {
        startTransition(() => {
          setTasks(previousTasks);
        });
        throw err;
      }
    },
    [fetchTasks, projectId, startTransition, tasks],
  );

  const updateTask = useCallback(
    async (taskId: string, input: UpdateTaskInput) => {
      const previousTasks = tasks;
      const optimisticUpdatedAt = new Date().toISOString();

      startTransition(() => {
        setTasks((current) =>
          current.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  ...input,
                  updatedAt: optimisticUpdatedAt,
                }
              : task,
          ),
        );
      });

      try {
        const updated = normalizeTask(await updateTaskAction(taskId, input));
        if (input.position !== undefined || input.listId !== undefined) {
          await fetchTasks();
        } else {
          startTransition(() => {
            setTasks((current) => current.map((task) => (task.id === taskId ? updated : task)));
          });
        }
        return updated;
      } catch (err) {
        startTransition(() => {
          setTasks(previousTasks);
        });
        throw err;
      }
    },
    [fetchTasks, startTransition, tasks],
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      const previousTasks = tasks;

      startTransition(() => {
        setTasks((current) => current.filter((task) => task.id !== taskId));
      });

      try {
        await deleteTaskAction(taskId);
        await fetchTasks();
      } catch (err) {
        startTransition(() => {
          setTasks(previousTasks);
        });
        throw err;
      }
    },
    [fetchTasks, startTransition, tasks],
  );

  const reorderTasks = useCallback(
    async (input: ReorderTasksInput) => {
      const resolvedProjectId = input.projectId ?? projectId;

      if (!resolvedProjectId) {
        throw new Error("Project id is required");
      }

      const previousTasks = tasks;
      const reorderedIds = new Set(input.orderedTaskIds);
      const reorderedTasks = input.orderedTaskIds
        .map((id) => previousTasks.find((task) => task.id === id))
        .filter((task): task is TaskFromApi => Boolean(task))
        .map((task, index) => ({
          ...task,
          listId: input.listId,
          position: index,
          updatedAt: new Date().toISOString(),
        }));
      const untouchedTasks = previousTasks.filter((task) => !reorderedIds.has(task.id));

      startTransition(() => {
        setTasks([...untouchedTasks, ...reorderedTasks]);
      });

      try {
        const data = await reorderTasksAction({
          projectId: resolvedProjectId,
          listId: input.listId,
          orderedTaskIds: input.orderedTaskIds,
        });
        startTransition(() => {
          setTasks(data.map(normalizeTask));
        });
        return data.map(normalizeTask);
      } catch (err) {
        startTransition(() => {
          setTasks(previousTasks);
        });
        throw err;
      }
    },
    [projectId, startTransition, tasks],
  );

  const moveTask = useCallback(
    async (taskId: string, newListId: string | null, position: number) => {
      return updateTask(taskId, {
        listId: newListId,
        position,
      });
    },
    [updateTask],
  );

  return useMemo(
    () => ({
      tasks,
      isLoading,
      error,
      isMutating: isPending,
      refetchTasks: fetchTasks,
      createTask,
      updateTask,
      deleteTask,
      reorderTasks,
      moveTask,
    }),
    [
      tasks,
      isLoading,
      error,
      isPending,
      fetchTasks,
      createTask,
      updateTask,
      deleteTask,
      reorderTasks,
      moveTask,
    ],
  );
}
