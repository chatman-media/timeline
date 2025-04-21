import React, { useEffect, useMemo, useRef } from "react"

import { usePlayerContext } from "@/providers/player-provider"

interface TimelineBarProps {
  startTime: number
  endTime: number
  height?: number
}

export function TimelineBar({ startTime, endTime, height }: TimelineBarProps) {
  const { currentTime, setCurrentTime: setTime, isPlaying } = usePlayerContext()
  const animationFrameRef = useRef<number | undefined>(undefined)

  const position = useMemo(() => {
    if (currentTime < startTime) return "-5px"
    if (currentTime > endTime) return "100%"
    const percent = ((currentTime - startTime) / (endTime - startTime)) * 100
    return `${percent}%`
  }, [currentTime, startTime, endTime])

  // Эффект для анимации бара во время воспроизведения
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      return
    }

    let lastTime = performance.now()
    const animate = (now: number) => {
      const deltaTime = (now - lastTime) / 1000 // в секундах
      lastTime = now

      const newTime = currentTime + deltaTime
      // Если достигли конца секции, останавливаем анимацию
      if (newTime >= endTime) {
        setTime(endTime)
        return
      }
      setTime(newTime)

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isPlaying, endTime, setTime, currentTime])

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
    const onMouseMove = (e: MouseEvent) => {
      const rect = document.getElementById("timeline-bar-container")?.getBoundingClientRect()
      if (!rect) return
      const mouseX = e.clientX - rect.left
      const percent = Math.max(0, Math.min(1, mouseX / rect.width))
      const time = startTime + percent * (endTime - startTime)
      setTime(time)
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
      className="absolute top-0 right-0 left-0 h-full"
      style={{ height }}
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
