"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

import {
  createProjectAction,
  deleteProjectAction,
  updateProjectAction,
} from "@/app/(dashboard)/projects/actions";

type ProjectFromApi = {
  id: string;
  workspaceId: string;
  name: string;
  key: string | null;
  description: string | null;
  dueDate: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
  role: "owner" | "admin" | "member" | "viewer";
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

type CreateProjectInput = {
  name: string;
  description?: string | null;
  key?: string | null;
  dueDate?: string | null;
};

type UpdateProjectInput = Partial<{
  name: string;
  description: string | null;
  key: string | null;
  dueDate: string | null;
  archived: boolean;
}>;

function normalizeProject(input: any): ProjectFromApi {
  return {
    id: input.id,
    workspaceId: input.workspaceId,
    name: input.name,
    key: input.key ?? null,
    description: input.description ?? null,
    dueDate: input.dueDate ? new Date(input.dueDate).toISOString() : null,
    createdById: input.createdById ?? null,
    createdAt: new Date(input.createdAt).toISOString(),
    updatedAt: new Date(input.updatedAt).toISOString(),
    archived: Boolean(input.archived),
    role: input.role ?? "viewer",
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

export function useProjects() {
  const [projects, setProjects] = useState<ProjectFromApi[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/projects", { method: "GET", cache: "no-store" });
      const data = await parseApiResponse<ProjectFromApi[]>(response);
      setProjects(data.map(normalizeProject));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch projects");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProjects();
  }, [fetchProjects]);

  const createProject = useCallback(
    async (input: CreateProjectInput) => {
      const created = await createProjectAction({
        name: input.name,
        description: input.description ?? null,
        key: input.key ?? null,
        dueDate: input.dueDate ?? null,
      });
      const normalized = normalizeProject(created);
      startTransition(() => {
        setProjects((prev) => [normalized, ...prev]);
      });
      return normalized;
    },
    [startTransition],
  );

  const updateProject = useCallback(
    async (projectId: string, input: UpdateProjectInput) => {
      const updated = await updateProjectAction(projectId, {
        ...input,
        dueDate: input.dueDate ?? undefined,
      });
      const normalized = normalizeProject(updated);
      startTransition(() => {
        setProjects((prev) => prev.map((project) => (project.id === projectId ? normalized : project)));
      });
      return normalized;
    },
    [startTransition],
  );

  const deleteProject = useCallback(
    async (projectId: string) => {
      await deleteProjectAction(projectId);
      startTransition(() => {
        setProjects((prev) => prev.filter((project) => project.id !== projectId));
      });
    },
    [startTransition],
  );

  return useMemo(
    () => ({
      projects,
      isLoading,
      error,
      isMutating: isPending,
      refetchProjects: fetchProjects,
      createProject,
      updateProject,
      deleteProject,
    }),
    [projects, isLoading, error, isPending, fetchProjects, createProject, updateProject, deleteProject],
  );
}
