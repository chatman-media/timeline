import { Check, Plus } from "lucide-react"
import { useState } from "react"

import { formatResolution } from "@/lib/utils"
import { FfprobeStream } from "@/types/ffprobe"
import { MediaFile } from "@/types/videos"
import { calculateRealDimensions, isHorizontalVideo } from "@/utils/mediaUtils"
import { getNextVolumeState, VolumeState } from "@/utils/videoUtils"

import { Skeleton } from "../ui/skeleton"
import { PreviewTimeline } from "./preview-timeline"

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
}

export function MediaPreview({
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
}: MediaPreviewProps) {
  if (isAudio) {
    return (
      <div
        className="w-15 h-15 flex-shrink-0 relative"
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
          ref={(el) => (videoRefs.current[`${fileId}-0`] = el as HTMLVideoElement)}
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
            className={`absolute right-[2px] bottom-[18px] bg-black/60 hover:bg-black/80 text-white rounded-full p-[3px] cursor-pointer hover:scale-125 transform transition-all duration-100 z-10 ${
              isAdded ? "bg-[#4FD1C5]/90 hover:bg-[#4FD1C5]" : "bg-black/60 hover:bg-black/90"
            }`}
            onClick={(e) => {
              e.stopPropagation()
              if (!isAdded) onAddMedia(e, file)
            }}
            title={isAdded ? "Добавлено" : "Добавить"}
          >
            {isAdded ? (
              <Check className="w-4 h-4" strokeWidth={3} />
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
            className="h-15 flex-shrink-0 relative"
            style={{
              width: (() => {
                const dimensions = calculateRealDimensions(stream)
                return `${60 * (dimensions.width / dimensions.height)}px`
              })(),
              maxWidth: "100px",
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
                ref={(el) => (videoRefs.current[`${fileId}-${index}`] = el)}
                src={file.path}
                className={`w-full h-full object-cover rounded focus:outline-none`}
                tabIndex={0}
                loop
                playsInline
                loading="lazy"
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

              {onAddMedia && loadedVideos[`${fileId}-${index}`] && (
                <div
                  className={`absolute right-[2px] bottom-[18px] bg-black/60 hover:bg-black/80 text-white rounded-full p-[3px] cursor-pointer hover:scale-125 transform transition-all duration-100 z-10 ${
                    isAdded ? "bg-[#4FD1C5]/90 hover:bg-[#4FD1C5]" : "bg-black/60 hover:bg-black/90"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (!isAdded) onAddMedia(e, file)
                  }}
                  title={isAdded ? "Добавлено" : "Добавить"}
                >
                  {isAdded ? (
                    <Check className="w-4 h-4" strokeWidth={3} />
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
}

function renderStreamIndicators(
  file: MediaFile,
  stream: FfprobeStream,
  index: number,
  isLoaded: boolean,
  videoRef: HTMLVideoElement | null,
) {
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
      {file.probeData?.streams.filter((s) => s.codec_type === "video").length > 1 && (
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
            isHorizontalVideo(stream.width, stream.height, stream.rotation || "0")
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
            isHorizontalVideo(stream.width || 0, stream.height || 0, stream.rotation)
              ? "left-[2px] top-[2px]"
              : "left-[calc(50%-8px)] top-[2px]"
          } text-white bg-black/50 rounded px-[2px] py-0`}
        >
          {formatResolution(stream.width || 0, stream.height || 0)}
        </div>
      )}
    </>
  )
}
