import { Film } from "lucide-react"
import { memo, useCallback, useRef, useState } from "react"

import { formatDuration, formatResolution } from "@/lib/utils"
import { MediaFile } from "@/types/media"
import { isHorizontalVideo } from "@/utils/media-utils"
import { calculateWidth, parseRotation } from "@/utils/video-utils"

import { PreviewTimeline } from ".."
import { AddMediaButton } from "./add-media-button"

interface VideoPreviewProps {
  file: MediaFile
  onAddMedia?: (e: React.MouseEvent, file: MediaFile) => void
  isAdded?: boolean
  size?: number
  showFileName?: boolean
  hideTime?: boolean
  /** Соотношение сторон контейнера [ширина, высота], по умолчанию [16, 9] */
  dimensions?: [number, number]
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
 * @param dimensions - Соотношение сторон контейнера [ширина, высота], по умолчанию [16, 9]
 */
export const VideoPreview = memo(function VideoPreview({
  file,
  onAddMedia,
  isAdded,
  size = 60,
  showFileName = false,
  hideTime = false,
  dimensions,
}: VideoPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [hoverTime, setHoverTime] = useState<number | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percentage = x / rect.width
      const newTime = percentage * (file.duration || 0)
      setHoverTime(newTime)

      // Только обновляем время без остановки воспроизведения
      if (videoRef.current) {
        videoRef.current.currentTime = newTime
      }
    },
    [file.duration],
  )

  const handleMouseLeave = useCallback(() => {
    setHoverTime(null)
    // При уходе мыши останавливаем воспроизведение
    if (videoRef.current && isPlaying) {
      videoRef.current.pause()
      setIsPlaying(false)
    }
  }, [isPlaying])

  const handleMouseEnter = useCallback(() => {
    // При входе мыши ничего не делаем с воспроизведением
    // Оно будет начинаться только по клику
  }, [])

  const handlePlayPause = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      if (!videoRef.current) return

      if (isPlaying) {
        videoRef.current.pause()
      } else {
        if (hoverTime !== null) {
          videoRef.current.currentTime = hoverTime
        }
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    },
    [isPlaying, hoverTime],
  )

  return (
    <>
      {file.probeData?.streams
        ?.filter((stream) => stream.codec_type === "video")
        .map((stream, index) => (
          <div
            key={index}
            className="flex-shrink-0 relative"
            style={{
              height: `${size}px`,
              width: `${calculateWidth(
                stream.width || 0,
                stream.height || 0,
                size,
                parseRotation(stream.rotation),
              )}px`,
            }}
            onClick={handlePlayPause}
          >
            <div
              className="relative w-full h-full"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onMouseEnter={handleMouseEnter}
            >
              <video
                ref={videoRef}
                src={file.lrv?.path || file.proxy?.path || file.path}
                preload="auto"
                tabIndex={0}
                playsInline
                className="absolute inset-0 w-full h-full object-cover focus:outline-none"
                style={{
                  transition: "opacity 0.2s ease-in-out",
                }}
                onEnded={() => {
                  setIsPlaying(false)
                }}
                onPlay={(e) => {
                  const video = e.currentTarget
                  const currentTime = hoverTime
                  if (currentTime !== undefined && currentTime !== null) {
                    video.currentTime = currentTime
                  }
                }}
                onError={(e) => {
                  console.error("Video error:", e)
                }}
                onKeyDown={(e) => {
                  if (e.code === "Space") {
                    e.preventDefault()
                    handlePlayPause(e as unknown as React.MouseEvent)
                  }
                }}
                onLoadedData={() => setIsLoaded(true)}
              />

              {/* Номер в серии потоков если их больше одного */}
              {file.probeData?.streams &&
                file.probeData.streams.filter((s) => s.codec_type === "video").length > 1 && (
                <div
                  className={`absolute text-xs pointer-events-none leading-[16px] ${
                    size > 100
                      ? "bottom-1 left-[58px]"
                      : size < 100
                        ? "hidden"
                        : "bottom-0.5 left-[42px]"
                  } text-white bg-black/50 rounded-xs ${
                    size > 100 ? "px-[4px] py-[2px]" : "px-[2px] py-0"
                  }`}
                >
                  {stream.index + 1}
                </div>
              )}

              {/* Продолжительность видео */}
              {!hideTime && (
                <div
                  className={`absolute text-xs pointer-events-none leading-[16px] ${
                    size > 100 ? "right-1 top-1" : "right-0.5 top-0.5"
                  } text-white bg-black/50 rounded-xs ${
                    size > 100 ? "px-[4px] py-[2px]" : "px-[2px] py-0"
                  }`}
                >
                  {formatDuration(file.duration || 0)}
                </div>
              )}

              {/* Иконка видео */}
              <div
                className={`absolute pointer-events-none ${
                  size > 100 ? "left-1 bottom-1" : "left-0.5 bottom-0.5"
                } text-white bg-black/50 rounded-xs p-0.5`}
              >
                <Film size={size > 100 ? 16 : 12} />
              </div>

              {/* Разрешение видео */}
              {isLoaded && (
                <div
                  className={`absolute pointer-events-none ${
                    size > 100 ? "left-[28px]" : "left-[22px]"
                  } bg-black/50 text-xs leading-[16px] rounded-xs ${size > 100 ? "bottom-1" : "bottom-0.5"} ${
                    size > 100 ? "px-[4px] py-[2px]" : "px-[2px] py-0"
                  } mr-0.5 text-white`}
                  style={{
                    fontSize: size > 100 ? "14px" : "12px",
                  }}
                >
                  {formatResolution(stream.width || 0, stream.height || 0)}
                </div>
              )}

              {/* Таймлайн видео */}
              {hoverTime !== null && Number.isFinite(hoverTime) && (
                <PreviewTimeline
                  time={hoverTime}
                  duration={file.duration || 0}
                  videoRef={videoRef.current}
                />
              )}

              {/* Имя файла */}
              {showFileName && (
                <div
                  className={`absolute font-medium ${size > 100 ? "top-1" : "top-0.5"} ${
                    size > 100 ? "left-1" : "left-0.5"
                  } ${
                    size > 100 ? "px-[4px] py-[2px]" : "px-[2px] py-0"
                  } text-xs bg-black/50 text-white rounded-xs leading-[16px] line-clamp-1 max-w-[calc(60%)]`}
                >
                  {file.name}
                </div>
              )}

              {/* Кнопка добавления */}
              {onAddMedia && isLoaded && (
                <AddMediaButton file={file} onAddMedia={onAddMedia} isAdded={isAdded} size={size} />
              )}
            </div>
          </div>
        ))}
    </>
  )
})
