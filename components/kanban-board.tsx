"use client"

import { MoreHorizontal, Plus } from "lucide-react"
import { useMemo, useState } from "react"

import { CreateTaskModal } from "@/components/modals/create-task-modal"
import { TaskCard } from "@/components/task-card"
import { useLists } from "@/hooks/use-lists"
import { useTasks } from "@/hooks/use-tasks"

type TaskStatus = "open" | "in_progress" | "blocked" | "done"
type TaskPriority = "none" | "low" | "medium" | "high" | "urgent"
type ProjectRole = "owner" | "admin" | "member" | "viewer"

type ModalState =
  | { mode: "create"; listId: string; listName: string }
  | {
      mode: "edit"
      listId: string
      listName: string
      task: {
        id: string
        title: string
        description?: string | null
        status: TaskStatus
        priority: TaskPriority
        dueDate?: string | null
      }
    }
  | null

export function KanbanBoard({ projectId, role }: { projectId: string; role: ProjectRole }) {
  // Column data for the current project board.
  const {
    lists,
    isLoading: isListsLoading,
    error: listsError,
    createList,
    updateList,
    deleteList,
    isMutating: isListsMutating,
  } = useLists(projectId)

  // Task data and mutations for board CRUD interactions.
  const {
    tasks,
    isLoading: isTasksLoading,
    error: tasksError,
    createTask,
    updateTask,
    deleteTask,
    isMutating: isTasksMutating,
  } = useTasks(projectId)

  // Modal state for creating or editing a task.
  const [modalState, setModalState] = useState<ModalState>(null)

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

  async function handleDeleteList(listId: string, name: string) {
    const confirmed = window.confirm(`Delete "${name}"? Tasks in this list will be detached from the column.`)
    if (!confirmed) return

    try {
      await deleteList(listId)
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to delete list")
    }
  }

  async function handleDeleteTask(taskId: string, title: string) {
    const confirmed = window.confirm(`Delete "${title}"? This cannot be undone.`)
    if (!confirmed) return

    try {
      await deleteTask(taskId)
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to delete task")
    }
  }

  async function handleTaskSubmit(input: {
    id?: string
    title: string
    description?: string | null
    status: TaskStatus
    priority: TaskPriority
    dueDate?: string | null
  }) {
    if (!modalState) return

    if (modalState.mode === "create") {
      const listTaskCount = tasksByList.get(modalState.listId)?.length ?? 0
      await createTask({
        title: input.title,
        description: input.description ?? null,
        status: input.status,
        priority: input.priority,
        dueDate: input.dueDate ?? null,
        listId: modalState.listId,
        position: listTaskCount,
      })
      return
    }

    await updateTask(modalState.task.id, {
      title: input.title,
      description: input.description ?? null,
      status: input.status,
      priority: input.priority,
      dueDate: input.dueDate ?? null,
    })
  }

  const boardError = listsError ?? tasksError
  const isLoading = isListsLoading || isTasksLoading
  const isMutating = isListsMutating || isTasksMutating
  const canManageLists = role === "owner" || role === "admin"
  const canManageTasks = canManageLists || role === "member"

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Project board</h2>
          <p className="text-sm text-muted-foreground">
            Manage columns and task cards inside this project. Drag and drop can be added in Task 5.2.
          </p>
        </div>
        {canManageLists ? (
          <button
            onClick={() => void handleCreateList()}
            disabled={isListsMutating}
            className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            <Plus size={16} className="mr-2" />
            Add List
          </button>
        ) : null}
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
          {canManageLists ? (
            <button
              onClick={() => void handleCreateList()}
              disabled={isListsMutating}
              className="mt-6 inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              <Plus size={16} className="mr-2" />
              Create first list
            </button>
          ) : null}
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
                  {canManageLists ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => void handleRenameList(list.id, list.name)}
                        disabled={isListsMutating}
                        className="rounded-md border border-border px-2 py-1 text-xs text-foreground transition-colors hover:bg-muted disabled:opacity-60"
                      >
                        Rename
                      </button>
                      <button
                        onClick={() => void handleDeleteList(list.id, list.name)}
                        disabled={isListsMutating}
                        className="rounded-md border border-border px-2 py-1 text-xs text-foreground transition-colors hover:bg-muted disabled:opacity-60"
                      >
                        <MoreHorizontal size={14} />
                      </button>
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 space-y-3">
                  {listTasks.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                      No tasks in this list yet.
                    </div>
                  ) : null}

                  {listTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={
                        canManageTasks
                          ? () =>
                              setModalState({
                                mode: "edit",
                                listId: list.id,
                                listName: list.name,
                                task: {
                                  id: task.id,
                                  title: task.title,
                                  description: task.description,
                                  status: task.status,
                                  priority: task.priority,
                                  dueDate: task.dueDate,
                                },
                              })
                          : undefined
                      }
                      onDelete={canManageTasks ? () => void handleDeleteTask(task.id, task.title) : undefined}
                    />
                  ))}

                  {canManageTasks ? (
                    <button
                      onClick={() =>
                        setModalState({
                          mode: "create",
                          listId: list.id,
                          listName: list.name,
                        })
                      }
                      disabled={isMutating}
                      className="w-full rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-muted disabled:opacity-60"
                    >
                      <span className="inline-flex items-center">
                        <Plus size={14} className="mr-2" />
                        Add task
                      </span>
                    </button>
                  ) : null}
                </div>
              </section>
            )
          })}
        </div>
      ) : null}

      <CreateTaskModal
        isOpen={modalState !== null}
        mode={modalState?.mode ?? "create"}
        listName={modalState?.listName ?? ""}
        initialTask={
          modalState?.mode === "edit"
            ? {
                id: modalState.task.id,
                title: modalState.task.title,
                description: modalState.task.description,
                status: modalState.task.status,
                priority: modalState.task.priority,
                dueDate: modalState.task.dueDate,
              }
            : null
        }
        isSubmitting={isTasksMutating}
        onClose={() => setModalState(null)}
        onSubmit={handleTaskSubmit}
      />
    </div>
  )
}
