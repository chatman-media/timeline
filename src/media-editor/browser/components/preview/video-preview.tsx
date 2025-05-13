import { Film } from "lucide-react"
import { memo, useCallback, useEffect, useRef, useState } from "react"

import { cn, formatDuration, formatResolution } from "@/lib/utils"
import { calculateAdaptiveWidth, calculateWidth, parseRotation } from "@/lib/video-utils"
import { usePlayerContext } from "@/media-editor/media-player"
import { FfprobeStream } from "@/types/ffprobe"
import { MediaFile } from "@/types/media"

import { PreviewTimeline } from ".."
import { AddMediaButton } from "../layout/add-media-button"
import { FavoriteButton } from "../layout/favorite-button"

interface VideoPreviewProps {
  file: MediaFile
  onAddMedia?: (e: React.MouseEvent, file: MediaFile) => void
  isAdded?: boolean
  size?: number
  showFileName?: boolean
  hideTime?: boolean
  dimensions?: [number, number]
  ignoreRatio?: boolean
}

const ICON_SIZES = [3.5, 4, 5]

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
 * @param dimensions - Фиксированное соотношение сторон контейнера [ширина, высота], по умолчанию [16, 9]
 * @param ignoreRatio - Флаг для игнорирования соотношения сторон (по умолчанию false)
 */
export const VideoPreview = memo(function VideoPreview({
  file,
  onAddMedia,
  isAdded,
  size = 60,
  showFileName = false,
  hideTime = false,
  dimensions,
  ignoreRatio = false,
}: VideoPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [hoverTime, setHoverTime] = useState<number | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({})

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

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, stream: FfprobeStream) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percentage = x / rect.width
      const newTime = percentage * (file.duration || 0)
      setHoverTime(newTime)

      const key = stream.streamKey || `stream-${stream.index}`
      const videoRef = videoRefs.current[key]
      if (videoRef) {
        // console.log("Setting time:", newTime, "for stream:", stream.index)
        videoRef.currentTime = newTime
      }
    },
    [file.duration],
  )

  const handleMouseLeave = useCallback(() => {
    setHoverTime(null)
    // При уходе мыши останавливаем воспроизведение
    const firstStreamKey = Object.keys(videoRefs.current)[0]
    if (videoRefs.current[firstStreamKey] && isPlaying) {
      videoRefs.current[firstStreamKey]?.pause()
      setIsPlaying(false)
    }
  }, [isPlaying])

  // Получаем контекст плеера
  const playerContext = usePlayerContext()

  // Синхронизируем состояние воспроизведения с медиаплеером
  useEffect(() => {
    // Получаем текущее состояние воспроизведения из медиаплеера
    const playerIsPlaying = playerContext.isPlaying
    const playerActiveVideoId = playerContext.activeVideoId
    const playerPreferredSource = playerContext.preferredSource

    // Если активное видео в медиаплеере совпадает с текущим видео в превью
    // и источник установлен на "media" (браузер), синхронизируем состояние воспроизведения
    if (playerActiveVideoId === file.id && playerPreferredSource === "media") {
      // Проверяем, нужно ли обновлять состояние
      const needToPlay = playerIsPlaying && !isPlaying
      const needToPause = !playerIsPlaying && isPlaying

      // Обновляем только если состояние действительно изменилось
      if (needToPlay || needToPause) {
        // Для каждого видео в превью
        Object.keys(videoRefs.current).forEach((key) => {
          const videoRef = videoRefs.current[key]
          if (!videoRef) return

          // Синхронизируем состояние воспроизведения
          if (needToPlay) {
            // Запускаем воспроизведение в превью
            videoRef.play().catch((err) => console.error("Ошибка воспроизведения в превью:", err))
          } else if (needToPause) {
            // Останавливаем воспроизведение в превью
            videoRef.pause()
          }
        })

        // Обновляем состояние только один раз после всех операций с видео
        if (needToPlay) {
          console.log("[VideoPreview] Синхронизация: запускаем воспроизведение в превью")
          setIsPlaying(true)
        } else if (needToPause) {
          console.log("[VideoPreview] Синхронизация: останавливаем воспроизведение в превью")
          setIsPlaying(false)
        }
      }
    }
  }, [
    playerContext.isPlaying,
    playerContext.activeVideoId,
    playerContext.preferredSource,
    file.id,
    isPlaying,
  ])

  // Функция handlePlayPause, которая управляет воспроизведением в превью и отправляет видео в медиаплеер
  const handlePlayPause = useCallback(
    (e: React.MouseEvent, stream: FfprobeStream) => {
      e.preventDefault()
      const key = stream.streamKey || `stream-${stream.index}`
      const videoRef = videoRefs.current[key]
      if (!videoRef) return

      console.log("Play/Pause clicked for stream:", stream.index, "current state:", isPlaying)

      // Определяем новое состояние воспроизведения (противоположное текущему)
      const newPlayingState = !isPlaying

      // Управляем воспроизведением в превью
      if (newPlayingState) {
        // Запускаем воспроизведение в превью
        if (hoverTime !== null) {
          videoRef.currentTime = hoverTime
        }
        videoRef.play().catch((err) => console.error("Ошибка воспроизведения в превью:", err))
      } else {
        // Останавливаем воспроизведение в превью
        videoRef.pause()
      }

      // Обновляем локальное состояние воспроизведения
      setIsPlaying(newPlayingState)

      // Используем requestAnimationFrame вместо setTimeout для более надежной работы
      // Это позволяет избежать бесконечного цикла обновлений
      requestAnimationFrame(() => {
        try {
          // Проверяем, что контекст плеера доступен
          if (!playerContext) {
            console.error("[VideoPreview] Контекст плеера недоступен")
            return
          }

          // Устанавливаем предпочтительный источник "media" (браузер)
          playerContext.setPreferredSource("media")

          // Устанавливаем текущее видео как активное в плеере
          playerContext.setVideo(file)

          // Добавляем видео в список параллельных видео (если нужно)
          // Используем только необходимые обновления состояния
          if (playerContext.activeVideoId !== file.id) {
            playerContext.setActiveVideoId(file.id)
            playerContext.setParallelVideos([file])
          }

          // Синхронизируем состояние воспроизведения с медиаплеером
          // только если оно отличается от текущего
          if (playerContext.isPlaying !== newPlayingState) {
            playerContext.setIsPlaying(newPlayingState)
          }

          console.log(
            `[VideoPreview] Видео ${newPlayingState ? "запущено" : "остановлено"} в медиаплеере:`,
            file.name,
          )
        } catch (error) {
          console.error("[VideoPreview] Ошибка при обновлении состояния плеера:", error)
        }
      })
    },
    [isPlaying, hoverTime, file, playerContext],
  )

  // Функция для получения URL видео для конкретного потока
  const getVideoUrl = useCallback(
    (stream: FfprobeStream) => {
      // Для INSV файлов с массивом прокси
      // if (file.name.toLowerCase().endsWith(".insv") && Array.isArray(file.proxies)) {
      //   const proxyForStream = file.proxies.find((p) => p.streamKey === stream.streamKey)
      //   if (proxyForStream && proxyForStream.path) {
      //     // Проверяем, существует ли прокси
      //     const proxyUrl = proxyForStream.path
      //     const video = videoRefs.current[stream.streamKey || `stream-${stream.index}`]
      //     if (video) {
      //       // Пробуем загрузить прокси
      //       video.src = proxyUrl
      //       video.onerror = () => {
      //         // Если прокси не загрузился, используем оригинал
      //         video.src = file.path
      //       }
      //     }
      //     return proxyUrl
      //   }
      //   return file.path
      // }

      // Для обычных файлов с одним прокси
      // if (file.proxy?.path) {
      //   const proxyUrl = file.proxy.path
      //   const video = videoRefs.current["default"]
      //   if (video) {
      //     // Пробуем загрузить прокси
      //     video.src = proxyUrl
      //     video.onerror = () => {
      //       // Если прокси не загрузился, используем оригинал
      //       video.src = file.path
      //     }
      //   }
      //   return proxyUrl
      // }

      // Для файлов без прокси
      return file.path
    },
    [file],
  )

  return (
    <div className={cn("flex h-full w-full items-center justify-center")}>
      {file.probeData?.streams
        ?.filter((stream) => stream.codec_type === "video")
        .map((stream) => {
          const key = stream.streamKey || `stream-${stream.index}`
          const videoStreams =
            file.probeData?.streams?.filter((s) => s.codec_type === "video") ?? []
          const isMultipleStreams = videoStreams?.length > 1
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
                  src={getVideoUrl(stream)}
                  preload="auto"
                  tabIndex={0}
                  playsInline
                  className={cn(
                    "absolute inset-0 h-full w-full focus:outline-none",
                    isAdded ? "opacity-50" : "",
                  )}
                  style={{
                    transition: "opacity 0.2s ease-in-out",
                  }}
                  onEnded={() => {
                    console.log("Video ended for stream:", stream.index)
                    setIsPlaying(false)
                  }}
                  onPlay={(e) => {
                    console.log("Video playing for stream:", stream.index)
                    const video = e.currentTarget
                    const currentTime = hoverTime
                    if (currentTime !== undefined && currentTime !== null) {
                      video.currentTime = currentTime
                    }
                  }}
                  onTimeUpdate={(e) => {
                    console.log(
                      "Time update for stream:",
                      stream.index,
                      "current time:",
                      e.currentTarget.currentTime,
                    )
                  }}
                  onError={(e) => {
                    console.error("Video error for stream:", stream.index, e)
                  }}
                  onKeyDown={(e) => {
                    if (e.code === "Space") {
                      e.preventDefault()
                      handlePlayPause(e as unknown as React.MouseEvent, stream)
                    }
                  }}
                  onLoadedData={() => {
                    console.log("Video loaded for stream:", stream.index)
                    setIsLoaded(true)
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
                    (file.probeData?.streams?.filter((s) => s.codec_type === "video")?.length ||
                      0) -
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
