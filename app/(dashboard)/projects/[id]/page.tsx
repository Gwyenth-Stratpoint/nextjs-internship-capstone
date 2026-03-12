"use client";

import Link from "next/link";
import { ArrowLeft, Calendar, MoreHorizontal, Settings, Users } from "lucide-react";
import { use, useEffect, useState } from "react";

import { KanbanBoard } from "@/components/kanban-board";

type Project = {
  id: string;
  name: string;
  description: string | null;
  role: "owner" | "admin" | "member" | "viewer";
};

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  // Next.js 16 passes dynamic params as a Promise in client components.
  const { id } = use(params);
  // Project metadata for the board header and page state.
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load the current project before rendering its board content.
  useEffect(() => {
    let active = true;

    async function loadProject() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/projects/${id}`, { cache: "no-store" });
        const payload = (await response.json()) as ApiResponse<Project>;

        if (!response.ok || !payload.success) {
          const message = payload.success ? "Failed to fetch project" : payload.error.message;
          throw new Error(message);
        }

        if (active) {
          setProject(payload.data);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to fetch project");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadProject();

    return () => {
      active = false;
    };
  }, [id]);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading project...</div>;
  }

  if (error) {
    return <div className="text-sm text-red-600">{error}</div>;
  }

  if (!project) {
    return <div className="text-sm text-muted-foreground">Project not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/projects" className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{project.name}</h1>
            <p className="text-muted-foreground mt-1">{project.description ?? "No description"}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button className="p-2 hover:bg-muted rounded-lg transition-colors">
            <Users size={20} />
          </button>
          <button className="p-2 hover:bg-muted rounded-lg transition-colors">
            <Calendar size={20} />
          </button>
          <button className="p-2 hover:bg-muted rounded-lg transition-colors">
            <Settings size={20} />
          </button>
          <button className="p-2 hover:bg-muted rounded-lg transition-colors">
            <MoreHorizontal size={20} />
          </button>
        </div>
      </div>

      <KanbanBoard projectId={id} role={project.role} />
    </div>
  );
}
