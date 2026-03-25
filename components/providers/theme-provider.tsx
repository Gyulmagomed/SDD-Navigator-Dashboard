"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";

interface AppThemeProviderProps {
  children: ReactNode;
}

export function AppThemeProvider({ children }: AppThemeProviderProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="sdd-theme"
    >
      {children}
    </ThemeProvider>
  );
}
