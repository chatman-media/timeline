import { memo, useEffect } from "react"
import { MediaFile } from "@/types/video"

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
    console.log("Debug video element:", {
      path: video.path,
      element: videoElement,
      isPlaying,
      currentSrc: videoElement?.currentSrc,
      readyState: videoElement?.readyState,
    })

    if (videoElement) {
      if (isPlaying) {
        videoElement.play()
          .then(() => console.log("Video started playing"))
          .catch((error) => console.error("Error playing video:", error))
      } else {
        videoElement.pause()
        console.log("Video paused")
      }
    }
  }, [isPlaying, video.path, videoRefs])

  return (
    <div className="sticky top-4 space-y-4 max-w-2xl">
      <div className="relative aspect-video overflow-hidden bg-gray-100 dark:bg-gray-800">
        <video
          ref={(el) => {
            if (el) {
              videoRefs.current[video.path] = el
              console.log("Video ref set:", video.path)
            }
          }}
          src={`/${encodeURIComponent(video.path)}`}
          className="w-full h-full object-contain"
          playsInline
          muted
          onLoadedData={() => console.log("Video loaded:", video.path)}
          onError={(e) => console.error("Video error:", e)}
        />
      </div>
    </div>
  )
})

ActiveVideo.displayName = "ActiveVideo"
