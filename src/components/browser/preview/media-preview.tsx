import { Camera, Check, Music, Plus, Image as ImageIcon, Film } from "lucide-react"
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
    const isImage = isVideo && !hasAudio && !duration
    const iconSize = size < 100 ? "w-3 h-3" : "w-4 h-4"
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
            isHorizontalVideo(
              stream.width || 0,
              stream.height || 0,
              parseRotation(stream.rotation),
            )
              ? size > 100 ? "right-1 top-1" : "right-0.5 top-0.5"
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
                ? size > 100 ? "right-[28px]" : "right-[22px]"
                : "left-[calc(50%-8px)]"
            } bg-black/65 font-medium rounded ${size > 100 ? "top-1" : "top-0.5"} ${size > 100 ? "px-[4px] py-[2px]" : "px-[2px] py-0"} text-xs text-white`}
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
        style={{ height: `${size}px`, width: `${(size*16/9).toFixed(0)}px` }}
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
        
        {/* Иконка типа медиа в правом верхнем углу */}
        <div className={`absolute right-1 top-1 text-white cursor-pointer bg-black/65 rounded p-0.5`}>
          <Music className={`${size < 100 ? "w-3 h-3" : "w-4 h-4"}`} />
        </div>
        
        {hoverTimes[fileId]?.[0] !== undefined &&
          hoverTimes[fileId]?.[0] !== null &&
          Number.isFinite(hoverTimes[fileId]?.[0]) && (
            <PreviewTimeline time={hoverTimes[fileId][0]} duration={duration} />
          )}

        {showFileName && (
          <div className={`absolute font-medium ${size > 100 ? "top-1 left-1" : "top-0.5 left-0.5"} ${size > 100 ? "px-[4px] py-[2px]" : "px-[2px] py-0"} text-xs bg-black/65 text-white rounded-xs line-clamp-1 max-w-[calc(60%)]`}>
            {file.name}
          </div>
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
                if (fixedSize) return `${size*16/9}px`
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
                <Skeleton className="absolute inset-0 p-0" />
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
                <div className={`absolute font-medium ${size > 100 ? "top-1 left-1" : "top-0.5 left-0.5"} ${size > 100 ? "px-[4px] py-[2px]" : "px-[2px] py-0"} text-xs bg-black/65 text-white rounded-xs line-clamp-1 max-w-[calc(60%)]`}>
                  {file.name}
                </div>
              )}

              {onAddMedia && loadedVideos[`${fileId}-${index}`] && (
                <div
                  className={`absolute right-[2px] bottom-[18px] text-white rounded-full p-[3px] cursor-pointer hover:scale-125 transform transition-all duration-100 z-10 ${
                    isAdded ? "bg-[#3ebfb2]" : "bg-black/65 hover:bg-black/90"
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
