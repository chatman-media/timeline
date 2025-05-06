import React, { useMemo } from "react"

import { usePlayerContext } from "@/media-editor/media-player"

interface TimelineBarProps {
  startTime: number
  endTime: number
  height?: number
}

export function TimelineBar({ startTime, endTime, height }: TimelineBarProps) {
  const { currentTime, setCurrentTime: setTime } = usePlayerContext()

  const position = useMemo(() => {
    if (currentTime < startTime) return "-5px"
    if (currentTime > endTime) return "100%"
    const percent = ((currentTime - startTime) / (endTime - startTime)) * 100
    return `${percent}%`
  }, [currentTime, startTime, endTime])

  // Убираем эффект для анимации бара во время воспроизведения
  // Теперь бар будет двигаться только за счет обновления currentTime из плеера
  // Это предотвратит конфликты между разными источниками обновления времени

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>): void => {
    e.stopPropagation()
    const onMouseMove = (e: MouseEvent): void => {
      const rect = document.getElementById("timeline-bar-container")?.getBoundingClientRect()
      if (!rect) return
      const mouseX = e.clientX - rect.left
      const percent = Math.max(0, Math.min(1, mouseX / rect.width))
      const time = startTime + percent * (endTime - startTime)
      setTime(time)
    }

    const onMouseUp = (): void => {
      document.removeEventListener("mousemove", onMouseMove)
      document.removeEventListener("mouseup", onMouseUp)
    }

    document.addEventListener("mousemove", onMouseMove)
    document.addEventListener("mouseup", onMouseUp)
  }

  return (
    <div
      id="timeline-bar-container"
      className="absolute top-0 right-0 left-0 h-full"
      style={{ height: height || "100%" }}
    >
      <div
        className="group absolute top-0 bottom-0 z-[100] flex w-[3px] cursor-col-resize flex-col items-center"
        style={{
          left: position,
          transform: "translateX(-50%)",
          height: "100%",
        }}
        onMouseDown={handleMouseDown}
      >
        <div className="bg-primary group-hover:bg-primary group-active:bg-primary/90 h-full w-[1px] transition-colors">
          <div className="absolute top-0 h-5 w-3 -translate-x-[5px] overflow-visible">
            <svg
              viewBox="0 0 24 24"
              className="fill-primary h-full w-full drop-shadow-lg"
              style={{ filter: "drop-shadow(0 2px 3px rgba(0, 0, 0, 0.5))" }}
            >
              <path d="M12 4L4 15h16L12 4z" />
            </svg>
          </div>
          <div className="absolute bottom-0 h-5 w-3 -translate-x-[5px] rotate-180 overflow-visible">
            <svg
              viewBox="0 0 24 24"
              className="fill-primary h-full w-full drop-shadow-lg"
              style={{ filter: "drop-shadow(0 2px 3px rgba(0, 0, 0, 0.5))" }}
            >
              <path d="M12 4L4 15h16L12 4z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
