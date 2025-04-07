"use client";

import { useEffect, useState } from "react";

// Добавляем типы для window.__TAURI__
declare global {
  interface Window {
    __TAURI__: {
      invoke: (cmd: string, args?: any) => Promise<any>;
    } | undefined;
  }
}

// Тип для события изменения темы
interface ThemeChangeEvent {
  payload: string;
}

// Проверяем, находимся ли мы в среде Tauri
const isTauri = typeof window !== "undefined" && !!window.__TAURI__;

export function useTauriTheme() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [actualTheme, setActualTheme] = useState<"light" | "dark">("light");
  
  // Инициализация темы
  useEffect(() => {
    async function initializeTheme() {
      if (isTauri) {
        try {
          // Используем динамический импорт для проверки платформы
          // Используем Try/Catch, так как модули могут быть недоступны
          const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
          setActualTheme(isDark ? "dark" : "light");
          
          try {
            // Пытаемся использовать встроенные команды Tauri для получения темы
            const systemTheme = await window.__TAURI__?.invoke("get_system_theme");
            if (systemTheme) {
              setActualTheme(systemTheme as "light" | "dark");
            }
          } catch (e) {
            console.log("Couldn't get system theme from Tauri API");
          }
          
          // Используем собственную функцию для прослушивания событий
          const listenForThemeChange = async () => {
            try {
              // Динамический импорт для event API
              const eventApi = await import("@tauri-apps/api/event");
              return await eventApi.listen<string>("theme-changed", (event: ThemeChangeEvent) => {
                const isDarkMode = event.payload === "dark";
                setActualTheme(isDarkMode ? "dark" : "light");
                if (theme === "system") {
                  document.documentElement.classList.toggle("dark", isDarkMode);
                }
              });
            } catch (e) {
              console.error("Failed to listen for theme changes", e);
              return () => {}; // Заглушка для случаев, когда API недоступен
            }
          };
          
          const unlistener = await listenForThemeChange();
          return () => {
            unlistener();
          };
        } catch (error) {
          console.error("Failed to initialize Tauri theme", error);
          fallbackThemeLogic();
        }
      } else {
        fallbackThemeLogic();
      }
    }
    
    initializeTheme();
  }, [theme]);
  
  // Логика для веб-приложений или когда Tauri API недоступен
  function fallbackThemeLogic() {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setActualTheme(isDark ? "dark" : "light");
    
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = (e: MediaQueryListEvent) => {
      setActualTheme(e.matches ? "dark" : "light");
      if (theme === "system") {
        document.documentElement.classList.toggle("dark", e.matches);
      }
    };
    
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }
  
  // Функция для изменения темы
  const setThemeMode = async (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    
    if (isTauri) {
      try {
        if (newTheme !== "system") {
          // Вызываем нативный метод Tauri для установки темы
          await window.__TAURI__?.invoke("set_theme", { theme: newTheme });
          document.documentElement.classList.toggle("dark", newTheme === "dark");
        } else {
          // Для системной темы используем текущую системную настройку
          const systemIsDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
          document.documentElement.classList.toggle("dark", systemIsDark);
          
          // Устанавливаем системную тему через Tauri API
          try {
            await window.__TAURI__?.invoke("set_theme", { theme: "system" });
          } catch (e) {
            console.error("Failed to set system theme", e);
          }
        }
      } catch (error) {
        console.error("Failed to set Tauri theme", error);
        fallbackThemeSetLogic(newTheme);
      }
    } else {
      fallbackThemeSetLogic(newTheme);
    }
  };
  
  // Логика установки темы для веб-приложений
  function fallbackThemeSetLogic(newTheme: "light" | "dark" | "system") {
    if (newTheme === "system") {
      const systemIsDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", systemIsDark);
    } else {
      document.documentElement.classList.toggle("dark", newTheme === "dark");
    }
    
    localStorage.setItem("theme", newTheme);
  }
  
  return {
    theme,
    actualTheme,
    setTheme: setThemeMode,
    isLoaded: true
  };
} 