"use client";

import { useEffect } from "react";

type UsePollingOptions = {
  enabled?: boolean;
  intervalMs: number;
  refreshOnVisible?: boolean;
};

export function usePolling(
  callback: () => Promise<void> | void,
  { enabled = true, intervalMs, refreshOnVisible = true }: UsePollingOptions,
) {
  useEffect(() => {
    if (!enabled || intervalMs <= 0) {
      return;
    }

    const tick = () => {
      if (typeof document !== "undefined" && document.hidden) {
        return;
      }

      void callback();
    };

    const intervalId = window.setInterval(tick, intervalMs);

    function handleVisibilityChange() {
      if (!refreshOnVisible || document.hidden) {
        return;
      }

      void callback();
    }

    if (refreshOnVisible) {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    return () => {
      window.clearInterval(intervalId);

      if (refreshOnVisible) {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
    };
  }, [callback, enabled, intervalMs, refreshOnVisible]);
}
