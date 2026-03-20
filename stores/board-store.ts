import { create } from "zustand";

type TaskStatus = "open" | "in_progress" | "blocked" | "done";
type TaskPriority = "none" | "low" | "medium" | "high" | "urgent";

type TaskModalState =
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

type DragState = {
  taskId: string;
  overListId: string | null;
  overTaskId: string | null;
} | null;

type BoardState = {
  currentProjectId: string | null;
  taskModalState: TaskModalState;
  isCreateListOpen: boolean;
  deleteListState: DeleteListState;
  editListState: EditListState;
  dragState: DragState;
  setProjectScope: (projectId: string) => void;
  resetBoardUi: () => void;
  openCreateTaskModal: (listId: string, listName: string) => void;
  openEditTaskModal: (input: Exclude<TaskModalState, { mode: "create" } | null>) => void;
  closeTaskModal: () => void;
  openCreateListModal: () => void;
  closeCreateListModal: () => void;
  openDeleteListModal: (input: NonNullable<DeleteListState>) => void;
  setDeleteDestination: (destinationListId: string) => void;
  setDeleteError: (error: string | null) => void;
  closeDeleteListModal: () => void;
  openEditListModal: (input: NonNullable<EditListState>) => void;
  closeEditListModal: () => void;
  startDrag: (taskId: string) => void;
  updateDragTarget: (overListId: string | null, overTaskId?: string | null) => void;
  clearDrag: () => void;
};

const initialBoardUiState = {
  taskModalState: null as TaskModalState,
  isCreateListOpen: false,
  deleteListState: null as DeleteListState,
  editListState: null as EditListState,
  dragState: null as DragState,
};

export const useBoardStore = create<BoardState>((set, get) => ({
  currentProjectId: null,
  ...initialBoardUiState,
  setProjectScope: (projectId) => {
    if (get().currentProjectId === projectId) {
      return;
    }

    set({
      currentProjectId: projectId,
      ...initialBoardUiState,
    });
  },
  resetBoardUi: () => set(initialBoardUiState),
  openCreateTaskModal: (listId, listName) =>
    set({
      taskModalState: {
        mode: "create",
        listId,
        listName,
      },
    }),
  openEditTaskModal: (input) => set({ taskModalState: input }),
  closeTaskModal: () => set({ taskModalState: null }),
  openCreateListModal: () => set({ isCreateListOpen: true }),
  closeCreateListModal: () => set({ isCreateListOpen: false }),
  openDeleteListModal: (input) => set({ deleteListState: input }),
  setDeleteDestination: (destinationListId) =>
    set((state) => ({
      deleteListState: state.deleteListState
        ? {
            ...state.deleteListState,
            destinationListId,
            error: null,
          }
        : null,
    })),
  setDeleteError: (error) =>
    set((state) => ({
      deleteListState: state.deleteListState
        ? {
            ...state.deleteListState,
            error,
          }
        : null,
    })),
  closeDeleteListModal: () => set({ deleteListState: null }),
  openEditListModal: (input) => set({ editListState: input }),
  closeEditListModal: () => set({ editListState: null }),
  startDrag: (taskId) =>
    set({
      dragState: {
        taskId,
        overListId: null,
        overTaskId: null,
      },
    }),
  updateDragTarget: (overListId, overTaskId = null) =>
    set((state) => {
      if (
        !state.dragState ||
        (state.dragState.overListId === overListId && state.dragState.overTaskId === overTaskId)
      ) {
        return state;
      }

      return {
        dragState: {
          ...state.dragState,
          overListId,
          overTaskId,
        },
      };
    }),
  clearDrag: () => set({ dragState: null }),
}));
