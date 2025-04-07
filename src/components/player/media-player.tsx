import { memo, useEffect } from "react"

import { PlayerControls } from "@/components/player/player-controls"
import { useRootStore } from "@/hooks/use-root-store"
import { MediaFile } from "@/types/videos"

export const ActiveVideo = memo(() => {
  const { videoRefs, isPlaying, activeVideo, setCurrentTime, setIsPlaying, isChangingCamera } =
    useRootStore()

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsPlaying(!isPlaying)
  }

  useEffect(() => {
    if (!activeVideo) return

    const videoElement = videoRefs.current ?? videoRefs.current[activeVideo.id]
    if (!videoElement) return

    const videoStartTime = activeVideo.startTime || 0
    const throttledTimeUpdate = () => {
      if (!videoElement.seeking && !isChangingCamera) {
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

    playVideo()

    return () => {
      videoElement.removeEventListener("timeupdate", handleTimeUpdate)
      videoElement.removeEventListener("error", handleError)
      videoElement.pause()
    }
  }, [activeVideo, isPlaying, isChangingCamera])

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
              videoRefs.current[activeVideo.id] = el
            }
          }}
          src={activeVideo.path}
          className="absolute inset-0 w-full h-full object-contain"
          onClick={handlePlayPause}
          playsInline
          muted
          preload="auto"
          disablePictureInPicture
          disableRemotePlayback
          controlsList="nodownload noplaybackrate"
        />
      </div>
      <div className="flex-shrink-0">
        <PlayerControls />
      </div>
    </div>
  )
})

ActiveVideo.displayName = "ActiveVideo"
