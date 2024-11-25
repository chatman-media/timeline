import { memo, useEffect } from "react"
import type { MediaFile } from "@/types/videos"

interface ActiveVideoProps {
  video: MediaFile
  isPlaying: boolean
  videoRefs: React.MutableRefObject<{ [key: string]: HTMLVideoElement }>
}

export const ActiveVideo = memo(({
  video,
  isPlaying,
  videoRefs,
}: ActiveVideoProps) => {
  useEffect(() => {
    const videoElement = videoRefs.current[video.path]
    if (videoElement) {
      if (isPlaying) {
        videoElement.play().catch(console.error)
      } else {
        videoElement.pause()
      }
    }
  }, [isPlaying, video.path, videoRefs])

  return (
    <div className="sticky top-4 space-y-4">
      <div className="relative aspect-video overflow-hidden bg-gray-100 dark:bg-gray-800">
        <video
          ref={(el) => {
            if (el) {
              videoRefs.current[video.path] = el
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
