import { memo, useEffect } from "react"
import type { VideoInfo } from "@/types/video"
import dayjs from "dayjs"

interface ActiveVideoProps {
  video: VideoInfo
  isPlaying: boolean
  videoRefs: React.MutableRefObject<{ [key: string]: HTMLVideoElement }>
}

export const ActiveVideo = memo(({
  video,
  isPlaying,
  videoRefs,
}: ActiveVideoProps) => {
  const formatDuration = (seconds: number) => {
    const duration = dayjs.duration(seconds, "seconds")
    const hours = duration.hours().toString().padStart(2, "0")
    const minutes = duration.minutes().toString().padStart(2, "0")
    const secs = duration.seconds().toString().padStart(2, "0")
    const ms = Math.floor(duration.milliseconds() / 10).toString().padStart(2, "0")
    return `${hours}:${minutes}:${secs}.${ms}`
  }

  const formatBitrate = (bitrate: number) => {
    return `${(bitrate / 1000000).toFixed(1)} Mbps`
  }

  useEffect(() => {
    const activeVideo = videoRefs.current[`active-${video.path}`]
    const mainVideo = videoRefs.current[video.path]

    if (activeVideo && mainVideo) {
      activeVideo.currentTime = mainVideo.currentTime

      if (isPlaying) {
        activeVideo.play()
      } else {
        activeVideo.pause()
      }
    }
  }, [isPlaying, video.path, videoRefs])

  return (
    <div className="sticky top-4 space-y-4">
      <div className="relative aspect-video overflow-hidden bg-gray-100 dark:bg-gray-800">
        <video
          ref={(el) => {
            if (el) {
              videoRefs.current[`active-${video.path}`] = el
            }
          }}
          src={video.path}
          className="w-full h-full object-contain"
          playsInline
          muted
        />
      </div>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">{video.name}</h2>
        <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
          <p>
            {video.metadata.video_stream?.width} × {video.metadata.video_stream?.height}
            ({video.metadata.video_stream?.display_aspect_ratio})
          </p>
          <p>{video.metadata.video_stream?.codec_name.toUpperCase()}</p>
          <p>{formatBitrate(video.metadata.format.bit_rate)}</p>
          <p>{formatDuration(video.metadata.format.duration)}</p>
        </div>
      </div>
    </div>
  )
})

ActiveVideo.displayName = "ActiveVideo"
