import { useCallback } from "react"

import { getFrameTime } from "@/lib/video-utils"
import { MediaFile } from "@/types/media"

interface UsePlaybackControlProps {
  video: MediaFile | null
  videoRefs: Record<string, HTMLVideoElement>
  currentTime: number
  setCurrentTime: (time: number) => void
  isPlaying: boolean
  setIsPlaying: (isPlaying: boolean) => void
  isChangingCamera: boolean
  activeTrackId: string | null
  tracks: any[]
  parallelVideos: MediaFile[]
  appliedTemplate: any
  calculatedDisplayTime: number
}

/**
 * Хук для управления воспроизведением
 * @param props Объект с параметрами для управления воспроизведением
 * @returns Объект с функциями для управления воспроизведением
 */
export function usePlaybackControl({
  video,
  videoRefs,
  currentTime,
  setCurrentTime,
  isPlaying,
  setIsPlaying,
  isChangingCamera,
  activeTrackId,
  tracks,
  parallelVideos,
  appliedTemplate,
  calculatedDisplayTime,
}: UsePlaybackControlProps) {
  /**
   * Функция для перемещения на один кадр назад
   */
  const handleSkipBackward = useCallback(() => {
    if (!video) return

    // Определяем размер шага (один кадр) с использованием getFrameTime
    let frameTime = getFrameTime(video)

    // Определяем минимальное время (начало видео или трека)
    let minTime = video.startTime || 0
    let currentVideoOrTrack = video

    console.log(
      `[handleSkipBackward] Используем frameTime: ${frameTime} (${1 / frameTime} fps) для видео ${video.id}`,
    )

    // Если есть активный трек, используем его для определения минимального времени
    if (activeTrackId) {
      const activeTrack = tracks.find((track) => track.id === activeTrackId)
      if (activeTrack && activeTrack.videos && activeTrack.videos.length > 0) {
        // Находим видео в треке, которое содержит текущее время
        const currentTrackVideo = activeTrack.videos.find((v) => {
          const videoStart = v.startTime || 0
          const videoEnd = videoStart + (v.duration || 0)
          return currentTime >= videoStart && currentTime <= videoEnd
        })

        if (currentTrackVideo) {
          currentVideoOrTrack = currentTrackVideo
          const videoStart = currentTrackVideo.startTime || 0

          // Проверяем, есть ли предыдущее видео в треке
          const currentIndex = activeTrack.videos.indexOf(currentTrackVideo)
          if (currentIndex > 0 && Math.abs(currentTime - videoStart) < 0.01) {
            // Если мы в начале текущего видео и есть предыдущее, используем конец предыдущего
            const prevVideo = activeTrack.videos[currentIndex - 1]
            const prevVideoEnd = (prevVideo.startTime || 0) + (prevVideo.duration || 0)
            minTime = prevVideoEnd - frameTime // Устанавливаем на последний кадр предыдущего видео
            console.log(
              `[handleSkipBackward] Переход к предыдущему видео в треке: ${prevVideo.id}, endTime: ${minTime}`,
            )
          } else {
            // Иначе используем начало текущего видео
            minTime = videoStart
            console.log(
              `[handleSkipBackward] Используем видео из трека: ${currentTrackVideo.id}, minTime: ${minTime}`,
            )
          }
        } else {
          // Если не нашли видео, содержащее текущее время, используем первое видео в треке
          const firstVideo = activeTrack.videos[0]
          minTime = firstVideo.startTime || 0
          console.log(
            `[handleSkipBackward] Используем первое видео из трека: ${firstVideo.id}, minTime: ${minTime}`,
          )
        }
      }
    }

    // Проверяем, не находимся ли мы уже в начале видео или трека
    if (Math.abs(currentTime - minTime) < 0.01) {
      console.log(`[handleSkipBackward] Уже в начале видео/трека: ${currentTime} ≈ ${minTime}`)
      return
    }

    // Обновляем frameTime для текущего видео, если оно изменилось
    if (currentVideoOrTrack !== video) {
      frameTime = getFrameTime(currentVideoOrTrack)
      console.log(
        `[handleSkipBackward] Обновлен frameTime для текущего видео: ${frameTime} (${1 / frameTime} fps)`,
      )
    }

    // Вычисляем новое время
    const newTime = Math.max(minTime, currentTime - frameTime)
    console.log(`[handleSkipBackward] Перемещение на один кадр назад: ${currentTime} -> ${newTime}`)

    // Устанавливаем новое время и останавливаем воспроизведение
    setCurrentTime(newTime)
    setIsPlaying(false)
  }, [video, currentTime, setCurrentTime, setIsPlaying, activeTrackId, tracks])

  /**
   * Функция для перемещения на один кадр вперед
   */
  const handleSkipForward = useCallback(() => {
    if (!video) return

    // Определяем размер шага (один кадр) с использованием getFrameTime
    let frameTime = getFrameTime(video)

    // Определяем максимальное время (конец видео или трека)
    let maxTime = (video.startTime || 0) + (video.duration || 0)
    let currentVideoOrTrack = video

    console.log(
      `[handleSkipForward] Используем frameTime: ${frameTime} (${1 / frameTime} fps) для видео ${video.id}`,
    )

    // Если есть активный трек, используем его для определения максимального времени
    if (activeTrackId) {
      const activeTrack = tracks.find((track) => track.id === activeTrackId)
      if (activeTrack && activeTrack.videos && activeTrack.videos.length > 0) {
        // Находим видео в треке, которое содержит текущее время
        const currentTrackVideo = activeTrack.videos.find((v) => {
          const videoStart = v.startTime || 0
          const videoEnd = videoStart + (v.duration || 0)
          return currentTime >= videoStart && currentTime <= videoEnd
        })

        if (currentTrackVideo) {
          currentVideoOrTrack = currentTrackVideo
          const videoEnd = (currentTrackVideo.startTime || 0) + (currentTrackVideo.duration || 0)

          // Проверяем, есть ли следующее видео в треке
          const currentIndex = activeTrack.videos.indexOf(currentTrackVideo)
          if (
            currentIndex < activeTrack.videos.length - 1 &&
            Math.abs(currentTime - videoEnd) < 0.01
          ) {
            // Если мы в конце текущего видео и есть следующее, используем начало следующего
            const nextVideo = activeTrack.videos[currentIndex + 1]
            maxTime = nextVideo.startTime || 0
            console.log(
              `[handleSkipForward] Переход к следующему видео в треке: ${nextVideo.id}, startTime: ${maxTime}`,
            )
          } else {
            // Иначе используем конец текущего видео
            maxTime = videoEnd
            console.log(
              `[handleSkipForward] Используем видео из трека: ${currentTrackVideo.id}, maxTime: ${maxTime}`,
            )
          }
        } else {
          // Если не нашли видео, содержащее текущее время, используем последнее видео в треке
          const lastVideo = activeTrack.videos[activeTrack.videos.length - 1]
          maxTime = (lastVideo.startTime || 0) + (lastVideo.duration || 0)
          console.log(
            `[handleSkipForward] Используем последнее видео из трека: ${lastVideo.id}, maxTime: ${maxTime}`,
          )
        }
      }
    }

    // Проверяем, не находимся ли мы уже в конце видео или трека
    if (Math.abs(currentTime - maxTime) < 0.01) {
      console.log(`[handleSkipForward] Уже в конце видео/трека: ${currentTime} ≈ ${maxTime}`)
      return
    }

    // Обновляем frameTime для текущего видео, если оно изменилось
    if (currentVideoOrTrack !== video) {
      frameTime = getFrameTime(currentVideoOrTrack)
      console.log(
        `[handleSkipForward] Обновлен frameTime для текущего видео: ${frameTime} (${1 / frameTime} fps)`,
      )
    }

    // Вычисляем новое время
    const newTime = Math.min(maxTime, currentTime + frameTime)
    console.log(`[handleSkipForward] Перемещение на один кадр вперед: ${currentTime} -> ${newTime}`)

    // Устанавливаем новое время и останавливаем воспроизведение
    setCurrentTime(newTime)
    setIsPlaying(false)
  }, [video, currentTime, setCurrentTime, setIsPlaying, activeTrackId, tracks])

  /**
   * Функция для перемещения в начало видео или трека
   */
  const handleChevronFirst = useCallback(() => {
    if (!video) return

    // Если есть активный трек, используем его
    if (activeTrackId) {
      // Находим активный трек
      const activeTrack = tracks.find((track) => track.id === activeTrackId)
      if (activeTrack) {
        // Находим первое видео в треке
        const firstVideo = activeTrack.videos?.[0]
        if (firstVideo) {
          const startTime = firstVideo.startTime || 0
          if (Math.abs(currentTime - startTime) < 0.01) return

          console.log(`[handleChevronFirst] Перемещение в начало трека: ${startTime}`)
          setCurrentTime(startTime)
          setIsPlaying(false)
          return
        }
      }
    }

    // Если нет активного трека или в треке нет видео, используем текущее видео
    const videoStartTime = video.startTime || 0
    if (Math.abs(currentTime - videoStartTime) < 0.01) return

    console.log(`[handleChevronFirst] Перемещение в начало видео: ${videoStartTime}`)
    setCurrentTime(videoStartTime)
    setIsPlaying(false)
  }, [video, activeTrackId, tracks, currentTime, setCurrentTime, setIsPlaying])

  /**
   * Функция для перемещения в конец видео или трека
   */
  const handleChevronLast = useCallback(() => {
    if (!video) return

    // Если есть активный трек, используем его
    if (activeTrackId) {
      // Находим активный трек
      const activeTrack = tracks.find((track) => track.id === activeTrackId)
      if (activeTrack && activeTrack.videos && activeTrack.videos.length > 0) {
        // Находим последнее видео в треке
        const lastVideo = activeTrack.videos[activeTrack.videos.length - 1]
        if (lastVideo) {
          const startTime = lastVideo.startTime || 0
          const duration = lastVideo.duration || 0
          const endTime = startTime + duration

          if (Math.abs(currentTime - endTime) < 0.01) return

          console.log(`[handleChevronLast] Перемещение в конец трека: ${endTime}`)
          setCurrentTime(endTime)
          setIsPlaying(false)
          return
        }
      }
    }

    // Если нет активного трека или в треке нет видео, используем текущее видео
    const videoStartTime = video.startTime || 0
    const videoDuration = video.duration || 0
    const videoEndTime = videoStartTime + videoDuration

    if (Math.abs(currentTime - videoEndTime) < 0.01) return

    console.log(`[handleChevronLast] Перемещение в конец видео: ${videoEndTime}`)
    setCurrentTime(videoEndTime)
    setIsPlaying(false)
  }, [video, activeTrackId, tracks, currentTime, setCurrentTime, setIsPlaying])

  /**
   * Функция для воспроизведения/паузы
   */
  const handlePlayPause = useCallback(() => {
    // Проверяем, есть ли активное видео или видео в шаблоне или параллельные видео
    const hasActiveVideo = !!video
    const hasTemplateVideos = appliedTemplate?.videos && appliedTemplate.videos.length > 0
    const hasParallelVideos = parallelVideos && parallelVideos.length > 0

    // Если нет ни активного видео, ни видео в шаблоне, ни параллельных видео, выходим
    if (!hasActiveVideo && !hasTemplateVideos && !hasParallelVideos) {
      console.log("[handlePlayPause] Нет видео для воспроизведения")
      return
    }

    // Если начинаем воспроизведение и есть активное видео, устанавливаем текущее время видео в displayTime
    if (!isPlaying && hasActiveVideo && video.id && videoRefs[video.id]) {
      const videoElement = videoRefs[video.id]

      // Если currentTime - это Unix timestamp, используем displayTime
      if (currentTime > 365 * 24 * 60 * 60) {
        videoElement.currentTime = calculatedDisplayTime
      }
    }

    // Проверяем готовность видео перед началом воспроизведения
    if (!isPlaying && hasActiveVideo && video.id && videoRefs[video.id]) {
      const videoElement = videoRefs[video.id]

      // Проверяем готовность видео
      if (videoElement.readyState < 3) {
        // Показываем индикатор загрузки
        // Это можно реализовать через состояние в контексте плеера, если нужно
      }
    }

    // В любом случае переключаем состояние воспроизведения
    setIsPlaying(!isPlaying)
  }, [
    isPlaying,
    setIsPlaying,
    video,
    videoRefs,
    currentTime,
    calculatedDisplayTime,
    appliedTemplate,
    parallelVideos,
  ])

  return {
    handleSkipBackward,
    handleSkipForward,
    handleChevronFirst,
    handleChevronLast,
    handlePlayPause,
  }
}
