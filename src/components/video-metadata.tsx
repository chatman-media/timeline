import { VideoInfo } from "@/pages/api/hello"
import dayjs from "dayjs"

interface VideoMetadataProps {
  video: VideoInfo
  activeIndex: number
  timezone: string
  formatDuration: (duration?: number) => string
}

export function VideoMetadata({ video, activeIndex, timezone, formatDuration }: VideoMetadataProps) {
  const videoWidth = video.metadata?.streams?.[0]?.width
  const videoHeight = video.metadata?.streams?.[0]?.height
  const videoSize = video.metadata?.format?.size

  return (
    <div className="flex items-center gap-3">
      <span className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-800 text-base text-4xl font-extrabold tracking-tight lg:text-3xl text-gray-900 dark:text-white">
        {activeIndex + 1}
      </span>
      <h3 className="font-medium">{video.name}</h3>
      <div className="flex gap-2 ml-auto text-sm text-gray-600 dark:text-gray-400">
        <span>
          {video.metadata?.creation_time &&
            dayjs(video.metadata.creation_time)
              .tz(timezone)
              .format("D MMM YYYY, HH:mm:ss")}
        </span>
        <span>•</span>
        <span>{formatDuration(video.metadata?.format?.duration)}</span>
        {videoWidth && videoHeight && (
          <>
            <span>•</span>
            <span>{videoWidth}×{videoHeight}</span>
          </>
        )}
        {videoSize && (
          <>
            <span>•</span>
            <span>{(videoSize / (1024 * 1024)).toFixed(1)} MB</span>
          </>
        )}
      </div>
    </div>
  )
} 