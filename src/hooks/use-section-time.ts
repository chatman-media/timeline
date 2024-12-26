import { useEffect, useRef, useState } from "react"
import { useMedia } from "./use-media"

interface UseSectionTimeProps {
  sectionStartTime: number
  sectionDuration: number
  startTime: number
  endTime: number
}

export function useSectionTime(
  { sectionStartTime, sectionDuration, startTime, endTime }: UseSectionTimeProps,
) {
  const [position, setPosition] = useState(0)
  const isDragging = useRef(false)
  const wasTimeManuallySet = useRef(false)
  const { activeVideo, videoRefs, setCurrentTime, currentTime, setActiveVideo, setActiveTrack } =
    useMedia()
  const lastUpdateTime = useRef(0)
  const animationFrameId = useRef<number>()

  useEffect(() => {
    const updatePosition = () => {
      if (isDragging.current || wasTimeManuallySet.current) return

      const now = performance.now()
      if (now - lastUpdateTime.current >= 16.6) {
        const percentage = ((currentTime - sectionStartTime) / sectionDuration) * 100
        setPosition(percentage)
        lastUpdateTime.current = now
      }
      animationFrameId.current = requestAnimationFrame(updatePosition)
    }

    animationFrameId.current = requestAnimationFrame(updatePosition)

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
      }
    }
  }, [currentTime, sectionStartTime, sectionDuration])

  const handleVideoClick = (videoStartTime: number, videoId: string, trackId: string) => {
    wasTimeManuallySet.current = true
    const percentage = ((videoStartTime - sectionStartTime) / sectionDuration) * 100
    setPosition(percentage)

    // Устанавливаем активное видео и дорожку
    setActiveVideo(videoId)
    setActiveTrack(trackId)
    setCurrentTime(videoStartTime)
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return

      const target = e.target as HTMLElement
      const rect = target.closest(".timeline-section")?.getBoundingClientRect()
      if (!rect) return

      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
      const percentage = (x / rect.width) * 100

      const newTime = sectionStartTime + (sectionDuration * (percentage / 100))
      wasTimeManuallySet.current = true

      const clampedTime = Math.max(startTime, Math.min(endTime, newTime))
      setPosition(percentage)

      if (activeVideo && videoRefs.current[activeVideo.id]) {
        const videoElement = videoRefs.current[activeVideo.id]
        const videoStartTime = activeVideo.startTime || 0
        videoElement.currentTime = clampedTime - videoStartTime
      }
      setCurrentTime(clampedTime)
    }

    const handleMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false
        document.body.style.cursor = ""
        document.body.style.userSelect = ""
      }
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [
    sectionStartTime,
    sectionDuration,
    startTime,
    endTime,
    setCurrentTime,
    activeVideo,
    videoRefs,
  ])

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true
    document.body.style.cursor = "ew-resize"
    document.body.style.userSelect = "none"
    e.preventDefault()
  }

  return {
    position,
    handleMouseDown,
    handleVideoClick,
  }
}
