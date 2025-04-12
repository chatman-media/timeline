import { Camera, Check, Plus } from "lucide-react"
import { memo, useState } from "react"

import { formatResolution } from "@/lib/utils"
import { FfprobeStream } from "@/types/ffprobe"
import { MediaFile } from "@/types/videos"
import { calculateRealDimensions, isHorizontalVideo } from "@/utils/media-utils"
import { getNextVolumeState, VolumeState } from "@/utils/video-utils"

import { Skeleton } from "../../ui/skeleton"
import { PreviewTimeline } from ".."

interface MediaPreviewProps {
  file: MediaFile
  fileId: string
  duration: number
  isAudio: boolean
  videoRefs: React.MutableRefObject<Record<string, HTMLVideoElement | null>>
  loadedVideos: Record<string, boolean>
  setLoadedVideos: (value: React.SetStateAction<Record<string, boolean>>) => void
  hoverTimes: Record<string, { [streamIndex: number]: number }>
  handleMouseMove: (
    e: React.MouseEvent<HTMLDivElement>,
    fileId: string,
    duration: number,
    streamIndex: number,
  ) => void
  handlePlayPause: (e: React.MouseEvent, file: MediaFile, streamIndex: number) => void
  handleMouseLeave: (fileId: string) => void
  setPlayingFileId: (id: string | null) => void
  onAddMedia?: (e: React.MouseEvent, file: MediaFile) => void
  isAdded?: boolean
  size?: number
  showFileName?: boolean
}

// Оборачиваем в memo для предотвращения ненужных рендеров
export const MediaPreview = memo(function MediaPreview({
  file,
  fileId,
  duration,
  isAudio,
  videoRefs,
  loadedVideos,
  setLoadedVideos,
  hoverTimes,
  handleMouseMove,
  handlePlayPause,
  handleMouseLeave,
  setPlayingFileId,
  onAddMedia,
  isAdded,
  size = 60,
  showFileName = false,
}: MediaPreviewProps) {
  // Преобразует rotation из string в number, или возвращает undefined
  const parseRotation = (rotation?: string | number): number | undefined => {
    if (rotation === undefined) return undefined
    if (typeof rotation === "number") return rotation
    const parsed = parseInt(rotation, 10)
    return isNaN(parsed) ? undefined : parsed
  }

  // Перемещаем функцию renderStreamIndicators внутрь компонента
  const renderStreamIndicators = (
    file: MediaFile,
    stream: FfprobeStream,
    index: number,
    isLoaded: boolean,
    videoRef: HTMLVideoElement | null,
  ) => {
    const [volume, setVolume] = useState<VolumeState>(VolumeState.FULL)

    const handleVolumeClick = (e: React.MouseEvent) => {
      e.stopPropagation()
      if (!videoRef) return

      const nextVolume = getNextVolumeState(volume)
      setVolume(nextVolume)
      videoRef.volume = nextVolume
    }

    const VolumeIcon = () => {
      if (volume === VolumeState.MUTED) {
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 18V5l12-2v13" />
            <line x1="1" y1="1" x2="23" y2="23" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        )
      }

      if (volume === VolumeState.HALF) {
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" opacity="0.5" />
            <circle cx="18" cy="16" r="3" opacity="0.5" />
          </svg>
        )
      }

      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      )
    }

    return (
      <>
        {file.probeData?.streams &&
          file.probeData.streams.filter((s) => s.codec_type === "video").length > 1 && (
          <div
            style={{ fontSize: "10px" }}
            className={`absolute left-[2px] top-[calc(50%-8px)] text-white bg-black/50 rounded px-[4px] py-0`}
          >
            {index + 1}
          </div>
        )}
        {file.probeData?.streams?.some((stream) => stream.codec_type === "audio") && (
          <div
            className={`absolute ${
              isHorizontalVideo(
                stream.width || 0,
                stream.height || 0,
                parseRotation(stream.rotation),
              )
                ? "right-[2px] top-[2px]"
                : "left-1/2 bottom-[2px] -translate-x-1/2"
            } text-white bg-black/50 rounded p-[2px] cursor-pointer hover:bg-black/70`}
            onClick={handleVolumeClick}
            title={
              volume === VolumeState.FULL
                ? "Приглушить"
                : volume === VolumeState.HALF
                  ? "Без звука"
                  : "Включить звук"
            }
          >
            <VolumeIcon />
          </div>
        )}
        {isLoaded && (
          <div
            style={{ fontSize: "10px" }}
            className={`absolute ${
              isHorizontalVideo(
                stream.width || 0,
                stream.height || 0,
                parseRotation(stream.rotation),
              )
                ? "right-[22px] top-[2px]"
                : "left-[calc(50%-8px)] top-[2px]"
            } bg-black/50 rounded px-[2px] py-0`}
          >
            {formatResolution(stream.width || 0, stream.height || 0)}
          </div>
        )}
      </>
    )
  }

  // Функция для создания снимка и сохранения на рабочий стол
  const captureScreenshot = (e: React.MouseEvent, streamIndex: number) => {
    e.stopPropagation()
    const videoElement = videoRefs.current[`${fileId}-${streamIndex}`]

    if (!videoElement) return

    try {
      // Создаем канвас размером с видео
      const canvas = document.createElement("canvas")
      canvas.width = videoElement.videoWidth
      canvas.height = videoElement.videoHeight

      // Рисуем текущий кадр на канвасе
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height)

      // Конвертируем канвас в блоб
      canvas.toBlob((blob) => {
        if (!blob) return

        // Создаем имя файла на основе исходного файла и текущего времени
        const timestamp = new Date().toISOString().replace(/:/g, "-")
        const originalName = file.name.replace(/\.[^/.]+$/, "") // Имя без расширения
        const fileName = `${originalName}_snapshot_${timestamp}.png`

        // Создаем ссылку для скачивания
        const link = document.createElement("a")
        link.href = URL.createObjectURL(blob)
        link.download = fileName

        // Добавляем невидимую ссылку в DOM, кликаем по ней и удаляем
        document.body.appendChild(link)
        link.click()

        // Небольшая задержка перед удалением ссылки
        setTimeout(() => {
          document.body.removeChild(link)
          URL.revokeObjectURL(link.href)
        }, 100)
      }, "image/png")
    } catch (error) {
      console.error("Ошибка при создании снимка:", error)
    }
  }

  if (isAudio) {
    return (
      <div
        className={`h-full flex-shrink-0 relative`}
        style={{ height: `${size}px`, width: `${size}px` }}
        onMouseMove={(e) => handleMouseMove(e, fileId, duration, 0)}
        onClick={(e) => handlePlayPause(e, file, 0)}
        onMouseLeave={() => handleMouseLeave(`${fileId}-0`)}
      >
        <div className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-gray-500 dark:text-gray-400"
          >
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        </div>
        <audio
          data-stream="0"
          ref={(el) => {
            if (el) videoRefs.current[`${fileId}-0`] = el as unknown as HTMLVideoElement
          }}
          src={file.path}
          preload="auto"
          loop
          tabIndex={0}
          className="focus:outline-none"
          onPlay={(e) => {
            const audio = e.currentTarget
            const currentTime = hoverTimes[fileId]?.[0]
            if (currentTime !== undefined && currentTime !== null) {
              audio.currentTime = currentTime
            }
          }}
          onKeyDown={(e) => {
            if (e.code === "Space") {
              e.preventDefault()
              handlePlayPause(e as unknown as React.MouseEvent, file, 0)
            }
          }}
          onMouseEnter={(e) => e.currentTarget.focus()}
        />
        {hoverTimes[fileId]?.[0] !== undefined &&
          hoverTimes[fileId]?.[0] !== null &&
          Number.isFinite(hoverTimes[fileId]?.[0]) && (
          <PreviewTimeline time={hoverTimes[fileId][0]} duration={duration} />
        )}

        {onAddMedia && (
          <div
            className={`absolute right-[2px] bottom-[18px] text-white rounded-full p-[3px] cursor-pointer hover:scale-125 transform transition-all duration-100 z-10 ${
              isAdded ? "bg-[#3ebfb2]" : "bg-black/60 hover:bg-black/90"
            }`}
            onClick={(e) => {
              e.stopPropagation()
              if (!isAdded) onAddMedia(e, file)
            }}
            title={isAdded ? "Добавлено" : "Добавить"}
          >
            {isAdded ? (
              <Check className="w-3 h-3" strokeWidth={3} />
            ) : (
              <Plus className="w-3 h-3" strokeWidth={3} />
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {file.probeData?.streams
        ?.filter((stream) => stream.codec_type === "video")
        .map((stream, index) => (
          <div
            key={index}
            className={`h-[${size}px] flex-shrink-0 relative`}
            style={{
              width: (() => {
                // Создаем объект подходящего типа для calculateRealDimensions
                const videoStream = {
                  codec_type: "video",
                  width: stream.width || 0,
                  height: stream.height || 0,
                  rotation: stream.rotation?.toString(),
                }
                const dimensions = calculateRealDimensions(videoStream)
                if (!dimensions.width || !dimensions.height) return `${size}px`
                return `${size * (dimensions.width / dimensions.height)}px`
              })(),
              // maxWidth: "100px",
            }}
            onMouseMove={(e) => handleMouseMove(e, fileId, duration, index)}
            onMouseLeave={() => handleMouseLeave(`${fileId}-${index}`)}
          >
            <div className="relative w-full h-full">
              {!loadedVideos[`${fileId}-${index}`] && (
                <Skeleton className="absolute inset-0 rounded" />
              )}
              <video
                data-stream={index}
                onClick={(e) => handlePlayPause(e, file, index)}
                ref={(el) => {
                  videoRefs.current[`${fileId}-${index}`] = el
                }}
                src={file.path}
                className={`w-full h-full object-cover focus:outline-none`}
                tabIndex={0}
                loop
                playsInline
                preload="metadata"
                style={{
                  opacity: loadedVideos[`${fileId}-${index}`] ? 1 : 0,
                  transition: "opacity 0.2s ease-in-out",
                }}
                onLoadedMetadata={() => {
                  setLoadedVideos((prev) => ({
                    ...prev,
                    [`${fileId}-${index}`]: true,
                  }))
                }}
                onPlay={(e) => {
                  const video = e.currentTarget
                  const currentTime = hoverTimes[fileId]?.[index]
                  if (currentTime !== undefined && currentTime !== null) {
                    video.currentTime = currentTime
                  }
                }}
                onError={(e) => {
                  console.error("Video error:", e)
                  setPlayingFileId(null)
                }}
                onKeyDown={(e) => {
                  if (e.code === "Space") {
                    e.preventDefault()
                    handlePlayPause(e as unknown as React.MouseEvent, file, index)
                  }
                }}
                onMouseEnter={(e) => e.currentTarget.focus()}
              />
              {/* Stream indicators */}
              {renderStreamIndicators(
                file,
                stream,
                index,
                loadedVideos[`${fileId}-${index}`],
                videoRefs.current[`${fileId}-${index}`],
              )}
              {/* Timeline */}
              {hoverTimes[fileId]?.[index] !== undefined &&
                hoverTimes[fileId]?.[index] !== null &&
                Number.isFinite(hoverTimes[fileId]?.[index]) && (
                <PreviewTimeline time={hoverTimes[fileId][index]} duration={duration} />
              )}

              {showFileName && (
                <div className="absolute top-[2px] left-[2px] text-xs bg-black/75 px-[2px] rounded-xs line-clamp-1 max-w-[calc(60%)]">
                  {file.name}
                </div>
              )}

              {/* Добавляем кнопку для снимка экрана */}
              {loadedVideos[`${fileId}-${index}`] && (
                <div
                  className="absolute right-[2px] bottom-[40px] text-white rounded-full p-[3px] cursor-pointer hover:scale-125 transform transition-all duration-100 z-10 bg-black/60 hover:bg-black/90"
                  onClick={(e) => captureScreenshot(e, index)}
                  title="Сделать снимок"
                >
                  <Camera className="w-3 h-3" strokeWidth={3} />
                </div>
              )}

              {onAddMedia && loadedVideos[`${fileId}-${index}`] && (
                <div
                  className={`absolute right-[2px] bottom-[18px] text-white rounded-full p-[3px] cursor-pointer hover:scale-125 transform transition-all duration-100 z-10 ${
                    isAdded ? "bg-[#3ebfb2]" : "bg-black/60 hover:bg-black/90"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (!isAdded) onAddMedia(e, file)
                  }}
                  title={isAdded ? "Добавлено" : "Добавить"}
                >
                  {isAdded ? (
                    <Check className="w-3 h-3" strokeWidth={3} />
                  ) : (
                    <Plus className="w-3 h-3" strokeWidth={3} />
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
    </>
  )
})
