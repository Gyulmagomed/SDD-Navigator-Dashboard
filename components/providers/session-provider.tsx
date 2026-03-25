"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

interface AuthSessionProviderProps {
  children: ReactNode;
}

export function AuthSessionProvider({ children }: AuthSessionProviderProps) {
  return (
    <SessionProvider refetchOnWindowFocus={false} refetchWhenOffline={false}>
      {children}
    </SessionProvider>
  );
}
