import { Film } from "lucide-react"
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"

import { cn, formatDuration, formatResolution } from "@/lib/utils"
import { calculateAdaptiveWidth, calculateWidth, parseRotation } from "@/lib/video-utils"
import {
  stopAllVideos,
  stopAllVideosExceptActive,
} from "@/media-editor/browser/services/video-control"
import { usePlayerContext } from "@/media-editor/media-player"
import { FfprobeStream } from "@/types/ffprobe"
import { MediaFile } from "@/types/media"

import { AddMediaButton } from "../layout/add-media-button"
import { FavoriteButton } from "../layout/favorite-button"

interface VideoPreviewProps {
  file: MediaFile
  onAddMedia?: (e: React.MouseEvent, file: MediaFile) => void
  isAdded?: boolean
  size?: number
  showFileName?: boolean
  hideTime?: boolean
  ignoreRatio?: boolean
}

/**
 * Предварительный просмотр видеофайла
 *
 * Функционал:
 * - Отображает превью видеофайла с поддержкой ленивой загрузки
 * - Адаптивный размер контейнера с соотношением сторон 16:9
 * - Поддерживает два размера UI (стандартный и большой при size > 100)
 * - Опциональное отображение имени файла
 * - Кнопка добавления с состояниями (добавлено/не добавлено)
 * - Темная тема для UI элементов
 *
 * @param file - Объект файла с путем и метаданными
 * @param onAddMedia - Callback для добавления файла
 * @param isAdded - Флаг, показывающий добавлен ли файл
 * @param size - Размер превью в пикселях (по умолчанию 60)
 * @param showFileName - Флаг для отображения имени файла (по умолчанию false)
 * @param hideTime - Флаг для скрытия времени (по умолчанию false)

 * @param ignoreRatio - Флаг для игнорирования соотношения сторон (по умолчанию false)
 */
export const VideoPreview = memo(function VideoPreview({
  file,
  onAddMedia,
  isAdded,
  size = 60,
  showFileName = false,
  hideTime = false,
  ignoreRatio = false,
}: VideoPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [hoverTime, setHoverTime] = useState<number | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({})

  // Используем useRef для хранения времени последнего обновления
  const lastUpdateTimeRef = useRef(0)

  // Функции для условного логирования
  const logDebug = (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV !== "production") {
      // console.log(message, ...args)
    }
  }

  const logError = (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV !== "production") {
      console.error(message, ...args)
    }
  }

  // Создаем стабильные ключи для рефов
  useEffect(() => {
    const videoStreams = file.probeData?.streams?.filter((s) => s.codec_type === "video") ?? []
    videoStreams.forEach((stream) => {
      const key = stream.streamKey || `stream-${stream.index}`
      if (!videoRefs.current[key]) {
        videoRefs.current[key] = null
      }
    })
  }, [file.probeData?.streams])

  // Используем useRef для хранения hoverTime вместо useState
  // чтобы избежать ререндеров при движении мыши
  const hoverTimeRef = useRef<number | null>(null)

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, stream: FfprobeStream) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percentage = x / rect.width
      const newTime = percentage * (file.duration || 0)

      // Обновляем ref и состояние при каждом движении мыши
      hoverTimeRef.current = newTime
      // Обновляем состояние без задержки
      setHoverTime(newTime)

      const key = stream.streamKey || `stream-${stream.index}`
      const videoRef = videoRefs.current[key]
      if (videoRef) {
        // Устанавливаем время напрямую без лишних логов
        videoRef.currentTime = newTime
      }
    },
    [file.duration], // Удалили hoverTime из зависимостей, так как он не используется для условной проверки
  )

  const handleMouseLeave = useCallback(() => {
    setHoverTime(null)
    // При уходе мыши останавливаем воспроизведение всех видео, кроме видео в шаблоне
    if (isPlaying) {
      stopAllVideos(true)
      setIsPlaying(false)
    }
  }, [isPlaying])

  // Получаем контекст плеера
  const playerContext = usePlayerContext()

  // Единый механизм синхронизации через контекст плеера
  useEffect(() => {
    // Получаем текущее состояние воспроизведения из медиаплеера
    const playerIsPlaying = playerContext.isPlaying
    const playerActiveVideoId = playerContext.activeVideoId
    const playerPreferredSource = playerContext.preferredSource
    const playerCurrentTime = playerContext.currentTime
    const playerVolume = playerContext.volume

    // Если активное видео в медиаплеере совпадает с текущим видео в превью
    // и источник установлен на "media" (браузер), синхронизируем состояние
    if (playerActiveVideoId === file.id && playerPreferredSource === "media") {
      // Проверяем, нужно ли обновлять состояние воспроизведения
      const needToPlay = playerIsPlaying && !isPlaying
      const needToPause = !playerIsPlaying && isPlaying

      // Для каждого видео в превью
      Object.keys(videoRefs.current).forEach((key) => {
        const videoRef = videoRefs.current[key]
        if (!videoRef) return

        // Синхронизируем текущее время, если оно предоставлено и существенно отличается
        if (
          playerCurrentTime !== undefined &&
          playerCurrentTime > 0 &&
          Math.abs(videoRef.currentTime - playerCurrentTime) > 0.5
        ) {
          videoRef.currentTime = playerCurrentTime
        }

        // Синхронизируем громкость
        if (playerVolume !== undefined && videoRef.volume !== playerVolume) {
          videoRef.volume = playerVolume
        }

        // Синхронизируем состояние воспроизведения
        if (needToPlay) {
          // Запускаем воспроизведение в превью
          videoRef.play().catch((err) => console.error("Ошибка воспроизведения в превью:", err))
        } else if (needToPause) {
          // Останавливаем воспроизведение в превью
          videoRef.pause()
        }
      })

      // Обновляем локальное состояние только если оно изменилось
      if (needToPlay) {
        setIsPlaying(true)
      } else if (needToPause) {
        setIsPlaying(false)
      }
    }
  }, [
    playerContext.isPlaying,
    playerContext.activeVideoId,
    playerContext.preferredSource,
    playerContext.currentTime,
    playerContext.volume,
    file.id,
    isPlaying,
  ])

  // Больше не используем настройку поведения при клике на превью, так как всегда воспроизводим только в превью

  // Функция handlePlayPause, которая управляет воспроизведением только в превью
  const handlePlayPause = useCallback(
    (e: React.MouseEvent, stream: FfprobeStream) => {
      e.preventDefault()
      const key = stream.streamKey || `stream-${stream.index}`
      const videoRef = videoRefs.current[key]
      if (!videoRef) return

      logDebug(
        "[VideoPreview] Play/Pause clicked for stream:",
        stream.index,
        "current state:",
        isPlaying,
      )

      // Определяем новое состояние воспроизведения (противоположное текущему)
      const newPlayingState = !isPlaying

      // Воспроизводим только в превью
      if (newPlayingState) {
        // Запускаем воспроизведение в превью
        if (hoverTime !== null) {
          videoRef.currentTime = hoverTime
        }
        videoRef
          .play()
          .catch((err) => console.error("[VideoPreview] Ошибка воспроизведения в превью:", err))
      } else {
        // Останавливаем воспроизведение в превью
        videoRef.pause()
      }

      // Обновляем локальное состояние воспроизведения
      setIsPlaying(newPlayingState)

      // Останавливаем все другие видео в превью, кроме текущего
      if (newPlayingState) {
        stopAllVideosExceptActive(file.id)
      }

      logDebug(
        `[VideoPreview] Видео ${newPlayingState ? "запущено" : "остановлено"} в превью:`,
        file.name,
      )
    },
    [isPlaying, hoverTime, file],
  )

  // Функция для получения URL видео
  const getVideoUrl = useCallback(() => {
    // Просто возвращаем путь к файлу
    return file.path
  }, [file])

  // Оптимизируем вычисления с помощью useMemo
  const videoData = useMemo(() => {
    const videoStreams = file.probeData?.streams?.filter((s) => s.codec_type === "video") ?? []
    const isMultipleStreams = videoStreams?.length > 1

    return { videoStreams, isMultipleStreams }
  }, [file.probeData?.streams])

  return (
    <div className={cn("flex h-full w-full items-center justify-center")}>
      {videoData.videoStreams.map((stream: FfprobeStream) => {
        const key = stream.streamKey || `stream-${stream.index}`
        const isMultipleStreams = videoData.isMultipleStreams
        const width = calculateWidth(
          stream.width || 0,
          stream.height || 0,
          size,
          parseRotation(stream.rotation),
        )

        const adptivedWidth = calculateAdaptiveWidth(
          width,
          isMultipleStreams,
          stream.display_aspect_ratio,
        )

        // Исправляем проблему с деструктуризацией
        const aspectRatio = stream.display_aspect_ratio?.split(":").map(Number) || [16, 9]
        const ratio = aspectRatio[0] / aspectRatio[1]

        return (
          <div
            key={key}
            className="relative flex-shrink-0"
            style={{
              height: `${size}px`,
              width:
                ratio > 1
                  ? ignoreRatio
                    ? width
                    : adptivedWidth
                  : isMultipleStreams && ignoreRatio
                    ? width
                    : adptivedWidth,
            }}
            onClick={(e) => handlePlayPause(e, stream)}
          >
            <div
              className="group relative h-full w-full"
              onMouseMove={(e) => handleMouseMove(e, stream)}
              onMouseLeave={handleMouseLeave}
            >
              <video
                ref={(el) => {
                  videoRefs.current[key] = el
                }}
                src={getVideoUrl()}
                preload="auto"
                tabIndex={0}
                playsInline
                muted={false} // Включаем звук в превью по запросу пользователя
                data-video-id={file.id} // Добавляем атрибут с ID видео для возможности остановки всех видео, кроме активного
                className={cn(
                  "absolute inset-0 h-full w-full focus:outline-none",
                  isAdded ? "opacity-50" : "",
                )}
                style={{
                  transition: "opacity 0.2s ease-in-out",
                }}
                onEnded={() => {
                  logDebug("Video ended for stream:", stream.index)
                  setIsPlaying(false)
                }}
                onPlay={(e) => {
                  logDebug("Video playing for stream:", stream.index)
                  const video = e.currentTarget
                  const currentTime = hoverTime
                  if (currentTime !== undefined && currentTime !== null) {
                    video.currentTime = currentTime
                  }
                }}
                onTimeUpdate={(e) => {
                  // Обновляем только каждые 500 мс вместо случайного выбора
                  const now = Date.now()
                  if (now - lastUpdateTimeRef.current > 500) {
                    lastUpdateTimeRef.current = now
                    logDebug(
                      "Time update for stream:",
                      stream.index,
                      "current time:",
                      e.currentTarget.currentTime.toFixed(2),
                    )
                  }
                }}
                onError={(e) => {
                  logError("Video error for stream:", stream.index, e)
                }}
                onKeyDown={(e) => {
                  if (e.code === "Space") {
                    e.preventDefault()
                    handlePlayPause(e as unknown as React.MouseEvent, stream)
                  }
                }}
                onLoadedData={() => {
                  logDebug("Video loaded for stream:", stream.index)
                  setIsLoaded(true)

                  // Добавляем видео в глобальный кэш для повторного использования в шаблонах
                  if (typeof window !== "undefined") {
                    // Инициализируем кэш, если он еще не создан
                    if (!window.videoElementCache) {
                      window.videoElementCache = new Map()
                    }

                    // Добавляем видео в кэш по ID файла
                    if (window.videoElementCache && videoRefs.current[key]) {
                      const videoElement = videoRefs.current[key]
                      // Используем ID файла как ключ для кэша
                      window.videoElementCache.set(file.id, videoElement)
                      logDebug(
                        `[VideoPreview] Видео ${file.id} добавлено в глобальный кэш для повторного использования`,
                      )
                    }
                  }
                }}
              />

              {/* Продолжительность видео */}
              {!hideTime && !(isMultipleStreams && stream.index === 0) && (
                <div
                  className={cn(
                    "pointer-events-none absolute rounded-xs bg-black/50 text-xs leading-[16px] text-white",
                    size > 100
                      ? "top-1 right-1 px-[4px] py-[2px]"
                      : "top-0.5 right-0.5 px-0.5 py-0",
                  )}
                  style={{
                    fontSize: size > 100 ? "13px" : "11px",
                  }}
                >
                  {formatDuration(file.duration || 0, 0, true)}
                </div>
              )}

              {/* Иконка видео */}
              {!(isMultipleStreams && stream.index !== 0) && (
                <div
                  className={cn(
                    "pointer-events-none absolute rounded-xs bg-black/50 p-0.5 text-white",
                    size > 100 ? "bottom-1 left-1" : "bottom-0.5 left-0.5",
                  )}
                >
                  <Film size={size > 100 ? 16 : 12} />
                </div>
              )}

              {/* Кнопка избранного */}
              {!(isMultipleStreams && stream.index !== 0) && (
                <FavoriteButton file={file} size={size} type="media" />
              )}

              {/* Разрешение видео */}
              {isLoaded && !(isMultipleStreams && stream.index !== 0) && (
                <div
                  className={`pointer-events-none absolute ${
                    size > 100 ? "left-[28px]" : "left-[22px]"
                  } rounded-xs bg-black/50 text-xs leading-[16px] ${size > 100 ? "bottom-1" : "bottom-0.5"} ${
                    size > 100 ? "px-[4px] py-[2px]" : "px-[2px] py-0"
                  } text-white`}
                  style={{
                    fontSize: size > 100 ? "13px" : "11px",
                  }}
                >
                  {formatResolution(stream.width || 0, stream.height || 0)}
                </div>
              )}

              {/* Имя файла */}
              {showFileName && !(isMultipleStreams && stream.index !== 0) && (
                <div
                  className={`absolute font-medium ${size > 100 ? "top-1" : "top-0.5"} ${
                    size > 100 ? "left-1" : "left-0.5"
                  } ${
                    size > 100 ? "px-[4px] py-[2px]" : "px-[2px] py-0"
                  } line-clamp-1 rounded-xs bg-black/50 text-xs leading-[16px] text-white ${isMultipleStreams ? "max-w-[100%]" : "max-w-[60%]"}`}
                  style={{
                    fontSize: size > 100 ? "13px" : "11px",
                  }}
                >
                  {file.name}
                </div>
              )}

              {/* Кнопка добавления */}
              {onAddMedia &&
                isLoaded &&
                stream.index ===
                  (file.probeData?.streams?.filter((s) => s.codec_type === "video")?.length || 0) -
                    1 && (
                <AddMediaButton
                  file={file}
                  onAddMedia={onAddMedia}
                  isAdded={isAdded}
                  size={size}
                />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
})
