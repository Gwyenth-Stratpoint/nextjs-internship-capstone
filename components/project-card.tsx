"use client"

import Link from "next/link"
import { CalendarDays } from "lucide-react"

import { CardBadge, CardHeader, CardMetaRow, CardSurface } from "@/components/cards/card-primitives"

type ProjectStatus = "active" | "completed" | "on-hold" | "archived"

type ProjectCardProps = {
  project: {
    id: string
    name: string
    description?: string | null
    progress?: number
    memberCount?: number
    dueDate?: string | null
    status: ProjectStatus
    role?: string
  }
  href?: string
  actions?: React.ReactNode
  footer?: React.ReactNode
}

function formatProjectDate(value?: string | null) {
  if (!value) return "No due date"

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value))
}

function getProjectStatusTone(status: ProjectStatus) {
  switch (status) {
    case "completed":
      return "bg-emerald-100 text-emerald-700"
    case "on-hold":
      return "bg-amber-100 text-amber-700"
    case "archived":
      return "bg-slate-100 text-slate-600"
    default:
      return "bg-blue-100 text-blue-700"
  }
}

function getProjectStatusLabel(status: ProjectStatus) {
  switch (status) {
    case "on-hold":
      return "On hold"
    default:
      return status.charAt(0).toUpperCase() + status.slice(1)
  }
}

export function ProjectCard({ project, href, actions, footer }: ProjectCardProps) {
  const title = href ? (
    <Link href={href} className="block text-lg font-semibold hover:underline">
      {project.name}
    </Link>
  ) : (
    <span className="text-lg font-semibold">{project.name}</span>
  )

  return (
    <CardSurface className="p-5">
      <CardHeader
        title={title}
        description={project.description ?? "No description"}
        badge={<CardBadge className={getProjectStatusTone(project.status)}>{getProjectStatusLabel(project.status)}</CardBadge>}
      />

      <CardMetaRow
        left={
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarDays size={14} />
            <span>{formatProjectDate(project.dueDate)}</span>
          </div>
        }
        right={
          <div className="text-muted-foreground">
            {project.role ? <span>{project.role}</span> : null}
            {project.memberCount !== undefined ? <span>{project.role ? " • " : ""}{project.memberCount} members</span> : null}
          </div>
        }
      />

      {project.progress !== undefined ? (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium text-foreground">{project.progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-border">
            <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${project.progress}%` }} />
          </div>
        </div>
      ) : null}

      {footer ? <div className="mt-4">{footer}</div> : null}
      {actions ? <div className="mt-4 flex flex-wrap gap-2">{actions}</div> : null}
    </CardSurface>
  )
}
