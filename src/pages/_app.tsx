import "@/styles/globals.css"
import "@/i18n" // Импортируем конфигурацию i18next

import type { AppProps } from "next/app"
import { ThemeProvider } from "next-themes"
import { useEffect } from "react"
import i18n from "i18next"

import { Providers } from "@/media-editor/providers"

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/coi-serviceworker.js")
    }
  }, [])

  // Проверяем и синхронизируем язык при загрузке приложения
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedLang = localStorage.getItem('app-language')
      console.log('App: Initial load - localStorage language:', storedLang)
      console.log('App: Initial load - i18n language:', i18n.language)

      // Если язык в localStorage отличается от текущего языка i18next, применяем его
      if (storedLang && (storedLang === 'ru' || storedLang === 'en') && storedLang !== i18n.language) {
        console.log('App: Initial load - changing language to match localStorage:', storedLang)
        i18n.changeLanguage(storedLang)
      }
    }
  }, [])

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Providers>
        <Component {...pageProps} />
      </Providers>
    </ThemeProvider>
  )
}
