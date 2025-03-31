import { Pause, Play } from "lucide-react"
import { memo, useEffect, useState } from "react"

import { useVideoStore } from "@/hooks/useVideoStore"

export const ActiveVideo = memo(() => {
  const {
    videoRefs,
    isPlaying,
    activeVideo,
    setCurrentTime, 
    setIsPlaying,
    isChangingCamera,
  } = useVideoStore()

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
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'p' && activeVideo) {
        setIsPlaying(!isPlaying)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isPlaying, activeVideo, setIsPlaying])

  return (
    <div className="relative w-full h-[calc(50vh-36px)] bg-muted/50">
      {activeVideo && (
        <div className="relative h-full">
          <video
            ref={(el) => {
              if (el) videoRefs.current[activeVideo.id] = el
            }}
            src={activeVideo.path}
            className="h-full object-contain object-center"
            playsInline
            preload="auto"
            disablePictureInPicture
            disableRemotePlayback
            controlsList="nodownload noplaybackrate"
          />
        </div>
      )}
    </div>
  )
})

ActiveVideo.displayName = "ActiveVideo"
