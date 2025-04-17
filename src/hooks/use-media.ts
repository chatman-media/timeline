import { useCallback, useEffect, useState } from "react"

import { MediaFile } from "@/types/media"

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

      const validMedia = data.media.filter((file: MediaFile): file is MediaFile => {
        return Boolean(file.isVideo || file.isAudio || file.isImage)
      })

      // Сохраняем валидные медиа-файлы в состояние
      setMedia(validMedia)
      return validMedia
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
