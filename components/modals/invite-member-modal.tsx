"use client";

import { Mail, Shield, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { inviteWorkspaceMemberAction } from "@/app/(dashboard)/team/actions";
import {
  CenteredModalSurface,
  ModalBackdrop,
  ModalField,
  ModalFooter,
  ModalHeader,
  ModalInputShell,
} from "@/components/modals/modal-primitives";

type InviteMemberModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type InviteRole = "org:admin" | "org:member";

export function InviteMemberModal({ isOpen, onClose }: InviteMemberModalProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InviteRole>("org:member");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await inviteWorkspaceMemberAction({ email, role });

      setEmail("");
      setRole("org:member");
      onClose();
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to send invite");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ModalBackdrop onClose={onClose}>
      <CenteredModalSurface className="max-w-[30rem]">
        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          <ModalHeader
            title="Invite workspace member"
            description="Send a Clerk organization invitation from your own modal styling."
            eyebrow={
              <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                <UserPlus size={12} />
                Team access
              </span>
            }
            onClose={onClose}
          />

          <div className="space-y-4">
            <ModalField label="Email address">
              <ModalInputShell icon={<Mail size={16} />}>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="teammate@example.com"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
                  required
                />
              </ModalInputShell>
            </ModalField>

            <ModalField label="Workspace role">
              <ModalInputShell icon={<Shield size={16} />}>
                <select
                  value={role}
                  onChange={(event) => setRole(event.target.value as InviteRole)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
                >
                  <option value="org:member">Member</option>
                  <option value="org:admin">Admin</option>
                </select>
              </ModalInputShell>
            </ModalField>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <ModalFooter
            hint="This adds them to the workspace. Project access still stays custom per project."
            submitLabel={isSubmitting ? "Sending..." : "Send invite"}
            isSubmitting={isSubmitting}
            onClose={onClose}
          />
        </form>
      </CenteredModalSurface>
    </ModalBackdrop>
  );
}
