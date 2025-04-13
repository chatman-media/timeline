import { Check, Film, Image as ImageIcon, Music, Plus } from "lucide-react"
import { memo } from "react"

import { formatResolution } from "@/lib/utils"
import { FfprobeStream } from "@/types/ffprobe"
import { MediaFile } from "@/types/videos"
import { isHorizontalVideo } from "@/utils/media-utils"

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
  fixedSize?: boolean
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
  fixedSize = false,
}: MediaPreviewProps) {
  // Преобразует rotation из string в number, или возвращает undefined
  const parseRotation = (rotation?: string | number): number | undefined => {
    if (rotation === undefined) return undefined
    if (typeof rotation === "number") return rotation
    const parsed = parseInt(rotation, 10)
    return isNaN(parsed) ? undefined : parsed
  }

  // Функция для расчета ширины с учетом ограничений соотношения сторон
  const calculateWidth = (
    widthValue: number,
    heightValue: number,
    rotation?: number | string,
  ): number => {
    if (fixedSize) {
      // Для режима сетки всегда используем 16:9
      return (size * 16) / 9
    }

    // Для аудио всегда 16:9
    if (isAudio) {
      return (size * 16) / 9
    }

    // Для режима миниатюр рассчитываем с учетом реальных пропорций, но с ограничением
    const maxAspectRatio = 2.35 // Максимальное соотношение 2.35:1 (широкоэкранное кино)
    const defaultAspectRatio = 16 / 9 // По умолчанию 16:9

    // Учитываем поворот
    const rotationNum = typeof rotation === "string" ? parseFloat(rotation) : rotation || 0
    const isRotated = Math.abs(rotationNum) === 90 || Math.abs(rotationNum) === 270

    // Если повернуто на 90 или 270 градусов, меняем местами ширину и высоту
    const actualWidth = isRotated ? heightValue : widthValue
    const actualHeight = isRotated ? widthValue : heightValue

    if (!actualWidth || !actualHeight) {
      return size * defaultAspectRatio
    }

    const aspectRatio = actualWidth / actualHeight

    // Ограничиваем соотношение сторон максимальным значением
    const limitedRatio = Math.min(aspectRatio, maxAspectRatio)

    return size * limitedRatio
  }

  // Перемещаем функцию renderStreamIndicators внутрь компонента
  const renderStreamIndicators = (
    file: MediaFile,
    stream: FfprobeStream,
    index: number,
    isLoaded: boolean,
    videoRef: HTMLVideoElement | null,
  ) => {
    // Определяем тип медиа
    const isVideo = stream.codec_type === "video"
    const hasAudio = file.probeData?.streams?.some((s) => s.codec_type === "audio")
    const isImage = file.isImage || (isVideo && !hasAudio && !duration)
    const smallPadding = size < 100 ? "px-[2px] py-0" : "px-[4px] py-[2px]"

    return (
      <>
        {/* {file.probeData?.streams &&
          file.probeData.streams.filter((s) => s.codec_type === "video").length > 0 && (
            <div
              style={{ fontSize: "10px" }}
              className={`absolute left-1 top-[calc(50%-8px)] text-white bg-black/50 rounded ${smallPadding}`}
            >
              {index + 1}
            </div>
          )} */}
        {file.probeData?.streams &&
          file.probeData.streams.filter((s) => s.codec_type === "video").length > 1 && (
            <div
              style={{ fontSize: "10px" }}
              className={`absolute left-1 top-[calc(50%-8px)] text-white bg-black/50 rounded ${smallPadding}`}
            >
              {index + 1}
            </div>
          )}

        {/* Иконка типа медиа */}
        <div
          className={`absolute ${
            isHorizontalVideo(stream.width || 0, stream.height || 0, parseRotation(stream.rotation))
              ? size > 100
                ? "right-1 top-1"
                : "right-0.5 top-0.5"
              : "left-1/2 bottom-1 -translate-x-1/2"
          } text-white cursor-pointer bg-black/65 rounded p-0.5`}
        >
          {isVideo && <Film size={size > 100 ? 16 : 12} />}
          {hasAudio && !isVideo && <Music size={size > 100 ? 16 : 12} />}
          {isImage && <ImageIcon size={size > 100 ? 16 : 12} />}
        </div>

        {isLoaded && (
          <div
            className={`absolute ${
              isHorizontalVideo(
                stream.width || 0,
                stream.height || 0,
                parseRotation(stream.rotation),
              )
                ? size > 100
                  ? "right-[28px]"
                  : "right-[20px]"
                : "left-[calc(50%-8px)]"
            } bg-black/65 ${size > 100 ? "text-sm" : "text-xs"} ${size <= 100 ? "leading-[16px]" : "leading-[16px]"} rounded ${size > 100 ? "top-1" : "top-0.5"} ${size > 100 ? "px-[4px] py-[2px]" : "px-[2px] py-0"} font-medium text-white`}
          >
            {formatResolution(stream.width || 0, stream.height || 0)}
          </div>
        )}
      </>
    )
  }

  if (isAudio) {
    return (
      <div
        className={`h-full flex-shrink-0 relative`}
        style={{ height: `${size}px`, width: `${calculateWidth(0, 0, 0).toFixed(0)}px` }}
        onMouseMove={(e) => handleMouseMove(e, fileId, duration, 0)}
        onClick={(e) => handlePlayPause(e, file, 0)}
        onMouseLeave={() => handleMouseLeave(`${fileId}-0`)}
      >
        <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
          <Music className="w-6 h-6 text-gray-500 dark:text-gray-400" />
        </div>
        <audio
          data-stream="0"
          ref={(el) => {
            if (el) videoRefs.current[`${fileId}-0`] = el as unknown as HTMLVideoElement
          }}
          src={file.path}
          preload="auto"
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
          onEnded={(e) => {
            e.currentTarget.pause()
          }}
        />

        {/* Иконка типа медиа в правом верхнем углу */}
        <div
          className={`absolute ${size > 100 ? "right-1 top-1" : "right-0.5 top-0.5"} text-white cursor-pointer bg-black/65 rounded p-0.5`}
        >
          <Music size={size > 100 ? 16 : 12} />
        </div>

        {hoverTimes[fileId]?.[0] !== undefined &&
          hoverTimes[fileId]?.[0] !== null &&
          Number.isFinite(hoverTimes[fileId]?.[0]) && (
            <PreviewTimeline
              time={hoverTimes[fileId][0]}
              duration={duration}
              videoRef={videoRefs.current[`${fileId}-0`]}
            />
          )}

        {showFileName && (
          <div
            className={`absolute font-medium ${size > 100 ? "top-1 left-1" : "top-0.5 left-0.5"} ${size > 100 ? "px-[4px] py-[2px]" : "px-[2px] py-0"} text-xs bg-black/65 text-white rounded-xs line-clamp-1 max-w-[calc(60%)]`}
          >
            {file.name}
          </div>
        )}

        {onAddMedia && (
          <div
            className={`absolute right-[2px] bottom-[4px] text-white rounded-full p-[3px] cursor-pointer z-10 ${
              isAdded ? "bg-[#3ebfb2]" : "bg-black/65 hover:bg-[#3ebfb2]"
            }`}
            onClick={(e) => {
              e.stopPropagation()
              if (!isAdded) onAddMedia(e, file)
            }}
            title={isAdded ? "Добавлено" : "Добавить"}
          >
            {isAdded ? (
              <Check className={size > 100 ? "w-4 h-4" : "w-3 h-3"} strokeWidth={3} />
            ) : (
              <Plus className={size > 100 ? "w-4 h-4" : "w-3 h-3"} strokeWidth={3} />
            )}
          </div>
        )}
      </div>
    )
  }

  // Обработка случая, когда файл - изображение
  if (file.isImage) {
    return (
      <div
        className={`h-full flex-shrink-0 relative`}
        style={{ height: `${size}px`, width: `${calculateWidth(0, 0, 0).toFixed(0)}px` }}
      >
        <div className="w-full h-full relative">
          <img
            src={file.path}
            alt={file.name}
            className="w-full h-full object-contain bg-gray-100 dark:bg-gray-800"
            style={{
              opacity: 1,
              transition: "opacity 0.2s ease-in-out",
            }}
          />

          {/* Иконка типа медиа */}
          <div
            className={`absolute ${size > 100 ? "right-1 top-1" : "right-0.5 top-0.5"} text-white cursor-pointer bg-black/65 rounded p-0.5`}
          >
            <ImageIcon size={size > 100 ? 16 : 12} />
          </div>

          {showFileName && (
            <div
              className={`absolute font-medium ${size > 100 ? "top-1 left-1" : "top-0.5 left-0.5"} ${size > 100 ? "px-[4px] py-[2px]" : "px-[2px] py-0"} text-xs bg-black/65 text-white rounded-xs line-clamp-1 max-w-[calc(60%)]`}
            >
              {file.name}
            </div>
          )}

          {onAddMedia && (
            <div
              className={`absolute right-[2px] bottom-[18px] text-white rounded-full p-1 cursor-pointer z-10 ${
                isAdded ? "bg-[#3ebfb2]" : "bg-black/65 hover:bg-[#3ebfb2]"
              }`}
              onClick={(e) => {
                e.stopPropagation()
                if (!isAdded) onAddMedia(e, file)
              }}
              title={isAdded ? "Добавлено" : "Добавить"}
            >
              {isAdded ? (
                <Check className={size > 100 ? "w-4 h-4" : "w-3 h-3"} strokeWidth={3} />
              ) : (
                <Plus className={size > 100 ? "w-4 h-4" : "w-3 h-3"} strokeWidth={3} />
              )}
            </div>
          )}
        </div>
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
              width: `${calculateWidth(stream.width || 0, stream.height || 0, stream.rotation).toFixed(0)}px`,
              // maxWidth: "100px",
            }}
            onMouseMove={(e) => handleMouseMove(e, fileId, duration, index)}
            onMouseLeave={() => handleMouseLeave(`${fileId}-${index}`)}
          >
            <div className="relative w-full h-full">
              {!loadedVideos[`${fileId}-${index}`] && <Skeleton className="absolute inset-0 p-0" />}
              <video
                data-stream={index}
                onClick={(e) => handlePlayPause(e, file, index)}
                ref={(el) => {
                  videoRefs.current[`${fileId}-${index}`] = el
                }}
                src={file.path}
                className={`w-full h-full object-cover focus:outline-none`}
                tabIndex={0}
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
                onEnded={(e) => {
                  e.currentTarget.pause()
                }}
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
                  <PreviewTimeline
                    time={hoverTimes[fileId][index]}
                    duration={duration}
                    videoRef={videoRefs.current[`${fileId}-${index}`]}
                  />
                )}

              {showFileName && (
                <div
                  className={`absolute font-medium ${size > 100 ? "top-1 left-1" : "top-0.5 left-0.5"} ${size > 100 ? "px-[4px] py-[2px]" : "px-[2px] py-0"} text-xs bg-black/65 text-white rounded-xs line-clamp-1 max-w-[calc(60%)]`}
                >
                  {file.name}
                </div>
              )}

              {onAddMedia && loadedVideos[`${fileId}-${index}`] && (
                <div
                  className={`absolute right-[4px] bottom-[4px] text-white rounded-full p-1 cursor-pointer z-10 ${
                    isAdded ? "bg-[#3ebfb2]" : "bg-black/65 hover:bg-[#3ebfb2]"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (!isAdded) onAddMedia(e, file)
                  }}
                  title={isAdded ? "Добавлено" : "Добавить"}
                >
                  {isAdded ? (
                    <Check className={size > 100 ? "w-4 h-4" : "w-3 h-3"} strokeWidth={3} />
                  ) : (
                    <Plus className={size > 100 ? "w-4 h-4" : "w-3 h-3"} strokeWidth={3} />
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
    </>
  )
})
