"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

import { inviteProjectMemberAction } from "@/app/(dashboard)/projects/member-actions";

type ProjectMemberRecord = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: "owner" | "admin" | "member" | "viewer";
  joinedAt: string;
};

type ProjectInvitationRecord = {
  id: string;
  email: string;
  role: "owner" | "admin" | "member" | "viewer";
  workspaceRoleKey: "org:admin" | "org:member";
  status: "pending" | "accepted" | "revoked";
  createdAt: string;
};

type ProjectMembersSnapshot = {
  project: {
    id: string;
    name: string;
    clerkOrgId: string;
  };
  members: ProjectMemberRecord[];
  invitations: ProjectInvitationRecord[];
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

function normalizeSnapshot(snapshot: ProjectMembersSnapshot): ProjectMembersSnapshot {
  return {
    ...snapshot,
    members: snapshot.members.map((member) => ({
      ...member,
      name: member.name ?? "Workspace member",
      joinedAt: new Date(member.joinedAt).toISOString(),
    })),
    invitations: snapshot.invitations.map((invitation) => ({
      ...invitation,
      createdAt: new Date(invitation.createdAt).toISOString(),
    })),
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

export function useProjectMembers(projectId: string, enabled = true) {
  const [snapshot, setSnapshot] = useState<ProjectMembersSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchMembers = useCallback(async () => {
    if (!enabled || !projectId) {
      setSnapshot(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/members`, {
        method: "GET",
        cache: "no-store",
      });
      const data = await parseApiResponse<ProjectMembersSnapshot>(response);
      setSnapshot(normalizeSnapshot(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch project members");
    } finally {
      setIsLoading(false);
    }
  }, [enabled, projectId]);

  useEffect(() => {
    void fetchMembers();
  }, [fetchMembers]);

  const inviteMember = useCallback(
    async (input: {
      email: string;
      role: "owner" | "admin" | "member" | "viewer";
      workspaceRoleKey: "org:admin" | "org:member";
    }) => {
      const result = await inviteProjectMemberAction({
        projectId,
        email: input.email,
        role: input.role,
        workspaceRoleKey: input.workspaceRoleKey,
      });

      startTransition(() => {
        void fetchMembers();
      });

      return result;
    },
    [fetchMembers, projectId, startTransition],
  );

  return useMemo(
    () => ({
      snapshot,
      isLoading,
      isMutating: isPending,
      error,
      refetchMembers: fetchMembers,
      inviteMember,
    }),
    [error, fetchMembers, inviteMember, isLoading, isPending, snapshot],
  );
}
