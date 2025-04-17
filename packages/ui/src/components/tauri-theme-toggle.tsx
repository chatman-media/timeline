"use client"

import { Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"
import { useTauriThemeContext } from "@repo/ui/components/tauri-theme-provider"
import { Button } from "@repo/ui/components/button"

export function TauriThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTauriThemeContext()

  // Ждем монтирования компонента, чтобы избежать проблем с гидратацией
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="cursor-pointer"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-gray-600 dark:text-gray-100 hover:text-gray-900 dark:hover:text-gray-50" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-gray-600 dark:text-gray-100 hover:text-gray-900 dark:hover:text-gray-50" />
      <span className="sr-only">Переключить тему</span>
    </Button>
  )
}
