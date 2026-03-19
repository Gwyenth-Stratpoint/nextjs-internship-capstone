"use client";

import { ArrowRightLeft, Trash2 } from "lucide-react";

import {
  CenteredModalSurface,
  ModalBackdrop,
  ModalField,
  ModalFooter,
  ModalHeader,
  ModalInputShell,
} from "@/components/modals/modal-primitives";

type DeleteListModalProps = {
  isOpen: boolean;
  listName: string;
  taskCount: number;
  destinationListId: string;
  destinationOptions: Array<{ id: string; name: string }>;
  isSubmitting: boolean;
  error?: string | null;
  onDestinationChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export function DeleteListModal({
  isOpen,
  listName,
  taskCount,
  destinationListId,
  destinationOptions,
  isSubmitting,
  error,
  onDestinationChange,
  onClose,
  onSubmit,
}: DeleteListModalProps) {
  if (!isOpen) {
    return null;
  }

  const requiresMove = taskCount > 0;

  return (
    <ModalBackdrop onClose={onClose}>
      <CenteredModalSurface className="max-w-[32rem]">
        <form
          className="space-y-5 p-5"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <ModalHeader
            title="Delete column"
            description={
              requiresMove
                ? `Move ${taskCount} task${taskCount === 1 ? "" : "s"} before deleting "${listName}".`
                : `Delete "${listName}" from this board.`
            }
            eyebrow={
              <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                <Trash2 size={12} />
                Destructive action
              </span>
            }
            onClose={onClose}
          />

          {requiresMove ? (
            <ModalField label="Move tasks to">
              <ModalInputShell icon={<ArrowRightLeft size={16} />}>
                <select
                  value={destinationListId}
                  onChange={(event) => onDestinationChange(event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
                >
                  <option value="">Select a destination column</option>
                  {destinationOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </ModalInputShell>
            </ModalField>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              This column has no tasks, so it can be deleted immediately.
            </div>
          )}

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <ModalFooter
            hint={
              requiresMove
                ? "A destination is required so tasks stay on the board, and the deletion is logged in the audit trail."
                : "This deletion is logged in the audit trail."
            }
            submitLabel={isSubmitting ? "Deleting..." : "Delete column"}
            isSubmitting={isSubmitting || (requiresMove && !destinationListId)}
            onClose={onClose}
            className="pt-0"
          />
        </form>
      </CenteredModalSurface>
    </ModalBackdrop>
  );
}
