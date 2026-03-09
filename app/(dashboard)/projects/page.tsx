"use client";

import Link from "next/link";
import { Filter, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { useProjects } from "@/hooks/use-projects";

export default function ProjectsPage() {
  const { projects, isLoading, error, isMutating, createProject, updateProject, deleteProject } = useProjects();
  const [search, setSearch] = useState("");

  const filteredProjects = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return projects;

    return projects.filter((project) => {
      return (
        project.name.toLowerCase().includes(value) ||
        (project.description ?? "").toLowerCase().includes(value) ||
        (project.key ?? "").toLowerCase().includes(value)
      );
    });
  }, [projects, search]);

  async function handleCreate() {
    const name = window.prompt("Project name");
    if (!name?.trim()) return;

    try {
      await createProject({ name: name.trim() });
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to create project");
    }
  }

  async function handleRename(projectId: string, currentName: string) {
    const nextName = window.prompt("Rename project", currentName);
    if (!nextName?.trim() || nextName.trim() === currentName) return;

    try {
      await updateProject(projectId, { name: nextName.trim() });
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to update project");
    }
  }

  async function handleArchive(projectId: string, archived: boolean) {
    try {
      await updateProject(projectId, { archived: !archived });
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to update project");
    }
  }

  async function handleDelete(projectId: string, name: string) {
    const ok = window.confirm(`Delete \"${name}\"? This cannot be undone.`);
    if (!ok) return;

    try {
      await deleteProject(projectId);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to delete project");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Projects</h1>
          <p className="text-muted-foreground mt-2">Manage and organize your team projects</p>
        </div>
        <button
          onClick={() => void handleCreate()}
          disabled={isMutating}
          className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          <Plus size={20} className="mr-2" />
          New Project
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            type="text"
            placeholder="Search projects..."
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button className="inline-flex items-center px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition-colors">
          <Filter size={16} className="mr-2" />
          Filter
        </button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {isLoading ? <p className="text-sm text-muted-foreground">Loading projects...</p> : null}

      {!isLoading && filteredProjects.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">No projects found.</div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <div
            key={project.id}
            className="bg-card rounded-lg border border-border p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-3 h-3 rounded-full ${project.archived ? "bg-gray-400" : "bg-primary"}`}></div>
              <span className="text-xs text-muted-foreground">{project.archived ? "Archived" : "Active"}</span>
            </div>

            <Link href={`/projects/${project.id}`} className="text-lg font-semibold text-foreground mb-2 block hover:underline">
              {project.name}
            </Link>

            <p className="text-sm text-muted-foreground mb-4">{project.description ?? "No description"}</p>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => void handleRename(project.id, project.name)}
                disabled={isMutating}
                className="px-3 py-1.5 text-xs border border-border rounded hover:bg-muted disabled:opacity-60"
              >
                Rename
              </button>
              <button
                onClick={() => void handleArchive(project.id, project.archived)}
                disabled={isMutating}
                className="px-3 py-1.5 text-xs border border-border rounded hover:bg-muted disabled:opacity-60"
              >
                {project.archived ? "Unarchive" : "Archive"}
              </button>
              <button
                onClick={() => void handleDelete(project.id, project.name)}
                disabled={isMutating}
                className="px-3 py-1.5 text-xs border border-red-300 text-red-700 rounded hover:bg-red-50 disabled:opacity-60"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
