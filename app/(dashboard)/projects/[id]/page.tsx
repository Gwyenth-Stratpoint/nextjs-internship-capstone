"use client";

import { Calendar, MoreHorizontal, Plus, Settings, Users } from "lucide-react";
import { use, useCallback, useEffect, useState } from "react";

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

type CreateListAction = {
  open: () => void;
  disabled: boolean;
  visible: boolean;
};

type BoardProgressSummary = {
  completionRate: number;
  isLoading: boolean;
};

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createListAction, setCreateListAction] = useState<CreateListAction | null>(null);
  const [boardProgress, setBoardProgress] = useState<BoardProgressSummary>({
    completionRate: 0,
    isLoading: true,
  });

  const handleCreateListActionChange = useCallback((action: CreateListAction) => {
    setCreateListAction(action);
  }, []);

  const handleBoardProgressChange = useCallback((summary: BoardProgressSummary) => {
    setBoardProgress(summary);
  }, []);

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
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-bold text-foreground">{project.name}</h1>
            <p className="mt-1 text-muted-foreground">
              {project.description ?? "No description added yet."}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {createListAction?.visible ? (
              <button
                type="button"
                onClick={createListAction.open}
                disabled={createListAction.disabled}
                className="inline-flex items-center rounded-xl bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                <Plus size={16} className="mr-2" />
                Create List
              </button>
            ) : null}
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

        <div className="flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200/80">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#4f8df6_0%,#06b6d4_100%)] transition-all"
              style={{ width: `${boardProgress.isLoading ? 0 : boardProgress.completionRate}%` }}
            />
          </div>
          <span className="shrink-0 text-sm font-medium text-muted-foreground">
            {boardProgress.isLoading ? "--" : `${boardProgress.completionRate}%`}
          </span>
        </div>
      </div>

      <KanbanBoard
        projectId={id}
        role={project.role}
        onCreateListActionChange={handleCreateListActionChange}
        onProgressChange={handleBoardProgressChange}
      />
    </div>
  );
}
