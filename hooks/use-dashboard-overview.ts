"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { DashboardOverview } from "@/lib/dashboard/types";
import { usePolling } from "@/hooks/use-polling";

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

export function useDashboardOverview() {
  const DASHBOARD_POLL_INTERVAL_MS = 10000;
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = useCallback(async (options?: { silent?: boolean }) => {
    const isSilent = options?.silent ?? false;

    if (!isSilent) {
      setIsLoading(true);
      setError(null);
    }

    try {
      const response = await fetch("/api/dashboard/overview", {
        method: "GET",
        cache: "no-store",
      });
      const data = await parseApiResponse<DashboardOverview>(response);
      setOverview(data);
    } catch (err) {
      if (!isSilent) {
        setError(err instanceof Error ? err.message : "Failed to fetch dashboard overview");
      }
    } finally {
      if (!isSilent) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void fetchOverview();
  }, [fetchOverview]);

  usePolling(() => fetchOverview({ silent: true }), {
    enabled: true,
    intervalMs: DASHBOARD_POLL_INTERVAL_MS,
  });

  return useMemo(
    () => ({
      overview,
      isLoading,
      error,
      refetchOverview: fetchOverview,
    }),
    [overview, isLoading, error, fetchOverview],
  );
}
