"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CalendarDays, MoreVertical } from "lucide-react";

import {
  CardInset as CardSurface,
  CardInsetHeader as CardHeader,
  CardMetaRow,
} from "@/components/ui/card";

type ProjectCardProps = {
  project: {
    id: string;
    name: string;
    description?: string | null;
    progress?: number;
    memberCount?: number;
    dueDate?: string | null;
    status?: "active" | "completed" | "on-hold" | "archived";
    role?: string;
  };
  href?: string;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
};

function formatProjectDate(value?: string | null) {
  if (!value) return "No due date";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatProjectRole(value?: string) {
  if (!value) return null;

  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function ProjectCard({ project, href, actions, footer }: ProjectCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isMenuOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMenuOpen]);

  const title = href ? (
    <Link href={href} className="block text-lg font-semibold hover:underline">
      {project.name}
    </Link>
  ) : (
    <span className="text-lg font-semibold">{project.name}</span>
  );

  return (
    <CardSurface className="flex h-full flex-col p-5">
      <div className="flex flex-1 flex-col">
        <CardHeader
          title={title}
          description={project.description ?? "No description"}
          badge={
            actions ? (
              <div ref={menuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsMenuOpen((current) => !current)}
                  className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  aria-label={`Open actions for ${project.name}`}
                  aria-expanded={isMenuOpen}
                >
                  <MoreVertical size={16} />
                </button>
                {isMenuOpen ? (
                  <div className="absolute right-0 top-9 z-20 min-w-[9rem] rounded-xl border border-border bg-background p-1.5 shadow-lg">
                    <div className="flex flex-col gap-1" onClick={() => setIsMenuOpen(false)}>
                      {actions}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null
          }
        />

        <CardMetaRow
          className="mt-auto pt-6"
          left={
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarDays size={14} />
              <span>{formatProjectDate(project.dueDate)}</span>
            </div>
          }
          right={
            <div className="text-muted-foreground">
              {project.role ? <span>{formatProjectRole(project.role)}</span> : null}
              {project.memberCount !== undefined ? (
                <span>
                  {project.role ? " \u2022 " : ""}
                  {project.memberCount} members
                </span>
              ) : null}
            </div>
          }
        />
      </div>

      {project.progress !== undefined ? (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium text-foreground">{project.progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-border">
            <div
              className="h-2 rounded-full bg-primary transition-all"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>
      ) : null}

      {footer ? <div className="mt-4">{footer}</div> : null}
    </CardSurface>
  );
}
