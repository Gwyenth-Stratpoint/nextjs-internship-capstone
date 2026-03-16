"use client"

import { MoreHorizontal, Plus } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"

import { CreateListModal } from "@/components/modals/create-list-modal"
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
        assigneeId?: string | null
        dueDate?: string | null
        labels?: string[]
      }
    }
  | null

type ListActionsProps = {
  onRename?: () => void
  onEditCategory?: () => void
  onDelete?: () => void
  isDisabled?: boolean
}

function ListActions({
  onRename,
  onEditCategory,
  onDelete,
  isDisabled = false,
}: ListActionsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const canRename = typeof onRename === "function"
  const canEditCategory = typeof onEditCategory === "function"
  const canDelete = typeof onDelete === "function"

  useEffect(() => {
    if (!isOpen) return

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("keydown", handleEscape)

    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen])

  if (!canRename && !canEditCategory && !canDelete) {
    return null
  }

  function handleAction(action?: () => void) {
    if (!action || isDisabled) return
    setIsOpen(false)
    action()
  }

  return (
    <div ref={menuRef} className="relative flex items-center">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        disabled={isDisabled}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="List actions"
        className="rounded-md border border-border px-2 py-1 text-xs text-foreground transition-colors hover:bg-muted disabled:opacity-60"
      >
        <MoreHorizontal size={14} />
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-full z-10 mt-2 min-w-36 rounded-lg border border-border bg-background p-1 shadow-lg">
          {canRename ? (
            <button
              type="button"
              onClick={() => handleAction(onRename)}
              disabled={isDisabled}
              className="block w-full rounded-md px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted disabled:opacity-60"
            >
              Rename
            </button>
          ) : null}
          {canEditCategory ? (
            <button
              type="button"
              onClick={() => handleAction(onEditCategory)}
              disabled={isDisabled}
              className="block w-full rounded-md px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted disabled:opacity-60"
            >
              Category
            </button>
          ) : null}
          {canDelete ? (
            <button
              type="button"
              onClick={() => handleAction(onDelete)}
              disabled={isDisabled}
              className="block w-full rounded-md px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
            >
              Delete
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export function KanbanBoard({ projectId, role }: { projectId: string; role: ProjectRole }) {
  const categoryMeta: Record<"todo" | "in_progress" | "done", { label: string; className: string }> = {
    todo: {
      label: "To Do",
      className: "bg-amber-100 text-amber-800",
    },
    in_progress: {
      label: "In Progress",
      className: "bg-sky-100 text-sky-800",
    },
    done: {
      label: "Done",
      className: "bg-emerald-100 text-emerald-800",
    },
  }

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
  const [isCreateListOpen, setIsCreateListOpen] = useState(false)

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

  async function handleCreateList(input: { name: string }) {
    await createList({
      name: input.name,
      position: activeLists.length,
      category: "in_progress",
    })
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

  async function handleCategoryUpdate(
    listId: string,
    currentCategory: "todo" | "in_progress" | "done",
  ) {
    const categoryInput = window.prompt(
      'Set category: "todo", "in_progress", or "done". Projects allow only one "todo" and one "done" list.',
      currentCategory,
    )
    if (!categoryInput?.trim()) return

    const normalizedCategory =
      categoryInput === "todo" || categoryInput === "in_progress" || categoryInput === "done"
        ? categoryInput
        : null

    if (!normalizedCategory || normalizedCategory === currentCategory) return

    try {
      await updateList(listId, {
        category: normalizedCategory,
      })
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to update list category")
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
    assigneeId?: string | null
    dueDate?: string | null
    labels: string[]
    attachments: File[]
  }) {
    if (!modalState) return

    if (modalState.mode === "create") {
      const listTaskCount = tasksByList.get(modalState.listId)?.length ?? 0
      await createTask({
        title: input.title,
        description: input.description ?? null,
        status: input.status,
        priority: input.priority,
        assigneeId: input.assigneeId ?? null,
        dueDate: input.dueDate ?? null,
        listId: modalState.listId,
        position: listTaskCount,
      })
      setModalState(null)
      return
    }

    await updateTask(modalState.task.id, {
      title: input.title,
      description: input.description ?? null,
      status: input.status,
      priority: input.priority,
      assigneeId: input.assigneeId ?? null,
      dueDate: input.dueDate ?? null,
    })
    setModalState(null)
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
          <p className="text-sm text-muted-foreground">
          </p>
        </div>
        {canManageLists ? (
          <button
            onClick={() => setIsCreateListOpen(true)}
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
              onClick={() => setIsCreateListOpen(true)}
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
            const onRenameList = canManageLists ? () => void handleRenameList(list.id, list.name) : undefined
            const onDeleteList = canManageLists ? () => void handleDeleteList(list.id, list.name) : undefined
            const onRenameCategory = canManageLists ? () => void handleCategoryUpdate(list.id, list.category) : undefined
            const badge = categoryMeta[list.category]

            return (
              <section key={list.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-foreground">{list.name}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}>
                        {badge.label}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {listTasks.length} {listTasks.length === 1 ? "task" : "tasks"}
                    </p>
                  </div>
                  <ListActions
                    onRename={onRenameList}
                    onEditCategory={onRenameCategory}
                    onDelete={onDeleteList}
                    isDisabled={isListsMutating}
                  />
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
                                  assigneeId: task.assigneeId,
                                  dueDate: task.dueDate,
                                  labels: [],
                                },
                              })
                          : undefined
                      }
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
                assigneeId: modalState.task.assigneeId,
                dueDate: modalState.task.dueDate,
                labels: modalState.task.labels ?? [],
              }
            : null
        }
        assigneeOptions={[]}
        comments={[]}
        activityItems={[]}
        canEdit={canManageTasks && modalState?.mode === "edit"}
        canDelete={canManageTasks && modalState?.mode === "edit"}
        isSubmitting={isTasksMutating}
        onClose={() => setModalState(null)}
        onSubmit={handleTaskSubmit}
        onDelete={
          modalState?.mode === "edit" && canManageTasks
            ? () => handleDeleteTask(modalState.task.id, modalState.task.title)
            : undefined
        }
      />

      <CreateListModal
        isOpen={isCreateListOpen}
        isSubmitting={isListsMutating}
        onClose={() => setIsCreateListOpen(false)}
        onSubmit={handleCreateList}
      />
    </div>
  )
}
