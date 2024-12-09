import { Skeleton } from "../ui/skeleton"
import { PreviewTimeline } from "./preview-timeline"
import { calculateRealDimensions, isHorizontalVideo } from "@/utils/mediaUtils"
import { formatResolution } from "@/lib/utils"
import { MediaFile } from "@/types/videos"
import { FfprobeStream } from "@/types/ffprobe"

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
          ref={(el) => videoRefs.current[`${fileId}-0`] = el as HTMLVideoElement}
          src={file.path}
          preload="auto"
          loop
          onPlay={(e) => {
            const audio = e.currentTarget
            const currentTime = hoverTimes[fileId]?.[0]
            if (currentTime !== undefined && currentTime !== null) {
              audio.currentTime = currentTime
            }
          }}
        />
        {hoverTimes[fileId]?.[0] !== undefined &&
          hoverTimes[fileId]?.[0] !== null &&
          Number.isFinite(hoverTimes[fileId]?.[0]) && (
          <PreviewTimeline
            time={hoverTimes[fileId][0]}
            duration={duration}
          />
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
                ref={(el) => videoRefs.current[`${fileId}-${index}`] = el}
                src={file.path}
                className={`w-full h-full object-cover rounded`}
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
              />
              {/* Stream indicators */}
              {renderStreamIndicators(file, stream, index, loadedVideos[`${fileId}-${index}`])}
              {/* Timeline */}
              {hoverTimes[fileId]?.[index] !== undefined &&
                hoverTimes[fileId]?.[index] !== null &&
                Number.isFinite(hoverTimes[fileId]?.[index]) && (
                <PreviewTimeline
                  time={hoverTimes[fileId][index]}
                  duration={duration}
                />
              )}
            </div>
          </div>
        ))}
    </>
  )
}

function renderStreamIndicators(file: MediaFile, stream: FfprobeStream, index: number, isLoaded: boolean) {
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
            isHorizontalVideo(
                stream.width,
                stream.height,
                parseInt(stream.rotation || "0"),
              )
              ? "left-[2px] bottom-[2px]"
              : "left-1/2 bottom-[2px] -translate-x-1/2"
          } text-white bg-black/50 rounded p-[2px]`}
        >
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
        </div>
      )}
      {isLoaded && (
        <div
          style={{ fontSize: "10px" }}
          className={`absolute ${
            isHorizontalVideo(
                stream.width,
                stream.height,
                parseInt(stream.rotation || "0"),
              )
              ? "left-[2px] top-[2px]"
              : "left-[calc(50%-8px)] top-[2px]"
          } text-white bg-black/50 rounded px-[2px] py-0`}
        >
          {formatResolution(stream.width, stream.height)}
        </div>
      )}
    </>
  )
}
