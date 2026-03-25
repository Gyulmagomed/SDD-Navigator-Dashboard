"use client";

/**
 * Единая клиентская оболочка для всего приложения (подключается из корневого app/layout.tsx).
 * Здесь: тема, toasts, NextAuth session, React Query, rehydrate Zustand persist, MSW только в development.
 */
import { useEffect, type ReactNode } from "react";
import { AppShell } from "@/components/providers/app-shell";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { AppThemeProvider } from "@/components/providers/theme-provider";
import { usePreferencesStore } from "@/lib/store/preferencesStore";
import { useUiStore } from "@/lib/store/uiStore";

interface ClientProvidersProps {
  children: ReactNode;
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  useEffect(() => {
    void useUiStore.persist.rehydrate();
    void usePreferencesStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    let cancelled = false;

    void (async () => {
      const { startMswWorker } = await import("@/mocks/browser");
      if (!cancelled) {
        await startMswWorker();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AppThemeProvider>
      <AppShell>
        <AuthSessionProvider>
          <QueryProvider>{children}</QueryProvider>
        </AuthSessionProvider>
      </AppShell>
    </AppThemeProvider>
  );
}
