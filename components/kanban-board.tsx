"use client";

import { MoreHorizontal, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CreateListModal } from "@/components/modals/create-list-modal";
import { CreateTaskModal } from "@/components/modals/create-task-modal";
import { DeleteListModal } from "@/components/modals/delete-list-modal";
import { EditListModal } from "@/components/modals/edit-list-modal";
import { TaskCard } from "@/components/task-card";
import { CardInset } from "@/components/ui/card";
import { useComments } from "@/hooks/use-comments";
import { useLists } from "@/hooks/use-lists";
import { useTasks } from "@/hooks/use-tasks";
import { useBoardStore } from "@/stores/board-store";

type TaskStatus = "open" | "in_progress" | "blocked" | "done";
type TaskPriority = "none" | "low" | "medium" | "high" | "urgent";
type ProjectRole = "owner" | "admin" | "member" | "viewer";

type ModalState =
  | { mode: "create"; listId: string; listName: string }
  | {
      mode: "edit";
      listId: string;
      listName: string;
      task: {
        id: string;
        title: string;
        description?: string | null;
        status: TaskStatus;
        priority: TaskPriority;
        assigneeId?: string | null;
        dueDate?: string | null;
        labels?: string[];
      };
    }
  | null;

type DeleteListState = {
  listId: string;
  listName: string;
  taskCount: number;
  destinationListId: string;
  error: string | null;
} | null;

type EditListState = {
  listId: string;
  listName: string;
  category: "todo" | "in_progress" | "done";
} | null;

type ListActionsProps = {
  onRename?: () => void;
  onEditCategory?: () => void;
  onDelete?: () => void;
  isDisabled?: boolean;
  buttonClassName?: string;
  menuClassName?: string;
};

function ListActions({
  onRename,
  onEditCategory,
  onDelete,
  isDisabled = false,
  buttonClassName,
  menuClassName,
}: ListActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const canRename = typeof onRename === "function";
  const canEditCategory = typeof onEditCategory === "function";
  const canDelete = typeof onDelete === "function";

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  if (!canRename && !canEditCategory && !canDelete) {
    return null;
  }

  function handleAction(action?: () => void) {
    if (!action || isDisabled) return;
    setIsOpen(false);
    action();
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
        className={`rounded-md border border-border px-2 py-1 text-xs text-foreground transition-colors hover:bg-muted disabled:opacity-60 ${buttonClassName ?? ""}`}
      >
        <MoreHorizontal size={14} />
      </button>

      {isOpen ? (
        <div
          className={`absolute right-0 top-full z-10 mt-2 min-w-36 rounded-lg border border-border bg-background p-1 shadow-lg ${menuClassName ?? ""}`}
        >
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
  );
}

type KanbanBoardProps = {
  projectId: string;
  role: ProjectRole;
  onCreateListActionChange?: (action: {
    open: () => void;
    disabled: boolean;
    visible: boolean;
  }) => void;
  onProgressChange?: (summary: { completionRate: number; isLoading: boolean }) => void;
};

export function KanbanBoard({
  projectId,
  role,
  onCreateListActionChange,
  onProgressChange,
}: KanbanBoardProps) {
  const categoryMeta: Record<
    "todo" | "in_progress" | "done",
    {
      label: string;
      countClassName: string;
      laneClassName: string;
      headerClassName: string;
    }
  > = {
    todo: {
      label: "Pending",
      countClassName: "bg-white/24 text-white",
      laneClassName:
        "border-[#9A8CF2] bg-[linear-gradient(180deg,rgba(124,110,230,0.15)_0%,rgba(255,255,255,0.92)_34%,rgba(255,255,255,0.97)_100%)]",
      headerClassName:
        "bg-[linear-gradient(135deg,#7C6EE6_0%,#9A8CF2_100%)] text-white shadow-[inset_0_-1px_0_rgba(255,255,255,0.14)]",
    },
    in_progress: {
      label: "In Progress",
      countClassName: "bg-white/24 text-white",
      laneClassName:
        "border-[#60A5FA] bg-[linear-gradient(180deg,rgba(59,130,255,0.15)_0%,rgba(255,255,255,0.92)_34%,rgba(255,255,255,0.97)_100%)]",
      headerClassName:
        "bg-[linear-gradient(135deg,#3B82F6_0%,#60A5FA_100%)] text-white shadow-[inset_0_-1px_0_rgba(255,255,255,0.14)]",
    },
    done: {
      label: "Completed",
      countClassName: "bg-white/24 text-white",
      laneClassName:
        "border-[#2fc7ba] bg-[linear-gradient(180deg,rgba(39,184,171,0.15)_0%,rgba(255,255,255,0.92)_34%,rgba(255,255,255,0.97)_100%)]",
      headerClassName:
        "bg-[linear-gradient(135deg,#27b8ab_0%,#2fc7ba_100%)] text-white shadow-[inset_0_-1px_0_rgba(255,255,255,0.14)]",
    },
  };

  // Column data for the current project board.
  const {
    lists,
    isLoading: isListsLoading,
    error: listsError,
    createList,
    updateList,
    deleteList,
    isMutating: isListsMutating,
  } = useLists(projectId);

  // Task data and mutations for board CRUD interactions.
  const {
    tasks,
    isLoading: isTasksLoading,
    error: tasksError,
    createTask,
    updateTask,
    deleteTask,
    refetchTasks,
    isMutating: isTasksMutating,
  } = useTasks(projectId);

  const modalState = useBoardStore((state) => state.taskModalState as ModalState);
  const isCreateListOpen = useBoardStore((state) => state.isCreateListOpen);
  const deleteListState = useBoardStore((state) => state.deleteListState as DeleteListState);
  const editListState = useBoardStore((state) => state.editListState as EditListState);
  const dragState = useBoardStore((state) => state.dragState);
  const setProjectScope = useBoardStore((state) => state.setProjectScope);
  const openCreateTaskModal = useBoardStore((state) => state.openCreateTaskModal);
  const openEditTaskModal = useBoardStore((state) => state.openEditTaskModal);
  const closeTaskModal = useBoardStore((state) => state.closeTaskModal);
  const openCreateListModal = useBoardStore((state) => state.openCreateListModal);
  const closeCreateListModal = useBoardStore((state) => state.closeCreateListModal);
  const openDeleteListStoreModal = useBoardStore((state) => state.openDeleteListModal);
  const setDeleteDestination = useBoardStore((state) => state.setDeleteDestination);
  const setDeleteError = useBoardStore((state) => state.setDeleteError);
  const closeDeleteListModal = useBoardStore((state) => state.closeDeleteListModal);
  const openEditListStoreModal = useBoardStore((state) => state.openEditListModal);
  const closeEditListModal = useBoardStore((state) => state.closeEditListModal);
  const startDrag = useBoardStore((state) => state.startDrag);
  const updateDragTarget = useBoardStore((state) => state.updateDragTarget);
  const clearDrag = useBoardStore((state) => state.clearDrag);
  const activeTaskId = modalState?.mode === "edit" ? modalState.task.id : null;
  const {
    comments,
    activityItems,
    isLoading: isCommentsLoading,
    isMutating: isCommentSubmitting,
    createComment,
  } = useComments(activeTaskId);

  useEffect(() => {
    setProjectScope(projectId);
  }, [projectId, setProjectScope]);

  const activeLists = useMemo(
    () => lists.filter((list) => !list.archived).sort((a, b) => a.position - b.position),
    [lists],
  );

  const tasksByList = useMemo(() => {
    const grouped = new Map<string, typeof tasks>();

    for (const list of activeLists) {
      grouped.set(list.id, []);
    }

    for (const task of tasks) {
      if (task.archived || !task.listId) continue;
      const current = grouped.get(task.listId);
      if (current) {
        current.push(task);
      }
    }

    for (const listTasks of grouped.values()) {
      listTasks.sort((a, b) => a.position - b.position);
    }

    return grouped;
  }, [activeLists, tasks]);

  const summarizeBoardProgress = useCallback(
    (taskItems: typeof tasks) => {
      const activeTasks = taskItems.filter((task) => !task.archived);
      const listCategoryById = new Map(activeLists.map((list) => [list.id, list.category]));
      const completedTasks = activeTasks.filter((task) => {
        const currentCategory = task.listId ? listCategoryById.get(task.listId) : null;
        if (currentCategory) {
          return currentCategory === "done";
        }

        return task.status === "done";
      }).length;

      return {
        completionRate: activeTasks.length
          ? Math.round((completedTasks / activeTasks.length) * 100)
          : 0,
        isLoading: isTasksLoading,
      };
    },
    [activeLists, isTasksLoading],
  );

  const boardProgress = useMemo(
    () => summarizeBoardProgress(tasks),
    [summarizeBoardProgress, tasks],
  );

  function mapListCategoryToTaskStatus(category: "todo" | "in_progress" | "done"): TaskStatus {
    switch (category) {
      case "todo":
        return "open";
      case "done":
        return "done";
      default:
        return "in_progress";
    }
  }

  function handleTaskDragStart(taskId: string) {
    startDrag(taskId);
  }

  function handleTaskDragEnd() {
    clearDrag();
  }

  function handleTaskDragOver(listId: string, overTaskId: string | null = null) {
    updateDragTarget(listId, overTaskId);
  }

  async function handleTaskDrop(listId: string, overTaskId: string | null = null) {
    if (!dragState) return;

    const draggedTask = tasks.find((task) => task.id === dragState.taskId);
    const destinationList = activeLists.find((list) => list.id === listId);

    if (!draggedTask || !destinationList) {
      clearDrag();
      return;
    }

    const destinationTasks = (tasksByList.get(listId) ?? []).filter(
      (task) => task.id !== draggedTask.id,
    );
    const nextPosition = overTaskId
      ? Math.max(
          destinationTasks.findIndex((task) => task.id === overTaskId),
          0,
        )
      : destinationTasks.length;
    const nextStatus = mapListCategoryToTaskStatus(destinationList.category);

    try {
      onProgressChange?.(
        summarizeBoardProgress(
          tasks.map((task) =>
            task.id === draggedTask.id
              ? {
                  ...task,
                  listId,
                  position: nextPosition,
                  status: nextStatus,
                }
              : task,
          ),
        ),
      );

      await updateTask(draggedTask.id, {
        listId,
        position: nextPosition,
        status: nextStatus,
      });
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to move task");
    } finally {
      clearDrag();
    }
  }

  async function handleCreateList(input: { name: string }) {
    await createList({
      name: input.name,
      position: activeLists.length,
      category: "in_progress",
    });
    closeCreateListModal();
  }

  function openEditListModal(
    listId: string,
    currentName: string,
    category: "todo" | "in_progress" | "done",
  ) {
    openEditListStoreModal({
      listId,
      listName: currentName,
      category,
    });
  }

  function openDeleteListModal(listId: string, name: string) {
    const taskCount = tasksByList.get(listId)?.length ?? 0;
    const fallbackDestinationId =
      activeLists.find((list) => list.id !== listId && !list.archived)?.id ?? "";

    openDeleteListStoreModal({
      listId,
      listName: name,
      taskCount,
      destinationListId: taskCount > 0 ? fallbackDestinationId : "",
      error: null,
    });
  }

  async function handleDeleteList() {
    if (!deleteListState) return;

    if (deleteListState.taskCount > 0 && !deleteListState.destinationListId) {
      setDeleteError("Choose a destination column before deleting this one.");
      return;
    }

    try {
      await deleteList(deleteListState.listId, {
        moveTasksToListId: deleteListState.destinationListId || null,
      });
      await refetchTasks();
      closeDeleteListModal();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete list");
    }
  }

  async function handleEditListSubmit(input: {
    name: string;
    category: "todo" | "in_progress" | "done";
  }) {
    if (!editListState) return;

    await updateList(editListState.listId, {
      name: input.name,
      category: input.category,
    });
    closeEditListModal();
  }

  async function handleDeleteTask(taskId: string, title: string) {
    const confirmed = window.confirm(`Delete "${title}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await deleteTask(taskId);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to delete task");
    }
  }

  async function handleTaskSubmit(input: {
    id?: string;
    title: string;
    description?: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    assigneeId?: string | null;
    dueDate?: string | null;
    labels: string[];
    attachments: File[];
  }) {
    if (!modalState) return;

    if (modalState.mode === "create") {
      const listTaskCount = tasksByList.get(modalState.listId)?.length ?? 0;
      await createTask({
        title: input.title,
        description: input.description ?? null,
        status: input.status,
        priority: input.priority,
        assigneeId: input.assigneeId ?? null,
        dueDate: input.dueDate ?? null,
        listId: modalState.listId,
        position: listTaskCount,
      });
      closeTaskModal();
      return;
    }

    await updateTask(modalState.task.id, {
      title: input.title,
      description: input.description ?? null,
      status: input.status,
      priority: input.priority,
      assigneeId: input.assigneeId ?? null,
      dueDate: input.dueDate ?? null,
    });
    closeTaskModal();
  }

  async function handleCreateComment(content: string) {
    await createComment(content);
    await refetchTasks();
  }

  const boardError = listsError ?? tasksError;
  const isLoading = isListsLoading || isTasksLoading;
  const isMutating = isListsMutating || isTasksMutating;
  const canManageLists = role === "owner" || role === "admin";
  const canManageTasks = canManageLists || role === "member";
  const columnMinWidth = 208;
  const boardMinWidth =
    activeLists.length > 0
      ? `${activeLists.length * columnMinWidth + Math.max(activeLists.length - 1, 0) * 12}px`
      : undefined;
  const taskModalKey =
    modalState?.mode === "edit"
      ? `task-edit-${modalState.task.id}`
      : modalState?.mode === "create"
        ? `task-create-${modalState.listId}`
        : "task-closed";
  const listModalKey = isCreateListOpen ? "list-open" : "list-closed";

  useEffect(() => {
    if (!onCreateListActionChange) return;

    onCreateListActionChange({
      open: openCreateListModal,
      disabled: isListsMutating,
      visible: canManageLists,
    });
  }, [canManageLists, isListsMutating, onCreateListActionChange, openCreateListModal]);

  useEffect(() => {
    if (!onProgressChange) return;

    onProgressChange(boardProgress);
  }, [boardProgress, onProgressChange]);

  return (
    <div className="space-y-4">
      {boardError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load board: {boardError}
        </div>
      ) : null}

      {isLoading ? (
        <div className="overflow-x-auto pb-2">
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns: `repeat(3, minmax(${columnMinWidth}px, 1fr))`,
              minWidth: `${3 * columnMinWidth + 24}px`,
            }}
          >
            {Array.from({ length: 3 }).map((_, index) => (
              <CardInset key={index} as="div" className="overflow-hidden rounded-[22px] p-0">
                <div className="h-11 bg-slate-200/80" />
                <div className="space-y-3 p-3">
                  <div className="h-24 animate-pulse rounded-2xl bg-muted" />
                  <div className="h-24 animate-pulse rounded-2xl bg-muted" />
                </div>
              </CardInset>
            ))}
          </div>
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
              onClick={openCreateListModal}
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
        <div className="overflow-x-auto pb-2">
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns: `repeat(${activeLists.length}, minmax(${columnMinWidth}px, 1fr))`,
              minWidth: boardMinWidth,
            }}
          >
            {activeLists.map((list) => {
              const listTasks = tasksByList.get(list.id) ?? [];
              const onRenameList = canManageLists
                ? () => openEditListModal(list.id, list.name, list.category)
                : undefined;
              const onDeleteList = canManageLists
                ? () => openDeleteListModal(list.id, list.name)
                : undefined;
              const onRenameCategory = canManageLists
                ? () => openEditListModal(list.id, list.name, list.category)
                : undefined;
              const tone = categoryMeta[list.category];

              return (
                <section
                  key={list.id}
                  onDragOver={(event) => {
                    event.preventDefault();
                    if (canManageTasks && dragState) {
                      handleTaskDragOver(list.id, null);
                    }
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (canManageTasks && dragState) {
                      void handleTaskDrop(list.id, null);
                    }
                  }}
                  className={`min-w-0 overflow-hidden rounded-[22px] border ${
                    dragState?.overListId === list.id && dragState.overTaskId === null
                      ? "border-blue-300 ring-2 ring-blue-100"
                      : tone.laneClassName
                  }`}
                >
                  <div
                    className={`flex items-center justify-between gap-2 px-3 py-3 ${tone.headerClassName}`}
                  >
                    <div className="min-w-0 flex items-center gap-2">
                      <h3 className="truncate text-sm font-semibold">{list.name}</h3>
                      <span
                        className={`inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[10px] font-semibold ${tone.countClassName}`}
                      >
                        {listTasks.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {canManageTasks ? (
                        <button
                          type="button"
                          onClick={() => openCreateTaskModal(list.id, list.name)}
                          disabled={isMutating}
                          className="rounded-full border border-white/20 bg-white/12 p-1.5 text-white transition hover:bg-white/20 disabled:opacity-60"
                          aria-label={`Add task to ${list.name}`}
                        >
                          <Plus size={13} />
                        </button>
                      ) : null}
                      <ListActions
                        onRename={onRenameList}
                        onEditCategory={onRenameCategory}
                        onDelete={onDeleteList}
                        isDisabled={isListsMutating}
                        buttonClassName="rounded-full border-white/20 bg-white/12 p-1.5 text-white hover:bg-white/20 hover:text-white"
                        menuClassName="border-white/80 bg-white/95 backdrop-blur-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-2.5 p-3">
                    {listTasks.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200/80 bg-white/72 px-4 py-6 text-center text-sm text-muted-foreground">
                        No tasks in this list yet.
                      </div>
                    ) : null}

                    {listTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        draggable={canManageTasks}
                        onDragStart={handleTaskDragStart}
                        onDragEnd={handleTaskDragEnd}
                        onDragOver={() => {
                          if (canManageTasks && dragState?.taskId !== task.id) {
                            handleTaskDragOver(list.id, task.id);
                          }
                        }}
                        onDrop={() => {
                          if (canManageTasks && dragState?.taskId !== task.id) {
                            void handleTaskDrop(list.id, task.id);
                          }
                        }}
                        isDragging={dragState?.taskId === task.id}
                        isDropTarget={
                          dragState?.overListId === list.id && dragState.overTaskId === task.id
                        }
                        onEdit={
                          canManageTasks
                            ? () =>
                                openEditTaskModal({
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
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      ) : null}

      <CreateTaskModal
        key={taskModalKey}
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
        comments={comments.map((comment) => ({
          id: comment.id,
          authorName: comment.authorName ?? "Unknown user",
          content: comment.content,
          createdAt: comment.createdAt,
        }))}
        activityItems={activityItems}
        isCommentsLoading={isCommentsLoading}
        isCommentSubmitting={isCommentSubmitting}
        canEdit={canManageTasks && modalState?.mode === "edit"}
        canDelete={canManageTasks && modalState?.mode === "edit"}
        isSubmitting={isTasksMutating}
        onClose={closeTaskModal}
        onSubmit={handleTaskSubmit}
        onCreateComment={
          modalState?.mode === "edit" && canManageTasks
            ? (content) => handleCreateComment(content)
            : undefined
        }
        onDelete={
          modalState?.mode === "edit" && canManageTasks
            ? () => handleDeleteTask(modalState.task.id, modalState.task.title)
            : undefined
        }
      />

      <CreateListModal
        key={listModalKey}
        isOpen={isCreateListOpen}
        isSubmitting={isListsMutating}
        onClose={closeCreateListModal}
        onSubmit={handleCreateList}
      />

      <DeleteListModal
        isOpen={deleteListState !== null}
        listName={deleteListState?.listName ?? ""}
        taskCount={deleteListState?.taskCount ?? 0}
        destinationListId={deleteListState?.destinationListId ?? ""}
        destinationOptions={activeLists
          .filter((list) => list.id !== deleteListState?.listId)
          .map((list) => ({ id: list.id, name: list.name }))}
        isSubmitting={isListsMutating}
        error={deleteListState?.error ?? null}
        onDestinationChange={setDeleteDestination}
        onClose={closeDeleteListModal}
        onSubmit={() => void handleDeleteList()}
      />

      <EditListModal
        key={editListState ? `edit-list-${editListState.listId}` : "edit-list-closed"}
        isOpen={editListState !== null}
        listName={editListState?.listName ?? ""}
        category={editListState?.category ?? "in_progress"}
        isSubmitting={isListsMutating}
        onClose={closeEditListModal}
        onSubmit={handleEditListSubmit}
      />
    </div>
  );
}
