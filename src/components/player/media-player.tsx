import { memo, useEffect } from "react"

import { PlayerControls } from "@/components/player/player-controls"
import { useRootStore } from "@/hooks/use-root-store"

export const ActiveVideo = memo(() => {
  const {
    videoRefs,
    isPlaying,
    activeVideo,
    setCurrentTime,
    setIsPlaying,
    isChangingCamera,
    volume: globalVolume,
    trackVolumes,
    currentTime,
    isSeeking,
    setIsSeeking,
  } = useRootStore()

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsPlaying(!isPlaying)
  }

  useEffect(() => {
    if (!activeVideo) return

    const videoElement = videoRefs[activeVideo.id]
    if (!videoElement) return

    const videoStartTime = activeVideo.startTime || 0
    const throttledTimeUpdate = () => {
      if (!videoElement.seeking && !isChangingCamera && !isSeeking) {
        const newTime = videoStartTime + videoElement.currentTime
        requestAnimationFrame(() => {
          setCurrentTime(newTime)
        })
      }
    }

    let lastUpdate = 0
    const handleTimeUpdate = () => {
      const now = performance.now()
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

    // Устанавливаем громкость для активного видео
    const trackVolume = trackVolumes[activeVideo.id] ?? 1
    videoElement.volume = globalVolume * trackVolume

    playVideo()

    return () => {
      videoElement.removeEventListener("timeupdate", handleTimeUpdate)
      videoElement.removeEventListener("error", handleError)
    }
  }, [
    activeVideo,
    isPlaying,
    isChangingCamera,
    videoRefs,
    setCurrentTime,
    setIsPlaying,
    globalVolume,
    trackVolumes,
    isSeeking,
  ])

  // Добавляем эффект для обновления времени видео при изменении currentTime
  useEffect(() => {
    if (!activeVideo) return

    const videoElement = videoRefs[activeVideo.id]
    if (!videoElement) return

    const videoStartTime = activeVideo.startTime || 0
    const newTime = currentTime - videoStartTime

    // Проверяем что newTime - корректное число и не отрицательное
    if (isFinite(newTime) && newTime >= 0) {
      videoElement.currentTime = newTime
      // Сбрасываем флаг после небольшой задержки
      setTimeout(() => {
        setIsSeeking(false)
      }, 100)
    } else if (newTime < 0) {
      // Если время отрицательное, устанавливаем время в начало видео
      videoElement.currentTime = 0
      // Обновляем глобальное время на начало видео
      setCurrentTime(videoStartTime)
      setTimeout(() => {
        setIsSeeking(false)
      }, 100)
    }
  }, [currentTime, activeVideo, videoRefs, setIsSeeking, setCurrentTime])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "p" && activeVideo) {
        setIsPlaying(!isPlaying)
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [isPlaying, activeVideo, setIsPlaying])

  if (!activeVideo) return null

  return (
    <div className="relative h-full flex flex-col">
      <div className="flex-1 relative bg-black">
        <video
          ref={(el) => {
            if (el && activeVideo) {
              videoRefs[activeVideo.id] = el
            }
          }}
          src={activeVideo.path}
          className="absolute inset-0 w-full h-full object-contain"
          onClick={handlePlayPause}
          playsInline
          preload="auto"
          disablePictureInPicture
        />
      </div>
      <PlayerControls />
    </div>
  )
})

ActiveVideo.displayName = "ActiveVideo"
