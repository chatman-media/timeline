import { VideoInfo } from "@/types/video"
import dayjs from "dayjs"

interface VideoMetadataProps {
  video: VideoInfo & {
    activeIndex: number
    timezone: string
    metadata: {
      video_stream?: {
        display_aspect_ratio: string
        codec_name: string
        width: number
        height: number
      }
      format: {
        size: number
        duration?: number
      }
      // ... остальные поля metadata
    }
  }
}

export function VideoMetadata({ video }: VideoMetadataProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-800 text-base text-4xl font-extrabold tracking-tight lg:text-3xl text-gray-900 dark:text-white">
        {video.activeIndex + 1}
      </span>
      <h3 className="font-medium">{video.name}</h3>
      <div className="flex flex-col ml-auto text-sm text-gray-600 dark:text-gray-400">
        <span>
          {video.metadata?.creation_time && (
            <>
              {dayjs(video.metadata.creation_time)
                .tz(video.timezone)
                .format("YYYY-MM-DD")} {dayjs(video.metadata.creation_time)
                .tz(video.timezone)
                .format("HH:mm")}
              -
              {dayjs(video.metadata.creation_time)
                .tz(video.timezone)
                .add(video.metadata?.format?.duration || 0, "second")
                .format("HH:mm")}
            </>
          )}
        </span>
        <div className="flex gap-2">
          {video.metadata.video_stream && (
            <>
              <span>
                {video.metadata.video_stream.width}×{video.metadata.video_stream.height}
              </span>
              <span>•</span>
              <span>{video.metadata.video_stream.display_aspect_ratio}</span>
              <span>•</span>
              <span>{video.metadata.video_stream.codec_name}</span>
            </>
          )}
          {video.metadata.format.size && (
            <>
              <span>•</span>
              <span>
                {video.metadata.format.size / (1024 * 1024) >= 1024
                  ? `${(video.metadata.format.size / (1024 * 1024 * 1024)).toFixed(1)} GB`
                  : `${(video.metadata.format.size / (1024 * 1024)).toFixed(1)} MB`}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
