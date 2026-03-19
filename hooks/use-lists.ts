"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

type ListFromApi = {
  id: string;
  projectId: string;
  name: string;
  position: number;
  category: "todo" | "in_progress" | "done";
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
  projectId?: string;
  orderedListIds: string[];
};

type ListApiRecord = {
  id: string;
  projectId: string;
  name: string;
  position?: number | string | null;
  category?: ListFromApi["category"] | null;
  archived?: boolean | null;
  createdAt: string | Date;
  updatedAt: string | Date;
};

function normalizeList(input: ListApiRecord): ListFromApi {
  return {
    id: input.id,
    projectId: input.projectId,
    name: input.name,
    position: Number(input.position ?? 0),
    category: input.category ?? "todo",
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

export function useLists(projectId: string) {
  // List state for the current project board.
  const [lists, setLists] = useState<ListFromApi[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(projectId));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchLists = useCallback(async () => {
    if (!projectId) {
      setLists([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/lists?projectId=${encodeURIComponent(projectId)}`, {
        method: "GET",
        cache: "no-store",
      });
      const data = await parseApiResponse<ListFromApi[]>(response);
      setLists(data.map(normalizeList));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch lists");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  // Load project columns whenever the active project changes.
  useEffect(() => {
    void fetchLists();
  }, [fetchLists]);

  const createList = useCallback(
    async (input: Omit<CreateListInput, "projectId"> & { projectId?: string }) => {
      const resolvedProjectId = input.projectId ?? projectId;

      if (!resolvedProjectId) {
        throw new Error("Project id is required");
      }

      const optimisticList: ListFromApi = {
        id: `temp-${Date.now()}`,
        projectId: resolvedProjectId,
        name: input.name,
        position: input.position ?? lists.length,
        category: input.category ?? "todo",
        archived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const previousLists = lists;
      startTransition(() => {
        setLists((current) => [...current, optimisticList]);
      });

      try {
        const response = await fetch("/api/lists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId: resolvedProjectId,
            name: input.name,
            position: input.position ?? lists.length,
            category: input.category ?? "todo",
          }),
        });
        const created = normalizeList(await parseApiResponse<ListFromApi>(response));
        await fetchLists();
        return created;
      } catch (err) {
        startTransition(() => {
          setLists(previousLists);
        });
        throw err;
      }
    },
    [fetchLists, lists, projectId, startTransition],
  );

  const updateList = useCallback(
    async (listId: string, input: UpdateListInput) => {
      const previousLists = lists;

      startTransition(() => {
        setLists((current) =>
          current.map((list) =>
            list.id === listId
              ? {
                  ...list,
                  ...input,
                  updatedAt: new Date().toISOString(),
                }
              : list,
          ),
        );
      });

      try {
        const response = await fetch(`/api/lists/${listId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        const updated = normalizeList(await parseApiResponse<ListFromApi>(response));
        if (input.position !== undefined) {
          await fetchLists();
        } else {
          startTransition(() => {
            setLists((current) => current.map((list) => (list.id === listId ? updated : list)));
          });
        }
        return updated;
      } catch (err) {
        startTransition(() => {
          setLists(previousLists);
        });
        throw err;
      }
    },
    [fetchLists, lists, startTransition],
  );

  const deleteList = useCallback(
    async (listId: string) => {
      const previousLists = lists;

      startTransition(() => {
        setLists((current) => current.filter((list) => list.id !== listId));
      });

      try {
        const response = await fetch(`/api/lists/${listId}`, { method: "DELETE" });
        await parseApiResponse<ListFromApi>(response);
        await fetchLists();
      } catch (err) {
        startTransition(() => {
          setLists(previousLists);
        });
        throw err;
      }
    },
    [fetchLists, lists, startTransition],
  );

  const reorderLists = useCallback(
    async (input: ReorderListsInput) => {
      const resolvedProjectId = input.projectId ?? projectId;

      if (!resolvedProjectId) {
        throw new Error("Project id is required");
      }

      const previousLists = lists;
      const reordered = input.orderedListIds
        .map((id) => previousLists.find((list) => list.id === id))
        .filter((list): list is ListFromApi => Boolean(list))
        .map((list, index) => ({
          ...list,
          position: index,
          updatedAt: new Date().toISOString(),
        }));

      startTransition(() => {
        setLists(reordered);
      });

      try {
        const response = await fetch("/api/lists/reorder", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId: resolvedProjectId,
            orderedListIds: input.orderedListIds,
          }),
        });
        const data = await parseApiResponse<ListFromApi[]>(response);
        startTransition(() => {
          setLists(data.map(normalizeList));
        });
        return data.map(normalizeList);
      } catch (err) {
        startTransition(() => {
          setLists(previousLists);
        });
        throw err;
      }
    },
    [lists, projectId, startTransition],
  );

  return useMemo(
    () => ({
      lists,
      isLoading,
      error,
      isMutating: isPending,
      refetchLists: fetchLists,
      createList,
      updateList,
      deleteList,
      reorderLists,
    }),
    [
      lists,
      isLoading,
      error,
      isPending,
      fetchLists,
      createList,
      updateList,
      deleteList,
      reorderLists,
    ],
  );
}
