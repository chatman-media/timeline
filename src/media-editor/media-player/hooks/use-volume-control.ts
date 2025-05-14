import { useCallback, useRef } from "react"

import { MediaFile } from "@/types/media"

interface UseVolumeControlProps {
  video: MediaFile | null
  videoRefs: Record<string, HTMLVideoElement>
  volume: number
  setVolume: (volume: number) => void
}

/**
 * Хук для управления громкостью видео
 * @param props Объект с параметрами для управления громкостью
 * @returns Объект с функциями для управления громкостью
 */
export function useVolumeControl({ video, videoRefs, volume, setVolume }: UseVolumeControlProps) {
  // Используем useRef для хранения последнего значения громкости и предотвращения лишних рендеров
  const volumeRef = useRef(volume)
  const volumeChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isVolumeChangingRef = useRef(false)
  const lastVolumeUpdateTimeRef = useRef(0)

  /**
   * Функция для применения громкости к активному видео
   */
  const applyVolumeToVideoElements = useCallback(
    (newVolume: number) => {
      // Применяем громкость только к активному видео
      if (video?.id && videoRefs[video.id]) {
        videoRefs[video.id].volume = newVolume
        videoRefs[video.id].muted = newVolume === 0
      }
    },
    [video, videoRefs],
  )

  /**
   * Функция для изменения громкости с дебаунсингом
   */
  const handleVolumeChange = useCallback(
    (value: number[]) => {
      const newVolume = value[0]
      const now = performance.now()

      // Устанавливаем флаг, что громкость меняется
      isVolumeChangingRef.current = true

      // Обновляем значение в ref без вызова setVolume на каждое изменение
      volumeRef.current = newVolume

      // Применяем громкость напрямую к видео элементам для мгновенной обратной связи
      applyVolumeToVideoElements(newVolume)

      // Используем дебаунсинг и троттлинг для обновления состояния
      // Обновляем состояние только если прошло достаточно времени с последнего обновления
      if (now - lastVolumeUpdateTimeRef.current > 200) {
        lastVolumeUpdateTimeRef.current = now

        // Очищаем предыдущий таймаут, если он был
        if (volumeChangeTimeoutRef.current) {
          clearTimeout(volumeChangeTimeoutRef.current)
        }

        // Устанавливаем новый таймаут для обновления состояния
        volumeChangeTimeoutRef.current = setTimeout(() => {
          // Обновляем состояние только если все еще меняется громкость
          if (isVolumeChangingRef.current) {
            setVolume(newVolume)
          }
          volumeChangeTimeoutRef.current = null
        }, 100) // Обновляем состояние не чаще чем раз в 100мс
      }
    },
    [applyVolumeToVideoElements, setVolume],
  )

  /**
   * Функция, которая вызывается при завершении изменения громкости (отпускании слайдера)
   */
  const handleVolumeChangeEnd = useCallback(() => {
    // Сбрасываем флаг изменения громкости
    isVolumeChangingRef.current = false

    // Очищаем таймаут, если он был установлен
    if (volumeChangeTimeoutRef.current) {
      clearTimeout(volumeChangeTimeoutRef.current)
      volumeChangeTimeoutRef.current = null
    }

    // Обновляем состояние сразу при отпускании слайдера
    // Используем setTimeout с нулевой задержкой, чтобы отделить обновление от события UI
    setTimeout(() => {
      setVolume(volumeRef.current)

      // Сохраняем значение громкости в localStorage только при отпускании слайдера
      if (typeof window !== "undefined") {
        localStorage.setItem("player-volume", volumeRef.current.toString())
        console.log(`[PlayerControls] Сохранен уровень звука: ${volumeRef.current}`)
      }
    }, 0)
  }, [setVolume])

  /**
   * Функция для переключения между режимами mute/unmute
   */
  const handleToggleMute = useCallback(() => {
    const newVolume = volume === 0 ? 1 : 0

    // Сохраняем текущее значение громкости в ref
    volumeRef.current = newVolume

    // Применяем громкость напрямую к видео элементам для мгновенной обратной связи
    applyVolumeToVideoElements(newVolume)

    // Обновляем состояние с небольшой задержкой, чтобы избежать лагов
    setTimeout(() => {
      setVolume(newVolume)

      // При переключении mute сразу сохраняем значение в localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("player-volume", newVolume.toString())
        console.log(`[PlayerControls] Сохранен уровень звука при переключении: ${newVolume}`)
      }
    }, 0)
  }, [volume, setVolume, applyVolumeToVideoElements])

  return {
    volumeRef,
    handleVolumeChange,
    handleVolumeChangeEnd,
    handleToggleMute,
  }
}
