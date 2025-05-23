import "@/styles/globals.css"
import "@/i18n" // Импортируем конфигурацию i18next

import i18n from "i18next"
import type { AppProps } from "next/app"
import { ThemeProvider } from "next-themes"
import { useEffect } from "react"

import { Toaster } from "@/components/ui/sonner"
import { isSupportedLanguage } from "@/i18n/constants"
import { Providers } from "@/media-editor/providers"
import { screenshotNotificationService } from "@/media-editor/services/screenshot-notification-service"

export default function App({ Component, pageProps }: AppProps) {
  // Инициализируем Service Worker
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/coi-serviceworker.js")
    }
  }, [])

  // Инициализируем Socket.IO
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Инициализируем Socket.IO сервер
      fetch("/api/socket")
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Ошибка инициализации Socket.IO сервера: ${response.status}`)
          }
          return response.json()
        })
        .then(() => {
          console.log("[App] Socket.IO сервер инициализирован")

          // Инициализируем сервис уведомлений о скриншотах
          screenshotNotificationService.initialize()
          console.log("[App] Сервис уведомлений о скриншотах инициализирован")
        })
        .catch((error) => {
          console.error("[App] Ошибка при инициализации Socket.IO сервера:", error)
        })
    }
  }, [])

  // Проверяем и синхронизируем язык при загрузке приложения
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedLang = localStorage.getItem("app-language")
      console.log("App: Initial load - localStorage language:", storedLang)
      console.log("App: Initial load - i18n language:", i18n.language)

      // Если язык в localStorage отличается от текущего языка i18next, применяем его
      if (storedLang && isSupportedLanguage(storedLang) && storedLang !== i18n.language) {
        console.log("App: Initial load - changing language to match localStorage:", storedLang)
        i18n.changeLanguage(storedLang)
      }
    }
  }, [])

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Providers>
        <Component {...pageProps} />
        <Toaster />
      </Providers>
    </ThemeProvider>
  )
}
