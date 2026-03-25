"use client";

import { useState, type ReactNode } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useUiStore } from "@/lib/store/uiStore";
import { cn } from "@/lib/utils";

export function DashboardLayoutClient({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const collapsed = useUiStore((state) => state.sidebarCollapsed);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div
        className={cn(
          "flex min-h-screen flex-1 flex-col transition-[margin] duration-200",
          collapsed ? "md:ml-[72px]" : "md:ml-[240px]",
        )}
      >
        <Header onOpenMobileSidebar={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 md:p-6">
          <ErrorBoundary title="Dashboard content failed to load">{children}</ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
