import { Pause, Play } from "lucide-react"
import { memo, useEffect, useState } from "react"

import { useMedia } from "@/hooks/use-media"

export const ActiveVideo = memo(() => {
  const {
    videoRefs,
    isPlaying,
    activeVideo,
    setCurrentTime,
    setIsPlaying,
    isChangingCamera,
  } = useMedia()

  const [isHovering, setIsHovering] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  if (!videoRefs.current) {
    videoRefs.current = {}
  }

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsPlaying(!isPlaying)
  }

  useEffect(() => {
    const videoElement = videoRefs.current[activeVideo?.id]
    if (!videoElement || !activeVideo) return

    const videoStartTime = activeVideo.startTime || 0
    const throttledTimeUpdate = () => {
      if (!videoElement.seeking && !isChangingCamera) {
        const newTime = videoStartTime + videoElement.currentTime
        // Используем RAF для синхронизации с отрисовкой
        requestAnimationFrame(() => {
          setCurrentTime(newTime)
        })
      }
    }

    // Оптимизированный обработчик timeupdate
    let lastUpdate = 0
    const handleTimeUpdate = () => {
      const now = performance.now()
      // Ограничиваем частоту обновлений до ~60fps
      if (now - lastUpdate >= 16.6) {
        throttledTimeUpdate()
        lastUpdate = now
      }
    }

    const handleError = (e: ErrorEvent) => {
      console.error("Video playback error:", e)
      setIsPlaying(false)
    }

    videoElement.addEventListener("timeupdate", handleTimeUpdate)
    videoElement.addEventListener("error", handleError)

    // Управление воспроизведением
    const playVideo = async () => {
      try {
        if (isPlaying && !isChangingCamera) {
          await videoElement.play()
        } else {
          videoElement.pause()
        }
      } catch (error) {
        console.error("Failed to play video:", error)
        setIsPlaying(false)
      }
    }

    playVideo()

    return () => {
      videoElement.removeEventListener("timeupdate", handleTimeUpdate)
      videoElement.removeEventListener("error", handleError)
      videoElement.pause()
    }
  }, [activeVideo, isPlaying, isChangingCamera])

  useEffect(() => {
    const videoElement = videoRefs.current[activeVideo?.id]
    if (!videoElement) return

    const handleLoadedData = () => {
      setIsLoading(false)
    }

    videoElement.addEventListener("loadeddata", handleLoadedData)

    return () => {
      videoElement.removeEventListener("loadeddata", handleLoadedData)
    }
  }, [activeVideo])

  return (
    <div
      className="relative w-full h-full bg-gray-50 dark:bg-gray-900 group overflow-hidden"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {activeVideo && (
        <div className="relative h-full max-h-[calc(100vh-82px)]">
          <video
            ref={(el) => {
              if (el) videoRefs.current[activeVideo.id] = el
            }}
            src={activeVideo.path}
            className="h-full object-contain object-left"
            playsInline
            preload="auto"
            disablePictureInPicture
            disableRemotePlayback
            controlsList="nodownload noplaybackrate"
          />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="text-white">Загрузка видео...</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
})

ActiveVideo.displayName = "ActiveVideo"
