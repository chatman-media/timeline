import { memo, useEffect } from "react"
import { useMedia } from "@/hooks/use-media"

export const ActiveVideo = memo(() => {
  const { videoRefs, isPlaying, activeVideo, currentTime, play, updateTime } = useMedia()
  if (!videoRefs.current) {
    videoRefs.current = {}
  }

  useEffect(() => {
    const videoElement = videoRefs.current[activeVideo?.id]
    if (videoElement && activeVideo) {
      // Get the video's start time
      const videoStartTime =
        new Date(activeVideo.probeData.format.tags?.creation_time || 0).getTime() / 1000
      // Calculate the relative position within the video
      const relativeTime = currentTime - videoStartTime

      // Only set currentTime if it's within valid range
      if (relativeTime >= 0 && relativeTime <= (activeVideo.probeData.format.duration || 0)) {
        videoElement.currentTime = relativeTime
      }

      // Обработчик обновления времени
      const handleTimeUpdate = () => {
        const newTime = videoStartTime + videoElement.currentTime
        updateTime(newTime)
      }

      // Добавляем слушатели событий
      videoElement.addEventListener("timeupdate", handleTimeUpdate)

      // Управляем воспроизведением
      if (isPlaying) {
        videoElement.play().catch(console.error)
      } else {
        videoElement.pause()
      }

      return () => {
        videoElement.removeEventListener("timeupdate", handleTimeUpdate)
      }
    }
  }, [activeVideo, isPlaying, currentTime])

  return (
    <div className="sticky top-4 space-y-4">
      <div className="relative aspect-video overflow-hidden bg-gray-100 dark:bg-gray-800">
        {activeVideo
          ? (
            <video
              ref={(el) => {
                if (el) {
                  videoRefs.current[activeVideo.id] = el
                } else {
                  delete videoRefs.current[activeVideo.id]
                }
              }}
              src={activeVideo.path}
              className="w-full h-full object-contain"
              playsInline
              muted={false}
              // controls
              onClick={play}
              style={{ cursor: "pointer" }}
            />
          )
          : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">No active video</p>
            </div>
          )}
      </div>
    </div>
  )
})

ActiveVideo.displayName = "ActiveVideo"
