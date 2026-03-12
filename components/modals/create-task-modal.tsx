"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"

type TaskStatus = "open" | "in_progress" | "blocked" | "done"
type TaskPriority = "none" | "low" | "medium" | "high" | "urgent"

type TaskDraft = {
  id?: string
  title: string
  description?: string | null
  status: TaskStatus
  priority: TaskPriority
  dueDate?: string | null
}

type CreateTaskModalProps = {
  isOpen: boolean
  mode: "create" | "edit"
  listName: string
  initialTask?: TaskDraft | null
  isSubmitting?: boolean
  onClose: () => void
  onSubmit: (input: TaskDraft) => Promise<void>
}

const emptyTask: TaskDraft = {
  title: "",
  description: "",
  status: "open",
  priority: "none",
  dueDate: "",
}

export function CreateTaskModal({
  isOpen,
  mode,
  listName,
  initialTask,
  isSubmitting = false,
  onClose,
  onSubmit,
}: CreateTaskModalProps) {
  // Form state for creating or editing a task.
  const [form, setForm] = useState<TaskDraft>(emptyTask)
  const [error, setError] = useState<string | null>(null)

  // Reset modal form whenever the target task or open state changes.
  useEffect(() => {
    if (!isOpen) return

    setForm(
      initialTask
        ? {
            ...initialTask,
            description: initialTask.description ?? "",
            dueDate: initialTask.dueDate ? initialTask.dueDate.slice(0, 10) : "",
          }
        : emptyTask,
    )
    setError(null)
  }, [initialTask, isOpen])

  if (!isOpen) {
    return null
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!form.title.trim()) {
      setError("Task title is required")
      return
    }

    try {
      setError(null)
      await onSubmit({
        ...form,
        title: form.title.trim(),
        description: form.description?.trim() || null,
        dueDate: form.dueDate || null,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save task")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {mode === "create" ? "Create task" : "Edit task"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "create" ? `Add a task to ${listName}.` : `Update task details in ${listName}.`}
            </p>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-muted">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Title</label>
            <input
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-ring"
              placeholder="Task title"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Description</label>
            <textarea
              value={form.description ?? ""}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              rows={4}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-ring"
              placeholder="Task description"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Status</label>
              <select
                value={form.status}
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as TaskStatus }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="blocked">Blocked</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Priority</label>
              <select
                value={form.priority}
                onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value as TaskPriority }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="none">None</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Due date</label>
              <input
                type="date"
                value={form.dueDate ?? ""}
                onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : mode === "create" ? "Create task" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
