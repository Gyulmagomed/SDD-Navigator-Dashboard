"use client";

import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { ThemeSync } from "@/components/providers/theme-sync";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <>
      <ThemeSync />
      {children}
      <Toaster richColors position="top-center" closeButton duration={4000} />
    </>
  );
}
