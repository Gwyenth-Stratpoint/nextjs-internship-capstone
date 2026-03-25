"use client";

import { Mail, Shield, UserPlus, Users } from "lucide-react";
import { useState } from "react";

import {
  CenteredModalSurface,
  ModalBackdrop,
  ModalField,
  ModalFooter,
  ModalHeader,
  ModalInputShell,
} from "@/components/modals/modal-primitives";
import { CardBadge, CardInset } from "@/components/ui/card";
import { useProjectMembers } from "@/hooks/use-project-members";

type ProjectMembersModalProps = {
  projectId: string;
  projectName: string;
  isOpen: boolean;
  onClose: () => void;
};

type WorkspaceRoleKey = "org:admin" | "org:member";
type ProjectRole = "admin" | "member" | "viewer";

function getInitials(name: string | null) {
  return (name ?? "Workspace member")
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function ProjectMembersModal({
  projectId,
  projectName,
  isOpen,
  onClose,
}: ProjectMembersModalProps) {
  const { snapshot, isLoading, isMutating, error, inviteMember } = useProjectMembers(
    projectId,
    isOpen,
  );
  const [email, setEmail] = useState("");
  const [workspaceRoleKey, setWorkspaceRoleKey] = useState<WorkspaceRoleKey>("org:member");
  const [projectRole, setProjectRole] = useState<ProjectRole>("member");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  if (!isOpen) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    setSubmitMessage(null);

    try {
      const result = await inviteMember({
        email,
        workspaceRoleKey,
        role: projectRole,
      });

      setSubmitMessage(result.message);
      setEmail("");
      setWorkspaceRoleKey("org:member");
      setProjectRole("member");
    } catch (submitErr) {
      setSubmitError(
        submitErr instanceof Error ? submitErr.message : "Failed to invite project member",
      );
    }
  }

  return (
    <ModalBackdrop onClose={onClose}>
      <CenteredModalSurface className="max-w-[40rem]">
        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          <ModalHeader
            title="Project access"
            description={`Invite people into ${projectName} or review current project access.`}
            eyebrow={
              <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                <Users size={12} />
                Project members
              </span>
            }
            onClose={onClose}
          />

          <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Current members</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Workspace members with direct access to this project.
                  </p>
                </div>

                <div className="space-y-2.5">
                  {isLoading ? (
                    <CardInset as="div" className="rounded-[18px] px-4 py-6 text-sm text-slate-500">
                      Loading project members...
                    </CardInset>
                  ) : snapshot?.members.length ? (
                    snapshot.members.map((member) => (
                      <CardInset key={member.id} className="rounded-[18px] px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#5b6bff_0%,#9446ff_100%)] text-sm font-semibold text-white">
                              {getInitials(member.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900">
                                {member.name ?? "Workspace member"}
                              </p>
                              <p className="truncate text-xs text-slate-500">{member.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <CardBadge className="border border-slate-200 bg-slate-50 text-slate-700">
                              {member.role}
                            </CardBadge>
                            <p className="mt-2 text-xs text-slate-500">
                              Added {formatDate(member.joinedAt)}
                            </p>
                          </div>
                        </div>
                      </CardInset>
                    ))
                  ) : (
                    <CardInset as="div" className="rounded-[18px] px-4 py-6 text-sm text-slate-500">
                      No direct project members yet.
                    </CardInset>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Invite to project</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Existing workspace members are added right away. New people get workspace access
                    first, then project access after acceptance.
                  </p>
                </div>

                <div className="space-y-3 rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                  <ModalField label="Email address">
                    <ModalInputShell icon={<Mail size={16} />}>
                      <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="teammate@example.com"
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-400"
                        required
                      />
                    </ModalInputShell>
                  </ModalField>

                  <ModalField label="Workspace role">
                    <ModalInputShell icon={<Shield size={16} />}>
                      <select
                        value={workspaceRoleKey}
                        onChange={(event) =>
                          setWorkspaceRoleKey(event.target.value as WorkspaceRoleKey)
                        }
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-400"
                      >
                        <option value="org:member">Workspace member</option>
                        <option value="org:admin">Workspace admin</option>
                      </select>
                    </ModalInputShell>
                  </ModalField>

                  <ModalField label="Project role">
                    <ModalInputShell icon={<UserPlus size={16} />}>
                      <select
                        value={projectRole}
                        onChange={(event) => setProjectRole(event.target.value as ProjectRole)}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-400"
                      >
                        <option value="viewer">Viewer</option>
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    </ModalInputShell>
                  </ModalField>

                  {submitMessage ? (
                    <p className="text-sm text-emerald-700">{submitMessage}</p>
                  ) : null}
                  {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}
                  {error ? <p className="text-sm text-red-600">{error}</p> : null}
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Pending project invites</h4>
                  <div className="mt-2 space-y-2.5">
                    {snapshot?.invitations.length ? (
                      snapshot.invitations.map((invitation) => (
                        <CardInset key={invitation.id} className="rounded-[18px] px-4 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900">
                                {invitation.email}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                Project {invitation.role} • Workspace{" "}
                                {invitation.workspaceRoleKey.replace("org:", "")}
                              </p>
                            </div>
                            <div className="text-right">
                              <CardBadge className="border border-amber-200 bg-amber-50 text-amber-700">
                                {invitation.status}
                              </CardBadge>
                              <p className="mt-2 text-xs text-slate-500">
                                {formatDate(invitation.createdAt)}
                              </p>
                            </div>
                          </div>
                        </CardInset>
                      ))
                    ) : (
                      <CardInset
                        as="div"
                        className="rounded-[18px] px-4 py-6 text-sm text-slate-500"
                      >
                        No pending project invites.
                      </CardInset>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <ModalFooter
            hint="This keeps workspace invites in Clerk, while project access remains scoped in your app."
            submitLabel={isMutating ? "Saving..." : "Invite to project"}
            isSubmitting={isMutating}
            onClose={onClose}
          />
        </form>
      </CenteredModalSurface>
    </ModalBackdrop>
  );
}
