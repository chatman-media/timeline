import { useCallback, useEffect, useRef } from "react"

interface TimelineGroupBarProps {
  duration: number
  currentTime: number
  startTime: number
  height: number
  onTimeChange: (newTime: number) => void
}

const TimelineGroupBar = ({
  duration,
  currentTime,
  startTime,
  height,
  onTimeChange,
}: TimelineGroupBarProps) => {
  const barRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)

  const handleMouseDown = () => {
    isDragging.current = true
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
    document.body.style.cursor = "ew-resize"
    document.body.style.userSelect = "none"
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current || !barRef.current) return

    const container = barRef.current.parentElement
    if (!container) return

    const rect = container.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percent = Math.max(0, Math.min(1, x / rect.width))

    const newTime = startTime + (duration * percent)
    onTimeChange(newTime)
  }, [duration, startTime, onTimeChange])

  const handleMouseUp = useCallback(() => {
    isDragging.current = false
    document.removeEventListener("mousemove", handleMouseMove)
    document.removeEventListener("mouseup", handleMouseUp)
    document.body.style.cursor = ""
    document.body.style.userSelect = ""
  }, [handleMouseMove])

  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
  }, [handleMouseMove, handleMouseUp])

  const position = ((currentTime - startTime) / duration) * 100

  if (position < 0 || position > 100) return null

  return (
    <div
      ref={barRef}
      className="absolute cursor-ew-resize z-80 flex items-center justify-center"
      style={{
        left: `${position}%`,
        height: `${height + 35}px`,
        top: "-45px",
        width: "16px",
        transform: "translateX(-50%)",
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="w-[1px] h-full bg-white" />
    </div>
  )
}

export { TimelineGroupBar }
