import { useCallback, useEffect, useState } from "react"

import { MediaFile } from "@/types/videos"

/**
 * Хук для работы с медиафайлами
 * @returns Объект с медиафайлами и функциями для работы с ними
 */
export function useMedia() {
  const [media, setMedia] = useState<MediaFile[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchVideos = useCallback(async () => {
    try {
      const response = await fetch("/api/media")
      if (!response.ok) throw new Error("Не удалось загрузить медиафайлы")

      const data = await response.json()
      if (!data || typeof data !== "object" || !("media" in data)) {
        throw new Error("Неверный формат данных")
      }

      const validMedia = data.media
        .filter(
          (item: MediaFile): item is MediaFile =>
            item && typeof item === "object" && "id" in item && "name" in item && "path" in item,
        )
        .sort((a: MediaFile, b: MediaFile) => (a.startTime || 0) - (b.startTime || 0))

      setMedia(validMedia)
    } catch (error) {
      console.error("Ошибка при загрузке медиафайлов:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchVideos()
  }, [fetchVideos])

  return {
    media,
    isLoading,
    fetchVideos,
  }
}
