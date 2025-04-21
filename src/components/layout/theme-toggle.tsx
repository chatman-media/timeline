"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

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
      className="h-6 w-6 cursor-pointer p-0"
    >
      <Sun className="h-3.5 w-3.5 scale-100 rotate-0 text-gray-600 transition-all hover:text-gray-900 dark:scale-0 dark:-rotate-90 dark:text-gray-100 dark:hover:text-gray-50" />
      <Moon className="absolute h-3.5 w-3.5 scale-0 rotate-90 text-gray-600 transition-all hover:text-gray-900 dark:scale-100 dark:rotate-0 dark:text-gray-100 dark:hover:text-gray-50" />
      <span className="sr-only">Переключить тему</span>
    </Button>
  )
}
