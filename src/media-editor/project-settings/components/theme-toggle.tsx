"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => mounted && setTheme(theme === "dark" ? "light" : "dark")}
      className="hover:bg-secondary h-7 w-7 cursor-pointer p-0"
    >
      <Sun className="h-5 w-5 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90 dark:text-gray-100 dark:hover:text-gray-50" />
      <Moon className="absolute h-5 w-5 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0 dark:text-gray-100 dark:hover:text-gray-50" />
      <span className="sr-only">Переключить тему</span>
    </Button>
  )
}
