import { useCallback } from "react"

import { MediaFile } from "@/types/media"

import { usePlayerContext } from "../services/player-provider"

interface UseVideoSelectionProps {
  video: MediaFile
  isActive: boolean
  index: number
}

/**
 * Хук для обработки выбора видео в шаблоне
 * @param props Объект с параметрами для обработки выбора видео
 * @returns Объект с функциями для обработки выбора видео
 */
export function useVideoSelection({ video, isActive, index }: UseVideoSelectionProps) {
  // Получаем необходимые функции из контекста плеера
  const { setVideo, setActiveVideoId, videoRefs } = usePlayerContext()

  // Пытаемся получить setLocalDisplayTime из контекста плеера
  // Это может быть undefined, поэтому обрабатываем этот случай позже
  const playerContext = usePlayerContext() as any
  const setLocalDisplayTime = playerContext.setLocalDisplayTime

  /**
   * Функция для обработки клика по видео
   */
  const handleVideoClick = useCallback(() => {
    if (!video || !video.id) return

    console.log(`[VideoSelection] Клик по видео ${video.id} (индекс: ${index})`)

    // Если видео уже активно, ничего не делаем
    if (isActive) {
      console.log(`[VideoSelection] Видео ${video.id} уже активно`)
      return
    }

    // Устанавливаем новое активное видео без установки флага seeking
    // Это предотвратит лишние перерисовки
    console.log(`[VideoSelection] Устанавливаем новое активное видео: ${video.id}`)

    // Используем batch-обновление для минимизации перерисовок
    // Сначала устанавливаем ID, затем видео
    setActiveVideoId(video.id)
    setVideo(video)

    try {
      // При переключении видео в шаблоне не меняем время воспроизведения
      // Просто обновляем активное видео
      console.log(
        `[VideoSelection] Переключение на видео ${video.id} без изменения времени воспроизведения`,
      )

      // Обновляем локальное отображаемое время, если нужно
      // Но не меняем время воспроизведения самого видео
      if (videoRefs[video.id]) {
        const currentVideoTime = videoRefs[video.id].currentTime

        // Проверяем, что setLocalDisplayTime существует и является функцией
        if (typeof setLocalDisplayTime === "function") {
          setLocalDisplayTime(currentVideoTime)
          console.log(`[VideoSelection] Текущее время видео: ${currentVideoTime.toFixed(3)}`)
        } else {
          console.log(
            `[VideoSelection] setLocalDisplayTime не определен, пропускаем обновление времени`,
          )
        }
      }
    } catch (error) {
      console.error("[VideoSelection] Ошибка при переключении видео:", error)
    }
  }, [video, isActive, index, setActiveVideoId, setVideo, videoRefs, setLocalDisplayTime])

  return {
    handleVideoClick,
  }
}
