import { useCallback, useMemo } from "react"

import { MediaFile } from "@/types/media"

interface UseTimeControlProps {
  video: MediaFile | null
  videoRefs: Record<string, HTMLVideoElement>
  currentTime: number
  setCurrentTime: (time: number) => void
  setIsSeeking: (isSeeking: boolean) => void
  isChangingCamera: boolean
  parallelVideos: MediaFile[]
  appliedTemplate: any
  setLocalDisplayTime: (time: number) => void
  activeVideoId?: string | null // Добавляем ID активного видео
}

/**
 * Хук для управления временем воспроизведения
 * @param props Объект с параметрами для управления временем
 * @returns Объект с функциями для управления временем
 */
export function useTimeControl({
  video,
  videoRefs,
  currentTime,
  setCurrentTime,
  setIsSeeking,
  isChangingCamera,
  parallelVideos,
  appliedTemplate,
  setLocalDisplayTime,
  activeVideoId,
}: UseTimeControlProps) {
  /**
   * Функция для получения видео для отображения (активное видео в шаблоне или текущее видео)
   */
  const getDisplayVideo = useCallback(() => {
    // Если применен шаблон и есть видео в шаблоне
    if (appliedTemplate?.videos && appliedTemplate.videos.length > 0) {
      // Если есть активное видео, ищем его в шаблоне
      if (activeVideoId) {
        const activeVideo = appliedTemplate.videos.find((v) => v.id === activeVideoId)
        if (activeVideo) {
          return activeVideo
        }
      }
      // Если активное видео не найдено, возвращаем первое видео в шаблоне
      return appliedTemplate.videos[0]
    }
    // Если нет шаблона, возвращаем текущее видео
    return video
  }, [appliedTemplate, video, activeVideoId])

  /**
   * Функция для изменения времени воспроизведения
   */
  const handleTimeChange = useCallback(
    (value: number[]) => {
      // Определяем, какое видео использовать для изменения времени
      const videoToUse = getDisplayVideo()

      if (!videoToUse) return

      // Если идет процесс переключения камеры, игнорируем изменение времени
      if (isChangingCamera) {
        console.log("[handleTimeChange] Игнорируем изменение времени во время переключения камеры")
        return
      }

      const videoDuration = videoToUse.duration || 0
      const sliderValue = value[0]

      // Проверка валидности значения
      if (!isFinite(sliderValue) || sliderValue < 0) return

      // Ограничиваем время в пределах длительности видео
      const clampedTime = Math.min(videoDuration, Math.max(0, sliderValue))

      // Определяем, короткое ли у нас видео (меньше 10 секунд)
      const isShortVideo = videoDuration < 10

      // Для коротких видео используем меньший порог изменения
      const timeChangeThreshold = isShortVideo ? 0.001 : 0.01

      // Вычисляем локальное время для сравнения
      const localTime =
        currentTime > 365 * 24 * 60 * 60 && videoToUse.startTime
          ? Math.max(0, currentTime - (videoToUse.startTime || 0))
          : currentTime

      // Проверяем, существенно ли изменилось время
      if (Math.abs(clampedTime - localTime) < timeChangeThreshold) return

      // Логируем только при значительных изменениях времени
      if (Math.abs(clampedTime - localTime) > 0.5) {
        console.log("[handleTimeChange] Значительное изменение времени:", {
          currentTime: localTime.toFixed(3),
          clampedTime: clampedTime.toFixed(3),
          delta: (clampedTime - localTime).toFixed(3),
        })
      }

      // Устанавливаем seeking перед изменением времени, чтобы избежать
      // конфликтов с обновлениями от timeupdate
      setIsSeeking(true)

      try {
        // Если текущее время - Unix timestamp, обрабатываем особым образом
        if (currentTime > 365 * 24 * 60 * 60) {
          // Устанавливаем относительный прогресс для текущего видео
          console.log(
            `[handleTimeChange] Установка относительного прогресса: ${clampedTime.toFixed(3)}`,
          )

          // Определяем, какие видео нужно обновить
          let videosToUpdate: MediaFile[] = []

          // Если применен шаблон, обновляем все видео в шаблоне
          if (appliedTemplate?.videos && appliedTemplate.videos.length > 0) {
            videosToUpdate = appliedTemplate.videos
            console.log(`[handleTimeChange] Обновляем ${videosToUpdate.length} видео в шаблоне`)
          }
          // Если есть параллельные видео, обновляем их
          else if (parallelVideos && parallelVideos.length > 0) {
            videosToUpdate = parallelVideos
            console.log(`[handleTimeChange] Обновляем ${videosToUpdate.length} параллельных видео`)
          }
          // Иначе обновляем только текущее видео
          else if (videoToUse) {
            videosToUpdate = [videoToUse]
            console.log(`[handleTimeChange] Обновляем только текущее видео: ${videoToUse.id}`)
          }

          // Вычисляем относительную позицию для текущего видео
          const relativePosition = clampedTime / (videoToUse.duration || 1)
          console.log(`[handleTimeChange] Относительная позиция: ${relativePosition.toFixed(3)}`)

          // Обновляем время для всех видео
          videosToUpdate.forEach((updateVideo) => {
            if (updateVideo?.id && videoRefs[updateVideo.id]) {
              // Если это первое видео (или единственное), устанавливаем точное время
              if (updateVideo.id === videoToUse.id) {
                videoRefs[updateVideo.id].currentTime = clampedTime
                console.log(
                  `[handleTimeChange] Установлено точное время ${clampedTime.toFixed(3)} для видео ${updateVideo.id}`,
                )

                // Обновляем локальное отображаемое время по первому видео
                setLocalDisplayTime(clampedTime)
              }
              // Для остальных видео вычисляем пропорциональное время
              else {
                const updateVideoDuration = updateVideo.duration || 1
                const newTime = relativePosition * updateVideoDuration
                videoRefs[updateVideo.id].currentTime = newTime
                console.log(
                  `[handleTimeChange] Синхронизировано время ${newTime.toFixed(3)} для видео ${updateVideo.id}`,
                )
              }
            }
          })

          // Сбрасываем флаг seeking после небольшой задержки
          setTimeout(() => {
            setIsSeeking(false)
          }, 50)

          return
        }

        // Для обычного времени преобразуем относительное время в абсолютное
        let newTime = clampedTime
        if (videoToUse.startTime) {
          newTime = videoToUse.startTime + clampedTime
          console.log(`[handleTimeChange] Преобразование времени: ${clampedTime} -> ${newTime}`)
        }

        // Устанавливаем новое время с пометкой, что источник - пользователь
        setCurrentTime(newTime)
      } catch (error) {
        console.error("[handleTimeChange] Ошибка при изменении времени:", error)
        setIsSeeking(false)
      }
    },
    [
      video,
      videoRefs,
      setCurrentTime,
      setIsSeeking,
      currentTime,
      isChangingCamera,
      parallelVideos,
      appliedTemplate,
      setLocalDisplayTime,
      getDisplayVideo,
    ],
  )

  /**
   * Функция форматирования относительного времени
   */
  const formatRelativeTime = useCallback((time: number): string => {
    // Добавим проверку на конечность числа
    if (!isFinite(time)) {
      console.warn("[formatRelativeTime] Received non-finite time:", time)
      return "00:00:00.000"
    }
    // Используем Math.max для гарантии неотрицательного значения
    const absTime = Math.max(0, time)
    const hours = Math.floor(absTime / 3600)
    const minutes = Math.floor((absTime % 3600) / 60)
    const seconds = Math.floor(absTime % 60)
    const milliseconds = Math.floor((absTime % 1) * 1000)
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(3, "0")}`
  }, [])

  /**
   * Функция форматирования абсолютного времени сектора
   */
  const formatSectorTime = useCallback(
    (time: number, startTime?: number): string => {
      // Если нет startTime или это не Unix timestamp, используем относительное время
      if (!startTime || startTime < 365 * 24 * 60 * 60) {
        return formatRelativeTime(time)
      }

      // Преобразуем Unix timestamp в объект Date
      const date = new Date((startTime + time) * 1000)

      // Форматируем время в формате HH:MM:SS.mmm
      const hours = date.getHours().toString().padStart(2, "0")
      const minutes = date.getMinutes().toString().padStart(2, "0")
      const seconds = date.getSeconds().toString().padStart(2, "0")
      const milliseconds = date.getMilliseconds().toString().padStart(3, "0")

      return `${hours}:${minutes}:${seconds}.${milliseconds}`
    },
    [formatRelativeTime],
  )

  return {
    handleTimeChange,
    formatRelativeTime,
    formatSectorTime,
    getDisplayVideo,
  }
}
