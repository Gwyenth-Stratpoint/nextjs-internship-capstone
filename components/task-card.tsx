"use client"

import { Pencil, Trash2 } from "lucide-react"

type TaskCardProps = {
  task: {
    id: string
    title: string
    description?: string | null
    priority: "none" | "low" | "medium" | "high" | "urgent"
    status: "open" | "in_progress" | "blocked" | "done"
    dueDate?: string | null
    position: number
  }
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

function getTaskStatusTone(status: TaskCardProps["task"]["status"]) {
  switch (status) {
    case "done":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
    case "in_progress":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
    case "blocked":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
  }
}

function getPriorityTone(priority: TaskCardProps["task"]["priority"]) {
  switch (priority) {
    case "urgent":
    case "high":
      return "text-red-600 dark:text-red-400"
    case "medium":
      return "text-yellow-600 dark:text-yellow-400"
    case "low":
      return "text-green-600 dark:text-green-400"
    default:
      return "text-muted-foreground"
  }
}

function formatDate(value?: string | null) {
  if (!value) return null

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value))
}

export function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const canEdit = typeof onEdit === "function"
  const canDelete = typeof onDelete === "function"

  return (
    <article className="rounded-lg border border-border bg-background p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-medium text-foreground">{task.title}</h4>
          <p className="mt-1 text-sm text-muted-foreground">
            {task.description ?? "No description"}
          </p>
        </div>
        <span className={`rounded-full px-2 py-1 text-xs font-medium ${getTaskStatusTone(task.status)}`}>
          {task.status.replace("_", " ")}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        <span className={getPriorityTone(task.priority)}>Priority: {task.priority}</span>
        <span className="text-muted-foreground">Position {task.position}</span>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {task.dueDate ? `Due ${formatDate(task.dueDate)}` : "No due date"}
        </span>
        {canEdit || canDelete ? (
          <div className="flex items-center gap-2">
            {canEdit ? (
              <button
                onClick={() => onEdit?.(task.id)}
                className="inline-flex items-center rounded-md border border-border px-2 py-1 text-foreground transition-colors hover:bg-muted"
              >
                <Pencil size={12} className="mr-1" />
                Edit
              </button>
            ) : null}
            {canDelete ? (
              <button
                onClick={() => onDelete?.(task.id)}
                className="inline-flex items-center rounded-md border border-red-200 px-2 py-1 text-red-700 transition-colors hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/20"
              >
                <Trash2 size={12} className="mr-1" />
                Delete
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  )
}
