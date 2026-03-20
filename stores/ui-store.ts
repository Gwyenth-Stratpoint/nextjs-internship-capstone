import { create } from "zustand";

type Theme = "dark" | "light";

type Notification = {
  id: string;
  message: string;
  tone?: "info" | "success" | "error";
};

type UIState = {
  theme: Theme;
  sidebarOpen: boolean;
  isCreateProjectModalOpen: boolean;
  isLoading: boolean;
  loadingMessage: string | null;
  notifications: Notification[];
  setTheme: (theme: Theme) => void;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
  openCreateProjectModal: () => void;
  closeCreateProjectModal: () => void;
  setLoading: (isLoading: boolean, message?: string | null) => void;
  pushNotification: (notification: Omit<Notification, "id">) => void;
  dismissNotification: (id: string) => void;
};

function resolveInitialTheme(): Theme {
  if (typeof window === "undefined") {
    return "light";
  }

  const savedTheme = window.localStorage.getItem("theme");
  return savedTheme === "dark" ? "dark" : "light";
}

export const useUIStore = create<UIState>((set) => ({
  theme: resolveInitialTheme(),
  sidebarOpen: false,
  isCreateProjectModalOpen: false,
  isLoading: false,
  loadingMessage: null,
  notifications: [],
  setTheme: (theme) => set({ theme }),
  openSidebar: () => set({ sidebarOpen: true }),
  closeSidebar: () => set({ sidebarOpen: false }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  openCreateProjectModal: () => set({ isCreateProjectModalOpen: true }),
  closeCreateProjectModal: () => set({ isCreateProjectModalOpen: false }),
  setLoading: (isLoading, message = null) =>
    set({
      isLoading,
      loadingMessage: isLoading ? message : null,
    }),
  pushNotification: (notification) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          ...notification,
        },
      ],
    })),
  dismissNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((notification) => notification.id !== id),
    })),
}));
