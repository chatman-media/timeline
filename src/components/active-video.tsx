import { memo, useEffect, useRef, useState } from "react"
import { Pause, Play } from "lucide-react"

import { useMedia } from "@/hooks/use-media"

export const ActiveVideo = memo(() => {
  const {
    videoRefs,
    isPlaying,
    activeVideo,
    currentTime,
    setCurrentTime,
    setIsPlaying,
    isChangingCamera,
  } = useMedia()

  const [isHovering, setIsHovering] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  if (!videoRefs.current) {
    videoRefs.current = {}
  }

  const isTimeUpdateFromVideo = useRef(false)

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsPlaying(!isPlaying)
  }

  useEffect(() => {
    const videoElement = videoRefs.current[activeVideo?.id]
    if (!videoElement || !activeVideo) return

    const videoStartTime = new Date(activeVideo.probeData?.format.tags?.creation_time || 0).getTime() / 1000

    // Синхронизация времени
    if (!isTimeUpdateFromVideo.current && !isChangingCamera) {
      const relativeTime = currentTime - videoStartTime
      if (relativeTime >= 0 && relativeTime <= (activeVideo.probeData?.format.duration || 0)) {
        videoElement.currentTime = relativeTime
      }
    }
    isTimeUpdateFromVideo.current = false

    const handleTimeUpdate = () => {
      if (!videoElement.seeking && !isChangingCamera) {
        isTimeUpdateFromVideo.current = true
        const newTime = videoStartTime + videoElement.currentTime
        setCurrentTime(newTime)
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
  }, [activeVideo, isPlaying, currentTime, isChangingCamera])

  useEffect(() => {
    const videoElement = videoRefs.current[activeVideo?.id]
    if (!videoElement) return

    const handleLoadedData = () => {
      setIsLoading(false)
    }

    videoElement.addEventListener('loadeddata', handleLoadedData)
    
    return () => {
      videoElement.removeEventListener('loadeddata', handleLoadedData)
    }
  }, [activeVideo])

  return (
    <div className="sticky top-4 space-y-4">
      <div className="flex gap-4">
        <div
          className="relative aspect-video w-[70%] overflow-hidden bg-gray-100 dark:bg-gray-800 group"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {activeVideo && (
            <div className="relative w-full h-full">
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
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="text-white">Загрузка видео...</div>
                </div>
              )}
              <div
                className={`absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity duration-200 ${
                  isHovering ? "opacity-100" : "opacity-0"
                }`}
                onClick={handlePlayPause}
              >
                <button
                  className="p-4 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause className="w-12 h-12 text-white" /> : <Play className="w-12 h-12 text-white" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

ActiveVideo.displayName = "ActiveVideo"
