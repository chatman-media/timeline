import { useCallback } from "react"

import { stopAllVideos } from "@/media-editor/browser/services/video-control"
import { MediaFile } from "@/types/media"

/**
 * Хук для управления воспроизведением видео
 * @returns Функции для управления воспроизведением видео
 */
export function useVideoPlayback() {
  /**
   * Останавливает все видео элементы
   */
  const pauseAllVideos = useCallback(() => {
    // Останавливаем все видео элементы, включая те, которые могут воспроизводиться в фоне
    stopAllVideos(true) // Не останавливаем видео в шаблоне

    console.log("[useVideoPlayback] Остановлены все видео")
  }, [])

  /**
   * Запускает воспроизведение видео
   * @param videoElement Видео элемент
   * @param videoId ID видео
   */
  const playVideo = useCallback((videoElement: HTMLVideoElement, videoId: string) => {
    if (!videoElement) return

    try {
      const playPromise = videoElement.play()
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          // Игнорируем ошибку AbortError, которая возникает при быстром переключении видео
          if (error.name !== "AbortError") {
            console.error(`[useVideoPlayback] Ошибка воспроизведения видео ${videoId}:`, error)
          }
        })
      }
    } catch (error) {
      console.error(
        `[useVideoPlayback] Ошибка при запуске воспроизведения видео ${videoId}:`,
        error,
      )
    }
  }, [])

  /**
   * Останавливает воспроизведение видео
   * @param videoElement Видео элемент
   * @param videoId ID видео
   */
  const pauseVideo = useCallback((videoElement: HTMLVideoElement, videoId: string) => {
    if (!videoElement) return

    try {
      videoElement.pause()
    } catch (error) {
      console.error(
        `[useVideoPlayback] Ошибка при остановке воспроизведения видео ${videoId}:`,
        error,
      )
    }
  }, [])

  /**
   * Устанавливает текущее время видео
   * @param videoElement Видео элемент
   * @param videoId ID видео
   * @param time Время в секундах
   */
  const setVideoTime = useCallback(
    (videoElement: HTMLVideoElement, videoId: string, time: number) => {
      if (!videoElement) return

      try {
        videoElement.currentTime = time
      } catch (error) {
        console.error(`[useVideoPlayback] Ошибка при установке времени видео ${videoId}:`, error)
      }
    },
    [],
  )

  /**
   * Устанавливает громкость видео
   * @param videoElement Видео элемент
   * @param videoId ID видео
   * @param volume Громкость (0-1)
   */
  const setVideoVolume = useCallback(
    (videoElement: HTMLVideoElement, videoId: string, volume: number) => {
      if (!videoElement) return

      try {
        videoElement.volume = volume
        videoElement.muted = volume === 0
      } catch (error) {
        console.error(`[useVideoPlayback] Ошибка при установке громкости видео ${videoId}:`, error)
      }
    },
    [],
  )

  /**
   * Синхронизирует состояние воспроизведения для всех видео в шаблоне
   * @param videos Массив видео
   * @param videoRefs Объект для хранения ссылок на видео элементы
   * @param isPlaying Флаг воспроизведения
   * @param activeVideoId ID активного видео
   */
  const syncTemplateVideosPlayback = useCallback(
    (
      videos: MediaFile[],
      videoRefs: Record<string, HTMLVideoElement>,
      isPlaying: boolean,
      activeVideoId: string | null,
    ) => {
      videos.forEach((video) => {
        if (!video.id || !videoRefs[video.id]) return

        const videoElement = videoRefs[video.id]
        const isActive = video.id === activeVideoId

        if (isPlaying) {
          // Запускаем воспроизведение
          playVideo(videoElement, video.id)
        } else {
          // Останавливаем воспроизведение
          pauseVideo(videoElement, video.id)
        }

        // Устанавливаем громкость (звук только из активного видео)
        videoElement.muted = !isActive
      })
    },
    [playVideo, pauseVideo],
  )

  return {
    pauseAllVideos,
    playVideo,
    pauseVideo,
    setVideoTime,
    setVideoVolume,
    syncTemplateVideosPlayback,
  }
}
