"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type ProjectAssignee = {
  id: string;
  name: string | null;
  email: string;
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

async function parseApiResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload.success) {
    const message = payload.success ? "Request failed" : payload.error.message;
    throw new Error(message);
  }

  return payload.data;
}

export function useProjectAssignees(projectId: string, enabled = true) {
  const [assignees, setAssignees] = useState<ProjectAssignee[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignees = useCallback(async () => {
    if (!enabled || !projectId) {
      setAssignees([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/assignees`, {
        method: "GET",
        cache: "no-store",
      });
      const data = await parseApiResponse<ProjectAssignee[]>(response);
      setAssignees(
        data.map((entry) => ({
          ...entry,
          name: entry.name ?? entry.email,
        })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch project assignees");
    } finally {
      setIsLoading(false);
    }
  }, [enabled, projectId]);

  useEffect(() => {
    void fetchAssignees();
  }, [fetchAssignees]);

  return useMemo(
    () => ({
      assignees,
      isLoading,
      error,
      refetchAssignees: fetchAssignees,
    }),
    [assignees, isLoading, error, fetchAssignees],
  );
}
