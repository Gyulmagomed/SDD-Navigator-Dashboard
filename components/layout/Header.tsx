"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Bell, Menu, Moon, Search, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { useNotificationStore } from "@/lib/store/notificationStore";
import { useUiStore } from "@/lib/store/uiStore";

const PALETTE_LINKS = [
  { label: "Overview", href: "/" },
  { label: "Specifications", href: "/specifications" },
  { label: "Coverage Map", href: "/coverage" },
  { label: "Reports", href: "/reports" },
];

interface HeaderProps {
  onOpenMobileSidebar: () => void;
}

function useIsClient(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function Header({ onOpenMobileSidebar }: HeaderProps) {
  const { resolvedTheme } = useTheme();
  const setThemePreference = useUiStore((state) => state.setThemePreference);
  const mounted = useIsClient();
  const notifications = useNotificationStore((state) => state.notifications);
  const markRead = useNotificationStore((state) => state.markRead);
  const clearAll = useNotificationStore((state) => state.clearAll);
  const [openPalette, setOpenPalette] = useState(false);
  const [query, setQuery] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationPanelRef = useRef<HTMLDivElement>(null);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent | PointerEvent) => {
      if (!notificationsOpen) {
        return;
      }
      const node = notificationPanelRef.current;
      if (node && !node.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [notificationsOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const hasShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k";
      if (!hasShortcut) {
        return;
      }

      event.preventDefault();
      setOpenPalette((prev) => !prev);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const filteredLinks = useMemo(
    () =>
      PALETTE_LINKS.filter((item) =>
        item.label.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [query],
  );

  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenMobileSidebar}
            className="md:hidden"
            aria-label="Open navigation"
          >
            <Menu className="size-5" />
          </Button>
          <Breadcrumbs />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpenPalette(true)}
            aria-label="Open command palette"
          >
            <Search className="size-4" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="ml-1 hidden rounded border px-1 text-xs text-muted-foreground sm:inline">
              Ctrl+K
            </kbd>
          </Button>

          <div className="relative" ref={notificationPanelRef}>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Notifications${unreadCount > 0 ? `, ${String(unreadCount)} unread` : ""}`}
              aria-expanded={notificationsOpen}
              onClick={() => setNotificationsOpen((open) => !open)}
            >
              <div className="relative">
                <Bell className="size-5" />
                {unreadCount > 0 ? (
                  <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                ) : null}
              </div>
            </Button>
            {notificationsOpen ? (
              <div
                className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-lg border bg-popover p-2 text-popover-foreground shadow-lg"
                role="dialog"
                aria-label="Notifications list"
              >
                <div className="mb-2 flex items-center justify-between px-2">
                  <span className="text-sm font-medium">Notifications</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => clearAll()}>
                    Clear
                  </Button>
                </div>
                <ul className="max-h-64 space-y-1 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <li className="px-3 py-4 text-center text-sm text-muted-foreground">
                      No notifications.
                    </li>
                  ) : (
                    notifications.map((notification) => (
                      <li key={notification.id}>
                        <button
                          type="button"
                          className={`w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted ${
                            notification.read ? "opacity-70" : "font-medium"
                          }`}
                          onClick={() => markRead(notification.id)}
                        >
                          <span className="block">{notification.title}</span>
                          {notification.body ? (
                            <span className="mt-0.5 block text-xs text-muted-foreground">
                              {notification.body}
                            </span>
                          ) : null}
                          <span className="mt-1 block text-[10px] text-muted-foreground" suppressHydrationWarning>
                            {mounted
                              ? new Date(notification.createdAt).toLocaleString()
                              : notification.createdAt.slice(0, 16)}
                          </span>
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            ) : null}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              setThemePreference(resolvedTheme === "dark" ? "light" : "dark")
            }
            disabled={!mounted}
            aria-label="Toggle color theme"
            aria-busy={!mounted}
          >
            {!mounted ? (
              <span className="inline-block size-5" aria-hidden />
            ) : resolvedTheme === "dark" ? (
              <Sun className="size-5" />
            ) : (
              <Moon className="size-5" />
            )}
          </Button>
        </div>
      </header>

      {openPalette ? (
        <div
          className="fixed inset-0 z-40 flex items-start justify-center bg-black/40 px-4 pt-24"
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
          onClick={() => setOpenPalette(false)}
        >
          <div
            className="w-full max-w-xl rounded-lg border bg-popover p-3 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center gap-2 rounded-md border px-3 py-2">
              <Search className="size-4 text-muted-foreground" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full bg-transparent text-sm outline-none"
                placeholder="Type a page name..."
                aria-label="Search pages"
              />
            </div>
            <ul className="space-y-1">
              {filteredLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="block rounded-md px-3 py-2 text-sm hover:bg-muted"
                    onClick={() => setOpenPalette(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              {filteredLinks.length === 0 ? (
                <li className="px-3 py-2 text-sm text-muted-foreground">No matching pages.</li>
              ) : null}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
}
