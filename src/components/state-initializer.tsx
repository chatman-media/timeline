"use client"

import { Suspense, useEffect } from "react"

import { useRootStore } from "@/hooks/use-root-store"
import { initializeDatabase } from "@/lib/db-init"
import { rootStore } from "@/stores/root-store"

/**
 * Этот компонент отвечает за запуск процесса инициализации состояния
 * при монтировании приложения. Он не блокирует рендеринг дочерних компонентов.
 */
export function StateInitializer({ children }: { children: React.ReactNode }) {
  const { initializeHistory, fetchVideos } = useRootStore()

  useEffect(() => {
    const init = async () => {
      try {
        console.log("[StateInitializer] Starting initialization...")
        await initializeDatabase()
        console.log("[StateInitializer] Database initialized")

        // Инициализируем историю и загружаем видео параллельно
        initializeHistory()
        fetchVideos()
        console.log("[StateInitializer] Initialization completed")
      } catch (error) {
        console.error("[StateInitializer] Initialization failed:", error)
      }
    }

    init()
  }, [initializeHistory, fetchVideos])

  return <Suspense fallback={null}>{children}</Suspense>
}

// Вспомогательная функция для генерации ID
function generateVideoId(media: any[]): string {
  return `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Убедись, что в src/stores/root-store.ts в initialContext стоит isLoading: true
/*
const initialContext: StateContext = {
  // ...
  isLoading: true, // <-- Должно быть true!
  hasFetched: false,
  // ...
};
*/
