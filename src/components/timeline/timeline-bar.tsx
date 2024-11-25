import { SeekbarState } from "@/types/timeline"
import { useRef, useState, useEffect } from "react"
import { formatTimeWithMilliseconds } from "@/lib/utils"

/**
 * Пропсы компонента TimelineBar
 */
interface TimelineBarProps {
  t: number // Текущая позиция по времени
  width: number // Ширина полосы
  height: number // Высота полосы
  y: number // Начальная позиция по вертикали
  duration: number // Длительность видео
  startTime: number // Начальное время
  updateSeekbar: (data: Partial<SeekbarState> & { timestamp?: number }) => void // Функция обновления состояния полосы
}

/**
 * Компонент вертикальной полосы прокрутки для временной шкалы
 * Позволяет визуализировать и управлять текущей позицией воспроизведения
 */
const TimelineBar = (
  { t, width, height, y, duration, startTime, updateSeekbar }: TimelineBarProps,
): JSX.Element => {
  const [isDragging, setIsDragging] = useState(false)
  const [displayTime, setDisplayTime] = useState(startTime)
  const containerRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState(t)

  useEffect(() => {
    setPosition(t)
  }, [t])

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    document.body.style.cursor = 'ew-resize'
    e.preventDefault()
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    const percentage = x / rect.width
    const time = startTime + (percentage * duration)
    
    setPosition(x)
    setDisplayTime(time)
  }

  const handleMouseUp = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return

    setIsDragging(false)
    document.body.style.cursor = ''

    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    const percentage = x / rect.width
    const time = startTime + (percentage * duration)

    updateSeekbar({
      x,
      y,
      timestamp: time,
    })
  }

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  return (
    <div>
      <div 
        ref={containerRef} 
        className="relative"
      >
        <div
          className="absolute cursor-ew-resize"
          style={{
            left: `${position}px`,
            top: `${y}px`,
            width: `${width}px`,
            height: `${height}px`,
            backgroundColor: 'currentColor',
            transform: 'translateX(-50%)',
          }}
          onMouseDown={handleMouseDown}
        />
      </div>
      <div
        className="absolute top-[56px] left-0 text-sm text-gray-600 dark:text-gray-400 mt-2"
        style={{ transform: `translateX(${position}px)` }}
      >
        {formatTimeWithMilliseconds(displayTime)}
      </div>
    </div>
  )
}

export default TimelineBar
