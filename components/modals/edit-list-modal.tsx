"use client";

import { Columns3, GitBranch } from "lucide-react";
import { useState } from "react";

import {
  CenteredModalSurface,
  ModalBackdrop,
  ModalField,
  ModalFooter,
  ModalHeader,
  ModalInputShell,
} from "@/components/modals/modal-primitives";

type ListCategory = "todo" | "in_progress" | "done";

type EditListModalProps = {
  isOpen: boolean;
  listName: string;
  category: ListCategory;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (input: { name: string; category: ListCategory }) => Promise<void>;
};

const categoryOptions: Array<{ value: ListCategory; label: string }> = [
  { value: "todo", label: "Start" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];

export function EditListModal({
  isOpen,
  listName,
  category,
  isSubmitting = false,
  onClose,
  onSubmit,
}: EditListModalProps) {
  const [name, setName] = useState(listName);
  const [nextCategory, setNextCategory] = useState<ListCategory>(category);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      setError("Column name is required");
      return;
    }

    try {
      setError(null);
      await onSubmit({
        name: name.trim(),
        category: nextCategory,
      });
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to update column");
    }
  }

  return (
    <ModalBackdrop onClose={onClose}>
      <CenteredModalSurface className="max-w-[30rem]">
        <form onSubmit={handleSubmit} className="space-y-4 px-4 py-3.5">
          <ModalHeader
            title="Edit column"
            description="Update the column name or workflow category."
            eyebrow={
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                <Columns3 size={14} />
                Board settings
              </div>
            }
            onClose={onClose}
          />

          <ModalField label="Column name">
            <ModalInputShell icon={<Columns3 size={16} />}>
              <input
                autoFocus
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Review"
              />
            </ModalInputShell>
          </ModalField>

          <ModalField label="Workflow category">
            <ModalInputShell icon={<GitBranch size={16} />}>
              <select
                value={nextCategory}
                onChange={(event) => setNextCategory(event.target.value as ListCategory)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </ModalInputShell>
          </ModalField>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-500">
            The board keeps one start column and one done column. Intermediate columns stay in the
            in-progress category.
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <ModalFooter
            hint="Rename the column, change its workflow role, or both."
            submitLabel={isSubmitting ? "Saving..." : "Save changes"}
            isSubmitting={isSubmitting}
            onClose={onClose}
          />
        </form>
      </CenteredModalSurface>
    </ModalBackdrop>
  );
}
