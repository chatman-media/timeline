import { memo, useEffect } from "react"
import { VideoPlayer } from "./video-player"
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
    <VideoPlayer
      key={`active-${video.path}`}
      video={video}
      cameraNumber={0} // or remove if not needed
      onVideoRef={(el) => {
        if (el) {
          videoRefs.current[`active-${video.path}`] = el
        }
      }}
    />
  )
})

ActiveVideo.displayName = "ActiveVideo"
