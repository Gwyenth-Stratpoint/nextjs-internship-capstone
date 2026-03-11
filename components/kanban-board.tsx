"use client"

import { MoreHorizontal, Plus } from "lucide-react"
import { useMemo } from "react"

import { useLists } from "@/hooks/use-lists"
import { useTasks } from "@/hooks/use-tasks"

type TaskStatus = "open" | "in_progress" | "blocked" | "done"

function getTaskStatusTone(status: TaskStatus) {
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

function getPriorityTone(priority: "none" | "low" | "medium" | "high" | "urgent") {
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

export function KanbanBoard({ projectId }: { projectId: string }) {
  // Column data for the current project board.
  const { lists, isLoading: isListsLoading, error: listsError, createList, updateList, archiveList, isMutating: isListsMutating } =
    useLists(projectId)

  // Task data grouped underneath each list.
  const { tasks, isLoading: isTasksLoading, error: tasksError } = useTasks(projectId)

  const activeLists = useMemo(
    () => lists.filter((list) => !list.archived).sort((a, b) => a.position - b.position),
    [lists],
  )

  const tasksByList = useMemo(() => {
    const grouped = new Map<string, typeof tasks>()

    for (const list of activeLists) {
      grouped.set(list.id, [])
    }

    for (const task of tasks) {
      if (task.archived || !task.listId) continue
      const current = grouped.get(task.listId)
      if (current) {
        current.push(task)
      }
    }

    for (const listTasks of grouped.values()) {
      listTasks.sort((a, b) => a.position - b.position)
    }

    return grouped
  }, [activeLists, tasks])

  async function handleCreateList() {
    const name = window.prompt("List name")
    if (!name?.trim()) return

    try {
      await createList({
        name: name.trim(),
        position: activeLists.length,
      })
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to create list")
    }
  }

  async function handleRenameList(listId: string, currentName: string) {
    const nextName = window.prompt("Rename list", currentName)
    if (!nextName?.trim() || nextName.trim() === currentName) return

    try {
      await updateList(listId, { name: nextName.trim() })
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to rename list")
    }
  }

  async function handleArchiveList(listId: string, name: string) {
    const confirmed = window.confirm(`Archive "${name}"? Tasks will remain in the project.`)
    if (!confirmed) return

    try {
      await archiveList(listId)
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to archive list")
    }
  }

  const boardError = listsError ?? tasksError
  const isLoading = isListsLoading || isTasksLoading

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Project board</h2>
          <p className="text-sm text-muted-foreground">
            Manage columns inside this project. Drag and drop can be added in Task 5.2.
          </p>
        </div>
        <button
          onClick={() => void handleCreateList()}
          disabled={isListsMutating}
          className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          <Plus size={16} className="mr-2" />
          Add List
        </button>
      </div>

      {boardError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load board: {boardError}
        </div>
      ) : null}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-xl border border-border bg-card p-5">
              <div className="mb-4 h-6 w-1/2 animate-pulse rounded bg-muted" />
              <div className="space-y-3">
                <div className="h-24 animate-pulse rounded-lg bg-muted" />
                <div className="h-24 animate-pulse rounded-lg bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {!isLoading && activeLists.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
          <h3 className="text-lg font-semibold text-foreground">No lists yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Start your project board by creating the first column.
          </p>
          <button
            onClick={() => void handleCreateList()}
            disabled={isListsMutating}
            className="mt-6 inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            <Plus size={16} className="mr-2" />
            Create first list
          </button>
        </div>
      ) : null}

      {!isLoading ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          {activeLists.map((list) => {
            const listTasks = tasksByList.get(list.id) ?? []

            return (
              <section key={list.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{list.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {listTasks.length} {listTasks.length === 1 ? "task" : "tasks"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => void handleRenameList(list.id, list.name)}
                      disabled={isListsMutating}
                      className="rounded-md border border-border px-2 py-1 text-xs text-foreground transition-colors hover:bg-muted disabled:opacity-60"
                    >
                      Rename
                    </button>
                    <button
                      onClick={() => void handleArchiveList(list.id, list.name)}
                      disabled={isListsMutating}
                      className="rounded-md border border-border px-2 py-1 text-xs text-foreground transition-colors hover:bg-muted disabled:opacity-60"
                    >
                      <MoreHorizontal size={14} />
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {listTasks.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                      No tasks in this list yet.
                    </div>
                  ) : null}

                  {listTasks.map((task) => (
                    <article key={task.id} className="rounded-lg border border-border bg-background p-4 shadow-sm">
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
                        <span className={getPriorityTone(task.priority)}>
                          Priority: {task.priority}
                        </span>
                        <span className="text-muted-foreground">
                          Position {task.position}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
