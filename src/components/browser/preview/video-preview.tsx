import { Film } from "lucide-react"
import { memo, useCallback, useRef, useState, useEffect } from "react"

import { formatDuration, formatResolution } from "@/lib/utils"
import { MediaFile } from "@/types/media"
import { calculateAdaptiveWidth,calculateWidth, parseRotation } from "@/utils/video-utils"

import { PreviewTimeline } from ".."
import { AddMediaButton } from "./add-media-button"

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
    videoStreams.forEach(stream => {
      if (!videoRefs.current[`stream-${stream.index}`]) {
        videoRefs.current[`stream-${stream.index}`] = null
      }
    })
  }, [file.probeData?.streams])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, streamIndex: number) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percentage = x / rect.width
      const newTime = percentage * (file.duration || 0)
      setHoverTime(newTime)

      const videoRef = videoRefs.current[`stream-${streamIndex}`]
      if (videoRef) {
        console.log("Setting time:", newTime, "for stream:", streamIndex)
        videoRef.currentTime = newTime
      }
    },
    [file.duration],
  )

  const handleMouseLeave = useCallback(() => {
    setHoverTime(null)
    // При уходе мыши останавливаем воспроизведение
    if (videoRefs.current[`stream-0`] && isPlaying) {
      videoRefs.current[`stream-0`]?.pause()
      setIsPlaying(false)
    }
  }, [isPlaying])

  const handleMouseEnter = useCallback(() => {
    // При входе мыши ничего не делаем с воспроизведением
    // Оно будет начинаться только по клику
  }, [])

  const handlePlayPause = useCallback(
    (e: React.MouseEvent, streamIndex: number) => {
      e.preventDefault()
      const videoRef = videoRefs.current[`stream-${streamIndex}`]
      if (!videoRef) return

      console.log("Play/Pause clicked for stream:", streamIndex, "current state:", isPlaying)

      if (isPlaying) {
        videoRef.pause()
      } else {
        if (hoverTime !== null) {
          videoRef.currentTime = hoverTime
        }
        videoRef.play()
      }
      setIsPlaying(!isPlaying)
    },
    [isPlaying, hoverTime],
  )

  return (
    <>
      <div className="flex items-center justify-center w-full h-full">
        {file.probeData?.streams
          ?.filter((stream) => stream.codec_type === "video")
          .map((stream, index) => {

            const videoStreams =
              file.probeData?.streams?.filter((s) => s.codec_type === "video") ?? []
            const isMultipleStreams = videoStreams?.length > 1
            const width = calculateWidth(
              stream.width || 0,
              stream.height || 0,
              size,
              parseRotation(stream.rotation),
              videoStreams?.length || 1,
            )

            const adptivedWidth = calculateAdaptiveWidth(
              width,
              isMultipleStreams,
              stream.display_aspect_ratio,
            )
            const [w, h] = stream.display_aspect_ratio?.split(":").map(Number)
            const ratio = w / h

            return (
              <div
                key={stream.index}
                className="flex-shrink-0 relative"
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
                onClick={(e) => handlePlayPause(e, index)}
              >
                <div
                  className="relative w-full h-full"
                  onMouseMove={(e) => handleMouseMove(e, index)}
                  onMouseLeave={handleMouseLeave}
                  onMouseEnter={handleMouseEnter}
                >
                  <video
                    ref={(el) => {
                      const refKey = `stream-${stream.index}`
                      videoRefs.current[refKey] = el
                    }}
                    src={`${file.path}#t=${stream.index}`}
                    preload="auto"
                    tabIndex={0}
                    playsInline
                    className="absolute inset-0 w-full h-full focus:outline-none"
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
                        handlePlayPause(e as unknown as React.MouseEvent, stream.index)
                      }
                    }}
                    onLoadedData={() => {
                      console.log("Video loaded for stream:", stream.index)
                      setIsLoaded(true)
                    }}
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
                  {!hideTime && !(isMultipleStreams && index === 0) && (
                    <div
                      className={`absolute text-xs pointer-events-none leading-[16px] ${
                        size > 100 ? "right-1 top-1" : "right-0.5 top-0.5"
                      } text-white bg-black/50 rounded-xs ${
                        size > 100 ? "px-[4px] py-[2px]" : "px-[2px] py-0"
                      }`}
                    >
                      {formatDuration(file.duration || 0, 0, true)}
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
                      videoRef={videoRefs.current[`stream-${stream.index}`]}
                    />
                  )}

                  {/* Имя файла */}
                  {showFileName && !(isMultipleStreams && index !== 0) && (
                    <div
                      className={`absolute font-medium ${size > 100 ? "top-1" : "top-0.5"} ${
                        size > 100 ? "left-1" : "left-0.5"
                      } ${
                        size > 100 ? "px-[4px] py-[2px]" : "px-[2px] py-0"
                      } text-xs bg-black/50 text-white rounded-xs leading-[16px] line-clamp-1 ${isMultipleStreams ? "max-w-[100%]" : "max-w-[60%]"}`}
                    >
                      {file.name}
                    </div>
                  )}

                  {/* Кнопка добавления */}
                  {onAddMedia &&
                    isLoaded &&
                    index ===
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
    </>
  )
})
