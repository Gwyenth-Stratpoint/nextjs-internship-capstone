"use client"

import { Filter, Plus, Search } from "lucide-react"
import { useMemo, useState } from "react"

import { CreateProjectModal } from "@/components/modals/create-project-modal"
import { ProjectCard } from "@/components/project-card"
import { useProjects } from "@/hooks/use-projects"

export default function ProjectsPage() {
  const { projects, isLoading, error, isMutating, createProject, updateProject, deleteProject } = useProjects()
  const [search, setSearch] = useState("")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const filteredProjects = useMemo(() => {
    const value = search.trim().toLowerCase()
    if (!value) return projects

    return projects.filter((project) => {
      return (
        project.name.toLowerCase().includes(value) ||
        (project.description ?? "").toLowerCase().includes(value) ||
        (project.key ?? "").toLowerCase().includes(value)
      )
    })
  }, [projects, search])

  function getCreateProjectErrorMessage(err: unknown) {
    if (!(err instanceof Error)) {
      return "Failed to create project"
    }

    if (err.message.includes('insert into "projects"') || err.message.includes('"slug"')) {
      return "Project creation failed because the database schema is out of sync. Remove the projects.slug column or restore slug support."
    }

    return err.message
  }

  async function handleCreate(input: {
    name: string
    description?: string | null
    dueDate?: string | null
    template?: "simple" | "software"
  }) {
    try {
      await createProject(input)
    } catch (err) {
      throw new Error(getCreateProjectErrorMessage(err))
    }
  }

  async function handleRename(projectId: string, currentName: string) {
    const nextName = window.prompt("Rename project", currentName)
    if (!nextName?.trim() || nextName.trim() === currentName) return

    try {
      await updateProject(projectId, { name: nextName.trim() })
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to update project")
    }
  }

  async function handleArchive(projectId: string, archived: boolean) {
    try {
      await updateProject(projectId, { archived: !archived })
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to update project")
    }
  }

  async function handleDelete(projectId: string, name: string) {
    const ok = window.confirm(`Delete "${name}"? This cannot be undone.`)
    if (!ok) return

    try {
      await deleteProject(projectId)
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to delete project")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Projects</h1>
          <p className="mt-2 text-muted-foreground">Manage and organize your team projects</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          disabled={isMutating}
          className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          <Plus size={20} className="mr-2" />
          New Project
        </button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            type="text"
            placeholder="Search projects..."
            className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-4 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-foreground transition-colors hover:bg-muted">
          <Filter size={16} className="mr-2" />
          Filter
        </button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {isLoading ? <p className="text-sm text-muted-foreground">Loading projects...</p> : null}

      {!isLoading && filteredProjects.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">No projects found.</div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredProjects.map((project) => {
          const canManageProject = project.role === "owner" || project.role === "admin"

          return (
            <ProjectCard
              key={project.id}
              project={{
                id: project.id,
                name: project.name,
                description: project.description,
                dueDate: project.dueDate,
                status: project.archived ? "archived" : "active",
                role: `${project.archived ? "Archived" : "Active"} • ${project.role}`,
              }}
              href={`/projects/${project.id}`}
              actions={
                canManageProject ? (
                  <>
                    <button
                      onClick={() => void handleRename(project.id, project.name)}
                      disabled={isMutating}
                      className="rounded-lg px-3 py-2 text-left text-xs text-foreground transition hover:bg-muted disabled:opacity-60"
                    >
                      Rename
                    </button>
                    <button
                      onClick={() => void handleArchive(project.id, project.archived)}
                      disabled={isMutating}
                      className="rounded-lg px-3 py-2 text-left text-xs text-foreground transition hover:bg-muted disabled:opacity-60"
                    >
                      {project.archived ? "Unarchive" : "Archive"}
                    </button>
                    <button
                      onClick={() => void handleDelete(project.id, project.name)}
                      disabled={isMutating}
                      className="rounded-lg px-3 py-2 text-left text-xs text-red-700 transition hover:bg-red-50 disabled:opacity-60"
                    >
                      Delete
                    </button>
                  </>
                ) : undefined
              }
              footer={!canManageProject ? <p className="text-xs text-muted-foreground">Read-only access</p> : undefined}
            />
          )
        })}
      </div>

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        isSubmitting={isMutating}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  )
}
