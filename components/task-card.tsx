"use client";

import Image from "next/image";
import { CalendarDays, MessageSquare, User } from "lucide-react";

import { CardBadge, CardInset as CardSurface } from "@/components/ui/card";

type TaskCardProps = {
  task: {
    id: string;
    title: string;
    description?: string | null;
    priority: "none" | "low" | "medium" | "high" | "urgent";
    status: "open" | "in_progress" | "blocked" | "done";
    dueDate?: string | null;
    position: number;
    reporterName?: string | null;
    reporterAvatarUrl?: string | null;
    commentCount?: number;
  };
  onEdit?: (id: string) => void;
  draggable?: boolean;
  onDragStart?: (id: string) => void;
  onDragEnd?: () => void;
  onDragOver?: () => void;
  onDrop?: () => void;
  isDragging?: boolean;
  isDropTarget?: boolean;
};

function getPriorityTone(priority: TaskCardProps["task"]["priority"]) {
  switch (priority) {
    case "urgent":
    case "high":
      return "border-red-100 bg-red-50 text-red-600 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-300";
    case "medium":
      return "border-amber-100 bg-amber-50 text-amber-600 dark:border-amber-900/30 dark:bg-amber-900/20 dark:text-amber-300";
    case "low":
      return "border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-900/30 dark:bg-emerald-900/20 dark:text-emerald-300";
    default:
      return "border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300";
  }
}

function formatDate(value?: string | null) {
  if (!value) return null;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatPriorityLabel(priority: TaskCardProps["task"]["priority"]) {
  return priority === "none" ? "Backlog" : priority;
}

function getReporterInitial(name?: string | null) {
  if (!name) return null;
  return name.trim().charAt(0).toUpperCase() || null;
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
  const canEdit = typeof onEdit === "function";
  const reporterInitial = getReporterInitial(task.reporterName);

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
              event.preventDefault();
              onDragOver?.();
            }
          : undefined
      }
      onDrop={
        draggable
          ? (event) => {
              event.preventDefault();
              event.stopPropagation();
              onDrop?.();
            }
          : undefined
      }
      onKeyDown={
        canEdit
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onEdit?.(task.id);
              }
            }
          : undefined
      }
      interactive={canEdit}
      className={`rounded-[18px] p-3 ${isDragging ? "opacity-50" : ""} ${isDropTarget ? "ring-2 ring-blue-300" : ""}`}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h4 className="min-w-0 break-words text-[13px] font-semibold leading-5 text-foreground">
            {task.title}
          </h4>
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200/80 bg-[linear-gradient(135deg,#7C6EE6_0%,#4F8DF6_100%)] text-[11px] font-semibold text-white"
            title={task.reporterName ?? "Task creator"}
          >
            {task.reporterAvatarUrl ? (
              <Image
                src={task.reporterAvatarUrl}
                alt={task.reporterName ?? "Task creator"}
                width={28}
                height={28}
                className="h-full w-full object-cover"
              />
            ) : reporterInitial ? (
              <span>{reporterInitial}</span>
            ) : (
              <User size={14} />
            )}
          </div>
        </div>

        <div className="flex items-center">
          <CardBadge
            className={`border px-2 py-0.5 text-[10px] font-semibold capitalize ${getPriorityTone(task.priority)}`}
          >
            {formatPriorityLabel(task.priority)}
          </CardBadge>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <CalendarDays size={12} className="shrink-0 text-slate-400" />
            <span>{task.dueDate ? formatDate(task.dueDate) : "No deadline"}</span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <MessageSquare size={13} className="shrink-0 text-slate-400" />
            <span>{task.commentCount ?? 0}</span>
          </div>
        </div>
      </div>
    </CardSurface>
  );
}
