import { memo, useEffect } from "react"
import type { VideoInfo } from "@/types/video"

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
    </div>
  )
})

ActiveVideo.displayName = "ActiveVideo"
