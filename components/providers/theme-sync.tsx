"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { useUiStore } from "@/lib/store/uiStore";

export function ThemeSync(): null {
  const preference = useUiStore((state) => state.themePreference);
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme(preference);
  }, [preference, setTheme]);

  return null;
}
