import { useEffect, useRef, useState } from "react"
import { useMedia } from "./use-media"

interface UseSectionTimeProps {
  sectionStartTime: number
  sectionDuration: number
}

export function useSectionTime({ sectionStartTime, sectionDuration }: UseSectionTimeProps) {
  const { currentTime: globalTime, setCurrentTime: setGlobalTime } = useMedia()
  const [position, setPosition] = useState(() => {
    return 0
  })
  const isInitialized = useRef(false)
  const isDragging = useRef(false)

  useEffect(() => {
    if (!isInitialized.current) {
      setPosition(0)
      isInitialized.current = true
    }
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true
    document.body.style.cursor = "ew-resize"
    document.body.style.userSelect = "none"
    e.preventDefault()
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current) return
    const target = e.target as HTMLElement
    const rect = target.closest(".timeline-section")?.getBoundingClientRect()
    if (!rect) return

    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    const percentage = (x / rect.width) * 100

    const newTime = sectionStartTime + (sectionDuration * (percentage / 100))
    setGlobalTime(newTime)
    setPosition(percentage)
  }

  const handleMouseUp = () => {
    if (isDragging.current) {
      isDragging.current = false
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
  }

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [])

  return {
    position,
    handleMouseDown,
    isDragging: isDragging.current,
  }
}
