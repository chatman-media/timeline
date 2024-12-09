import { useEffect, useRef, useState } from "react"

import { useMedia } from "@/hooks/use-media"
import { formatTimeWithMilliseconds } from "@/lib/utils"

/**
 * Пропсы компонента TimelineBar
 */
interface TimelineBarProps {
  width: number
  height: number
  y: number
  duration: number
  startTime: number
  isGlobal?: boolean
  visible?: boolean
}

/**
 * Компонент вертикальной полосы прокрутки для временной шкалы
 * Позволяет визуализировать и управлять текущей позицией воспроизведения
 */
const TimelineBar = (
  { width, height, y, duration, startTime, isGlobal = false, visible = true }: TimelineBarProps,
): JSX.Element => {
  const [isDragging, setIsDragging] = useState(false)
  const [currentPosition, setCurrentPosition] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const { currentTime, timeToPercent, percentToTime, setCurrentTime } = useMedia()

  /**
   * Эффект для синхронизации визуальной позиции ползунка с текущим временем
   * Срабатывает при изменении currentTime, но игнорируется во время перетаскивания
   */
  useEffect(() => {
    if (!containerRef.current || isDragging) return
    const percent = timeToPercent(currentTime)
    const newPosition = (containerRef.current.offsetWidth * percent) / 100
    // Обновляем позицию только если изменение больше порогового значения (0.1px)
    // Это помогает избежать микро-обновлений и улучшает производительность
    if (Math.abs(newPosition - currentPosition) > 0.1) {
      setCurrentPosition(newPosition)
    }
  }, [currentTime, isDragging])

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    document.body.style.cursor = "ew-resize"
    e.preventDefault()
  }

  /**
   * Обработчик перемещения мыши при перетаскивании ползунка
   * Вычисляет новую позицию и обновляет время воспроизведения
   * @param e - Событие перемещения мыши
   */
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    // Ограничиваем позицию курсора границами контейнера
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))

    // Вычисляем время и проверяем границы timeRange
    const percentage = (x / rect.width) * 100
    const time = percentToTime(percentage)

    // Ограничиваем время пределами timeRange
    const clampedTime = Math.max(startTime, Math.min(startTime + duration, time))

    // Пересчитываем позицию с учетом ограничений
    const clampedPosition = ((clampedTime - startTime) / duration) * rect.width
    setCurrentPosition(clampedPosition)

    if (Math.abs(clampedTime - currentTime) > 0.01) {
      setCurrentTime(clampedTime)
    }
  }

  const handleMouseUp = (e: MouseEvent) => {
    setIsDragging(false)
    document.body.style.cursor = ""
    handleMouseMove(e)
  }

  useEffect(() => {
    if (isDragging) {
      globalThis.addEventListener("mousemove", handleMouseMove)
      globalThis.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      globalThis.removeEventListener("mousemove", handleMouseMove)
      globalThis.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging])

  return (visible
    ? (
      <div>
        <div
          ref={containerRef}
          className="relative w-full h-full"
        >
          <div
            className={`absolute cursor-ew-resize ${
              isGlobal ? "timeline-bar-global" : "timeline-bar-local"
            }`}
            style={{
              left: `${currentPosition}px`,
              top: isGlobal ? "0" : `${y}px`,
              width: `${width}px`,
              height: isGlobal ? "100%" : `${height}px`,
              backgroundColor: isGlobal ? "var(--primary)" : "red",
              transform: "translateX(-50%)",
              opacity: isGlobal ? 0.5 : 1,
              zIndex: isGlobal ? 50 : 1,
            }}
            onMouseDown={handleMouseDown}
          />
        </div>
        <div
          className="absolute top-[56px] left-0 text-sm text-gray-600 dark:text-gray-400 mt-2"
          style={{ transform: `translateX(${currentPosition}px)` }}
        >
          {formatTimeWithMilliseconds(currentTime, false, false, false)}
        </div>
      </div>
    )
    : <></>)
}

export default TimelineBar
