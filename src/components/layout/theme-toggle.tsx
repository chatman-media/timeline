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
      // size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="absolute top-[-2px] left-[-7px] hover:bg-transparent cursor-pointer"
    >
      <Sun className="h-7 w-7 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-gray-600 dark:text-gray-100 hover:text-gray-900 dark:hover:text-gray-50" />
      <Moon className="absolute h-7 w-7 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-gray-600 dark:text-gray-100 hover:text-gray-900 dark:hover:text-gray-50" />
      {/* <span className="sr-only">Переключить тему</span> */}
    </Button>
  )
}
