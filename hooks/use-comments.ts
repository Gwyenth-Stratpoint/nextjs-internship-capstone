"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

import { createCommentAction } from "@/app/(dashboard)/projects/board-actions";
import { usePolling } from "@/hooks/use-polling";

type TaskComment = {
  id: string;
  authorId: string;
  authorName: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
};

type TaskActivityItem = {
  id: string;
  description: string;
  createdAt: string;
};

type DiscussionPayload = {
  comments: TaskComment[];
  activityItems: TaskActivityItem[];
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

function normalizeComment(input: TaskComment) {
  return {
    ...input,
    authorName: input.authorName ?? "Unknown user",
    createdAt: new Date(input.createdAt).toISOString(),
    updatedAt: new Date(input.updatedAt).toISOString(),
  };
}

function normalizeActivityItem(input: TaskActivityItem) {
  return {
    ...input,
    createdAt: new Date(input.createdAt).toISOString(),
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

export function useComments(taskId: string | null) {
  const COMMENTS_POLL_INTERVAL_MS = 5000;
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [activityItems, setActivityItems] = useState<TaskActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(taskId));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchDiscussion = useCallback(
    async (options?: { silent?: boolean }) => {
      const isSilent = options?.silent ?? false;

      if (!taskId) {
        setComments([]);
        setActivityItems([]);
        setIsLoading(false);
        setError(null);
        return;
      }

      if (!isSilent) {
        setIsLoading(true);
        setError(null);
      }

      try {
        const response = await fetch(`/api/tasks/${taskId}/comments`, {
          method: "GET",
          cache: "no-store",
        });
        const data = await parseApiResponse<DiscussionPayload>(response);
        setComments(data.comments.map(normalizeComment));
        setActivityItems(data.activityItems.map(normalizeActivityItem));
      } catch (err) {
        if (!isSilent) {
          setError(err instanceof Error ? err.message : "Failed to fetch comments");
        }
      } finally {
        if (!isSilent) {
          setIsLoading(false);
        }
      }
    },
    [taskId],
  );

  useEffect(() => {
    void fetchDiscussion();
  }, [fetchDiscussion]);

  usePolling(() => fetchDiscussion({ silent: true }), {
    enabled: Boolean(taskId),
    intervalMs: COMMENTS_POLL_INTERVAL_MS,
  });

  const createComment = useCallback(
    async (content: string) => {
      if (!taskId) {
        throw new Error("Task id is required");
      }

      const trimmedContent = content.trim();
      if (!trimmedContent) {
        throw new Error("Comment is required");
      }

      try {
        const createdComment = normalizeComment(
          await createCommentAction({
            taskId,
            content: trimmedContent,
          }),
        );

        startTransition(() => {
          setComments((current) => [...current, createdComment]);
        });

        await fetchDiscussion();
        return createdComment;
      } catch (err) {
        throw err instanceof Error ? err : new Error("Failed to add comment");
      }
    },
    [fetchDiscussion, startTransition, taskId],
  );

  return useMemo(
    () => ({
      comments,
      activityItems,
      isLoading,
      isMutating: isPending,
      error,
      refetchDiscussion: fetchDiscussion,
      createComment,
    }),
    [activityItems, comments, createComment, error, fetchDiscussion, isLoading, isPending],
  );
}
