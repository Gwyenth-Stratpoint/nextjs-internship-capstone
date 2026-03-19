"use client";

import { useState } from "react";
import { Columns3, Sparkles } from "lucide-react";

import {
  CenteredModalSurface,
  ModalBackdrop,
  ModalField,
  ModalFooter,
  ModalHeader,
  ModalInputShell,
} from "@/components/modals/modal-primitives";

type ListDraft = {
  name: string;
};

type CreateListModalProps = {
  isOpen: boolean;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (input: ListDraft) => Promise<void>;
};

const emptyList: ListDraft = {
  name: "",
};

export function CreateListModal({
  isOpen,
  isSubmitting = false,
  onClose,
  onSubmit,
}: CreateListModalProps) {
  const [form, setForm] = useState<ListDraft>(emptyList);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (!form.name.trim()) {
      setError("List name is required");
      return;
    }

    try {
      setError(null);
      await onSubmit({
        name: form.name.trim(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create list");
    }
  }

  return (
    <ModalBackdrop onClose={onClose}>
      <CenteredModalSurface>
        <ModalHeader
          title="Create a new list"
          description="Add a middle-stage column to keep the board organized."
          eyebrow={
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              <Sparkles size={14} />
              Board workflow
            </div>
          }
          onClose={onClose}
        />

        <form onSubmit={handleSubmit} className="space-y-3.5 px-4 py-3.5">
          <ModalField label="List name*">
            <ModalInputShell icon={<Columns3 size={18} />}>
              <input
                autoFocus
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Review"
              />
            </ModalInputShell>
          </ModalField>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-500">
            New lists are inserted as workflow stages between your starting and finishing columns.
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <ModalFooter
            hint="You can rename or recategorize the list later."
            submitLabel={isSubmitting ? "Creating..." : "Create list"}
            isSubmitting={isSubmitting}
            onClose={onClose}
          />
        </form>
      </CenteredModalSurface>
    </ModalBackdrop>
  );
}
