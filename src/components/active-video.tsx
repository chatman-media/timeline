import { memo, useEffect } from "react"
import { useMedia } from "@/hooks/use-media"

export const ActiveVideo = memo(() => {
  const { videoRefs, isPlaying, activeVideo, currentTime, play, updateTime } = useMedia()
  if (!videoRefs.current) {
    videoRefs.current = {}
  }

  useEffect(() => {
    console.log(activeVideo)

    const videoElement = videoRefs.current[activeVideo?.id]
    if (videoElement) {
      // Get the video's start time
      const videoStartTime =
        new Date(activeVideo?.probeData.format.tags?.creation_time || 0).getTime() / 1000
      // Calculate the relative position within the video
      const relativeTime = currentTime - videoStartTime

      // Update video's current time
      videoElement.currentTime = relativeTime

      // Обработчик обновления времени
      const handleTimeUpdate = () => {
        const newTime = videoStartTime + videoElement.currentTime
        updateTime(newTime)
      }

      // Добавляем слушатель события timeupdate
      videoElement.addEventListener("timeupdate", handleTimeUpdate)

      if (isPlaying) {
        videoElement.play().catch(console.error)
      } else {
        videoElement.pause()
      }

      // Очищаем слушатель при размонтировании
      return () => {
        videoElement.removeEventListener("timeupdate", handleTimeUpdate)
      }
    }
  }, [isPlaying, videoRefs, activeVideo, !isPlaying && currentTime])

  return (
    <div className="sticky top-4 space-y-4">
      <div className="relative aspect-video overflow-hidden bg-gray-100 dark:bg-gray-800">
        <video
          ref={(el) => {
            if (el) {
              videoRefs.current[activeVideo?.id] = el
            } else {
              delete videoRefs.current[activeVideo?.id]
            }
          }}
          src={activeVideo?.path}
          className="w-full h-full object-contain"
          playsInline
          muted
          onClick={play}
          style={{ cursor: "pointer" }}
        />
      </div>
    </div>
  )
})

ActiveVideo.displayName = "ActiveVideo"
