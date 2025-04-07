"use client";

import React, { createContext, useContext, useEffect } from "react";
import { useTauriTheme } from "@repo/ui/hooks/use-tauri-theme";

type TauriThemeContextType = {
  theme: "light" | "dark" | "system";
  actualTheme: "light" | "dark";
  setTheme: (theme: "light" | "dark" | "system") => void;
  isLoaded: boolean;
};

const TauriThemeContext = createContext<TauriThemeContextType | undefined>(undefined);

export function TauriThemeProvider({ children }: { children: React.ReactNode }) {
  const themeState = useTauriTheme();
  
  // Применяем тему при загрузке
  useEffect(() => {
    if (themeState.isLoaded) {
      const root = document.documentElement;
      const isDark = themeState.theme === "dark" || 
        (themeState.theme === "system" && themeState.actualTheme === "dark");
      
      root.classList.toggle("dark", isDark);
    }
  }, [themeState.isLoaded, themeState.theme, themeState.actualTheme]);
  
  return (
    <TauriThemeContext.Provider value={themeState}>
      {children}
    </TauriThemeContext.Provider>
  );
}

export function useTauriThemeContext() {
  const context = useContext(TauriThemeContext);
  if (context === undefined) {
    throw new Error("useTauriThemeContext must be used within a TauriThemeProvider");
  }
  return context;
} 