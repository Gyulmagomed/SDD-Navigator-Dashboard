"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  BarChart3,
  ClipboardList,
  FileBarChart2,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePreferencesStore } from "@/lib/store/preferencesStore";
import { useUiStore } from "@/lib/store/uiStore";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/specifications", label: "Specifications", icon: ClipboardList },
  { href: "/coverage", label: "Coverage Map", icon: BarChart3 },
  { href: "/reports", label: "Reports", icon: FileBarChart2 },
];

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const setSidebarCollapsed = useUiStore((state) => state.setSidebarCollapsed);
  const specsListMode = usePreferencesStore((state) => state.specsListMode);
  const setSpecsListMode = usePreferencesStore((state) => state.setSpecsListMode);

  return (
    <>
      {mobileOpen ? (
        <button
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={onCloseMobile}
          aria-label="Close navigation overlay"
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col border-r bg-sidebar transition-all md:sticky md:translate-x-0",
          collapsed ? "w-[72px]" : "w-[240px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-3">
          {!collapsed ? <p className="font-semibold">SDD Navigator</p> : null}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!collapsed)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={onCloseMobile}
              aria-label="Close sidebar"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        <nav className="flex-1 px-2 py-3">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(`${item.href}/`));

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    onClick={onCloseMobile}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                      isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/80",
                      collapsed ? "justify-center px-2" : "",
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    {!collapsed ? <span>{item.label}</span> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <details className={cn("border-t px-2 py-2", collapsed && "hidden")}>
          <summary className="cursor-pointer list-none px-2 py-2 text-xs font-medium text-muted-foreground [&::-webkit-details-marker]:hidden">
            Specifications list
          </summary>
          <div className="space-y-2 px-2 pb-2">
            <p className="text-xs text-muted-foreground">
              Pagination loads pages via URL. Infinite scroll loads more as you scroll.
            </p>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="radio"
                name="specs-list-mode"
                checked={specsListMode === "pagination"}
                onChange={() => setSpecsListMode("pagination")}
                aria-label="Pagination mode"
              />
              Pagination
            </label>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="radio"
                name="specs-list-mode"
                checked={specsListMode === "infinite"}
                onChange={() => setSpecsListMode("infinite")}
                aria-label="Infinite scroll mode"
              />
              Infinite scroll
            </label>
          </div>
        </details>

        <div className="border-t p-3">
          <div className={cn("mb-2 flex items-center gap-2", collapsed ? "justify-center" : "")}>
            <div className="rounded-full border p-2">
              <User className="size-4" />
            </div>
            {!collapsed ? (
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{session?.user?.name ?? "User"}</p>
                <p className="truncate text-xs text-muted-foreground">{session?.user?.email ?? ""}</p>
              </div>
            ) : null}
          </div>
          <Button
            variant="outline"
            size={collapsed ? "icon" : "sm"}
            className={cn("w-full", collapsed ? "px-0" : "")}
            onClick={() => signOut({ callbackUrl: "/login" })}
            aria-label="Sign out"
            title={collapsed ? "Sign out" : undefined}
          >
            <LogOut className="size-4" />
            {!collapsed ? <span>Sign out</span> : null}
          </Button>
        </div>
      </aside>
    </>
  );
}
