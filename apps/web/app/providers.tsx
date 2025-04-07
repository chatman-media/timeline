"use client";

import { TauriThemeProvider } from "@repo/ui/components/tauri-theme-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return <TauriThemeProvider>{children}</TauriThemeProvider>;
} 