import React, { useMemo } from "react"

import { useRootStore } from "@/hooks/use-root-store"

interface TimelineBarProps {
  startTime: number
  endTime: number
  height: number
}

export function TimelineBar({ startTime, endTime, height }: TimelineBarProps) {
  const { currentTime, setCurrentTime, scale, isPlaying } = useRootStore()

  const position = useMemo(() => {
    if (currentTime < startTime) return "-5px"
    if (currentTime > endTime) return "100%"
    const percent = ((currentTime - startTime) / (endTime - startTime)) * 100
    return `${percent}%`
  }, [currentTime, startTime, endTime])

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percent = clickX / rect.width
    const time = startTime + percent * (endTime - startTime)
    setCurrentTime(time, "user")
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
    const onMouseMove = (e: MouseEvent) => {
      const rect = document.getElementById("timeline-bar-container")?.getBoundingClientRect()
      if (!rect) return
      const mouseX = e.clientX - rect.left
      const percent = Math.max(0, Math.min(1, mouseX / rect.width))
      const time = startTime + percent * (endTime - startTime)
      setCurrentTime(time, "user")
    }

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove)
      document.removeEventListener("mouseup", onMouseUp)
    }

    document.addEventListener("mousemove", onMouseMove)
    document.addEventListener("mouseup", onMouseUp)
  }

  return (
    <div
      id="timeline-bar-container"
      className="absolute top-0 left-0 right-0 h-full pointer-events-none"
      style={{ height }}
    >
      {/* Невидимая полоса для перехода к нужному времени */}
      <div
        className="absolute top-0 left-0 w-full h-[30px] pointer-events-auto"
        onClick={handleClick}
      />

      <div
        className="absolute top-0 bottom-0 w-[3px] z-50 flex flex-col items-center cursor-col-resize group pointer-events-auto"
        style={{
          left: position,
          transform: "translateX(-50%)",
          height: "100%",
        }}
        onMouseDown={handleMouseDown}
      >
        {/* Cursor line - modified to be more stylish */}
        <div className="h-full w-[1px] bg-primary group-hover:bg-primary group-active:bg-primary/90 transition-colors">
          <div className="absolute top-0 w-3 h-5 -translate-x-[5px] overflow-visible">
            <svg
              viewBox="0 0 24 24"
              className="w-full h-full fill-primary drop-shadow-lg"
              style={{ filter: "drop-shadow(0 2px 3px rgba(0, 0, 0, 0.5))" }}
            >
              <path d="M12 4L4 15h16L12 4z" />
            </svg>
          </div>
          <div className="absolute bottom-0 w-3 h-5 -translate-x-[5px] overflow-visible rotate-180">
            <svg
              viewBox="0 0 24 24"
              className="w-full h-full fill-primary drop-shadow-lg"
              style={{ filter: "drop-shadow(0 2px 3px rgba(0, 0, 0, 0.5))" }}
            >
              <path d="M12 4L4 15h16L12 4z" />
            </svg>
          </div>
        </div>

        {/* Pulse effect when playing */}
        {isPlaying && (
          <div className="absolute top-[5px] w-[5px] h-[5px] rounded-full bg-primary animate-ping opacity-75"></div>
        )}

        {/* Timestamp tooltip */}
        <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 bg-popover text-popover-foreground px-2 py-1 rounded-md text-xs font-medium shadow-md opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity z-50">
          {formatTime(currentTime)}
        </div>
      </div>
    </div>
  )
}

function formatTime(seconds: number): string {
  const date = new Date(seconds * 1000)
  const hours = date.getUTCHours()
  const minutes = date.getUTCMinutes()
  const secs = date.getUTCSeconds()
  const ms = date.getUTCMilliseconds()

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(3, "0")}`
}
