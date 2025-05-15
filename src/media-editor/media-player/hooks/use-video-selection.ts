import { useCallback } from "react"

import { useTimeline } from "@/media-editor/timeline/services/timeline-provider"
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

  // Получаем контекст таймлайна
  const timelineContext = useTimeline()

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

      // Если видео из таймлайна (имеет startTime), делаем его активным на дорожке
      if (video.startTime !== undefined) {
        try {
          // Получаем дату сектора из startTime видео
          const sectorDate = new Date(video.startTime * 1000).toISOString().split("T")[0]

          // Находим все треки в активном секторе
          const tracks = timelineContext.tracks.filter((track) => {
            // Проверяем, что трек содержит видео с нужным ID
            return track.videos?.some((v) => v.id === video.id)
          })

          if (tracks.length > 0) {
            // Устанавливаем активную дорожку с небольшой задержкой
            // Это позволяет избежать проблем с черным экраном
            setTimeout(() => {
              try {
                // Устанавливаем активную дорожку
                const trackWithVideo = tracks[0]
                console.log(`[VideoSelection] Устанавливаем активную дорожку: ${trackWithVideo.id}`)
                timelineContext.setActiveTrack(trackWithVideo.id)

                // Устанавливаем время для сектора
                if (videoRefs[video.id]) {
                  const currentVideoTime = videoRefs[video.id].currentTime
                  console.log(
                    `[VideoSelection] Устанавливаем время ${currentVideoTime.toFixed(3)} для сектора ${sectorDate}`,
                  )
                  timelineContext.setSectorTime(sectorDate, currentVideoTime, false)
                }
              } catch (delayedError) {
                console.error(
                  "[VideoSelection] Ошибка при отложенной активации видео на дорожке:",
                  delayedError,
                )
              }
            }, 100)
          } else {
            console.log(`[VideoSelection] Не найдены треки с видео ${video.id} в активном секторе`)
          }
        } catch (error) {
          console.error("[VideoSelection] Ошибка при активации видео на дорожке:", error)
        }
      }
    } catch (error) {
      console.error("[VideoSelection] Ошибка при переключении видео:", error)
    }
  }, [
    video,
    isActive,
    index,
    setActiveVideoId,
    setVideo,
    videoRefs,
    setLocalDisplayTime,
    timelineContext,
  ])

  return {
    handleVideoClick,
  }
}
