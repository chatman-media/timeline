import { useEffect, useRef, useState } from "react"

interface UseSectionTimeProps {
  sectionStartTime: number
  sectionDuration: number
  startTime: number
  endTime: number
}

export function useSectionTime({ sectionStartTime, sectionDuration, startTime, endTime }: UseSectionTimeProps) {
  const [position, setPosition] = useState(0)
  const [trackTime, setTrackTime] = useState(0)
  const isDragging = useRef(false)
  const wasTimeManuallySet = useRef(false)

  useEffect(() => {
    setTrackTime(startTime)
  }, [startTime])

  useEffect(() => {
    if (!isDragging.current && !wasTimeManuallySet.current) {
      const percentage = ((trackTime - sectionStartTime) / sectionDuration) * 100
      setPosition(percentage)
    }
  }, [trackTime, sectionStartTime, sectionDuration])

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
      setTrackTime(clampedTime)
      setPosition(percentage)
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
  }, [sectionStartTime, sectionDuration])

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true
    document.body.style.cursor = "ew-resize"
    document.body.style.userSelect = "none"
    e.preventDefault()
  }

  return {
    trackTime,
    setTrackTime,
    position,
    handleMouseDown,
  }
}
