"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { usePolling } from "@/hooks/use-polling";

type ProjectActivityItem = {
  id: string;
  description: string;
  createdAt: string;
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

export function useProjectActivity(projectId: string) {
  const PROJECT_ACTIVITY_POLL_INTERVAL_MS = 5000;
  const [activityItems, setActivityItems] = useState<ProjectActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(projectId));
  const [error, setError] = useState<string | null>(null);

  const fetchActivity = useCallback(
    async (options?: { silent?: boolean }) => {
      const isSilent = options?.silent ?? false;

      if (!projectId) {
        setActivityItems([]);
        setError(null);
        setIsLoading(false);
        return;
      }

      if (!isSilent) {
        setIsLoading(true);
        setError(null);
      }

      try {
        const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/activity`, {
          method: "GET",
          cache: "no-store",
        });
        const data = await parseApiResponse<ProjectActivityItem[]>(response);
        setActivityItems(data);
      } catch (err) {
        if (!isSilent) {
          setError(err instanceof Error ? err.message : "Failed to fetch project activity");
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
    void fetchActivity();
  }, [fetchActivity]);

  usePolling(() => fetchActivity({ silent: true }), {
    enabled: Boolean(projectId),
    intervalMs: PROJECT_ACTIVITY_POLL_INTERVAL_MS,
  });

  return useMemo(
    () => ({
      activityItems,
      isLoading,
      error,
      refetchActivity: fetchActivity,
    }),
    [activityItems, isLoading, error, fetchActivity],
  );
}
