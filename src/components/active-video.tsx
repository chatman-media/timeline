import { memo, useEffect, useRef } from "react"
import { useMedia } from "@/hooks/use-media"

export const ActiveVideo = memo(() => {
  const {
    videoRefs,
    isPlaying,
    activeVideo,
    currentTime,
    updateTime,
    setIsPlaying,
    isChangingCamera,
  } = useMedia()
  if (!videoRefs.current) {
    videoRefs.current = {}
  }

  const isTimeUpdateFromVideo = useRef(false)

  useEffect(() => {
    const videoElement = videoRefs.current[activeVideo?.id]
    if (videoElement && activeVideo) {
      const videoStartTime =
        new Date(activeVideo.probeData.format.tags?.creation_time || 0).getTime() / 1000

      if (!isTimeUpdateFromVideo.current && !isChangingCamera) {
        const relativeTime = currentTime - videoStartTime
        if (relativeTime >= 0 && relativeTime <= (activeVideo.probeData.format.duration || 0)) {
          videoElement.currentTime = relativeTime
        }
      }
      isTimeUpdateFromVideo.current = false

      const handleTimeUpdate = () => {
        if (!videoElement.seeking && !isChangingCamera) {
          isTimeUpdateFromVideo.current = true
          const newTime = videoStartTime + videoElement.currentTime
          updateTime(newTime)
        }
      }

      const handleError = (e: ErrorEvent) => {
        console.error("Video playback error:", e)
        setIsPlaying(false)
      }

      videoElement.addEventListener("timeupdate", handleTimeUpdate)
      videoElement.addEventListener("error", handleError)

      if (isPlaying && !isChangingCamera) {
        videoElement.play().catch((error) => {
          console.error("Failed to play video:", error)
          setIsPlaying(false)
        })
      } else {
        videoElement.pause()
      }

      return () => {
        videoElement.removeEventListener("timeupdate", handleTimeUpdate)
        videoElement.removeEventListener("error", handleError)
      }
    }
  }, [activeVideo, isPlaying, currentTime, isChangingCamera])

  return (
    <div className="sticky top-4 space-y-4">
      <div className="relative aspect-video overflow-hidden bg-gray-100 dark:bg-gray-800">
        {activeVideo
          ? (
            <video
              ref={(el) => {
                if (el) videoRefs.current[activeVideo.id] = el
              }}
              src={activeVideo.path}
              className="w-full h-full object-contain"
              playsInline
              preload="auto"
              disablePictureInPicture
              disableRemotePlayback
              controlsList="nodownload noplaybackrate"
            />
          )
          : null}
      </div>
    </div>
  )
})

ActiveVideo.displayName = "ActiveVideo"
