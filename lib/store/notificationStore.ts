import { create } from "zustand";

export interface AppNotification {
  id: string;
  title: string;
  body?: string;
  read: boolean;
  createdAt: string;
}

const newId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

interface NotificationStoreState {
  notifications: AppNotification[];
  addNotification: (input: { title: string; body?: string }) => string;
  markRead: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationStoreState>((set, get) => ({
  notifications: [],
  addNotification: (input) => {
    const id = newId();
    const item: AppNotification = {
      id,
      title: input.title,
      body: input.body,
      read: false,
      createdAt: new Date().toISOString(),
    };
    set({ notifications: [item, ...get().notifications].slice(0, 50) });
    return id;
  },
  markRead: (id) =>
    set({
      notifications: get().notifications.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
    }),
  clearAll: () => set({ notifications: [] }),
}));
