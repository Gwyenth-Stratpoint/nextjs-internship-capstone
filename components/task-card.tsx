"use client"

import { CardBadge, CardHeader, CardMetaRow, CardSurface } from "@/components/cards/card-primitives"

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
  draggable?: boolean
  onDragStart?: (id: string) => void
  onDragEnd?: () => void
  onDragOver?: () => void
  onDrop?: () => void
  isDragging?: boolean
  isDropTarget?: boolean
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

export function TaskCard({
  task,
  onEdit,
  draggable = false,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  isDragging = false,
  isDropTarget = false,
}: TaskCardProps) {
  const canEdit = typeof onEdit === "function"

  return (
    <CardSurface
      role={canEdit ? "button" : undefined}
      tabIndex={canEdit ? 0 : undefined}
      onClick={canEdit ? () => onEdit?.(task.id) : undefined}
      draggable={draggable}
      onDragStart={draggable ? () => onDragStart?.(task.id) : undefined}
      onDragEnd={draggable ? onDragEnd : undefined}
      onDragOver={
        draggable
          ? (event) => {
              event.preventDefault()
              onDragOver?.()
            }
          : undefined
      }
      onDrop={
        draggable
          ? (event) => {
              event.preventDefault()
              event.stopPropagation()
              onDrop?.()
            }
          : undefined
      }
      onKeyDown={
        canEdit
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault()
                onEdit?.(task.id)
              }
            }
          : undefined
      }
      isInteractive={canEdit}
      className={`${isDragging ? "opacity-50" : ""} ${isDropTarget ? "ring-2 ring-blue-300" : ""}`}
    >
      <CardHeader
        title={task.title}
        description={task.description ?? "No description"}
        badge={
          <CardBadge className={getTaskStatusTone(task.status)}>
            {task.status.replace("_", " ")}
          </CardBadge>
        }
      />

      <CardMetaRow
        left={<span className={getPriorityTone(task.priority)}>Priority: {task.priority}</span>}
        right={<span className="text-muted-foreground">Position {task.position}</span>}
      />

      <CardMetaRow
        left={
          <span className="text-muted-foreground">
            {task.dueDate ? `Due ${formatDate(task.dueDate)}` : "No due date"}
          </span>
        }
        right={canEdit ? <span className="text-muted-foreground">Open task</span> : null}
      />
    </CardSurface>
  )
}
