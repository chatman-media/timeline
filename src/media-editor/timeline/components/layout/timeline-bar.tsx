import { useCallback, useEffect, useRef, useState } from "react"

import { usePlayerContext } from "@/media-editor/media-player"
import { useDisplayTime } from "@/media-editor/media-player/contexts"

interface TimelineBarProps {
  startTime: number
  endTime: number
  sectionStartTime: number
  sectionDuration: number
  height: number
}

// Интерфейс для параметров useSectionTime
interface SectionTimeProps {
  startTime: number
  endTime: number
  currentTime?: number
  displayTime?: number
}

// Функция для расчета позиции и обработки перемещения курсора времени
function useSectionTime({
  startTime,
  endTime,
  currentTime: propCurrentTime,
  displayTime: propDisplayTime,
}: SectionTimeProps) {
  // Получаем значения из контекста
  const playerContext = usePlayerContext()
  const displayTimeContext = useDisplayTime()

  // Используем значения из пропсов, если они переданы, иначе из контекста
  const currentTime = propCurrentTime !== undefined ? propCurrentTime : playerContext.currentTime
  const displayTime =
    propDisplayTime !== undefined ? propDisplayTime : displayTimeContext.displayTime
  const setCurrentTime = playerContext.setCurrentTime

  const [position, setPosition] = useState<number>(0)
  const isDraggingRef = useRef(false)
  const lastTimeRef = useRef<number>(currentTime)
  const positionRef = useRef<number>(0)

  // Функция для расчета позиции
  const calculatePosition = useCallback(() => {
    if (startTime === undefined || endTime === undefined) return

    const duration = endTime - startTime
    if (duration <= 0) return

    // Обрабатываем Unix timestamp
    let effectiveCurrentTime = currentTime

    // Если currentTime - это Unix timestamp (больше года в секундах)
    if (currentTime > 365 * 24 * 60 * 60) {
      // Используем displayTime из контекста, который содержит относительное время
      effectiveCurrentTime = displayTime

      // Логируем только при изменении времени, чтобы избежать спама в консоли
      if (Math.abs(lastTimeRef.current - currentTime) > 0.01) {
        console.log(
          `TimelineBar: Обнаружен Unix timestamp (${currentTime}), используем относительное время из контекста: ${effectiveCurrentTime}`,
        )
      }
    }

    // Проверяем, находится ли effectiveCurrentTime в пределах секции
    if (effectiveCurrentTime < startTime) {
      // Если время меньше начала секции, устанавливаем позицию в 0%
      if (positionRef.current !== 0) {
        console.log(
          `TimelineBar: effectiveCurrentTime=${effectiveCurrentTime.toFixed(2)} меньше startTime=${startTime.toFixed(2)}, устанавливаем позицию в 0%`,
        )
        positionRef.current = 0
        setPosition(0)
      }
      return
    }

    if (effectiveCurrentTime > endTime) {
      // Если время больше конца секции, устанавливаем позицию в 100%
      if (positionRef.current !== 100) {
        console.log(
          `TimelineBar: effectiveCurrentTime=${effectiveCurrentTime.toFixed(2)} больше endTime=${endTime.toFixed(2)}, устанавливаем позицию в 100%`,
        )
        positionRef.current = 100
        setPosition(100)
      }
      return
    }

    // Рассчитываем позицию в процентах
    const relativeTime = effectiveCurrentTime - startTime
    const positionPercent = (relativeTime / duration) * 100

    // Ограничиваем позицию в пределах 0-100%
    const clampedPosition = Math.max(0, Math.min(100, positionPercent))

    // Проверяем, изменилась ли позиция существенно
    if (Math.abs(clampedPosition - positionRef.current) < 0.1) return

    // Логируем для отладки
    console.log(
      `TimelineBar: effectiveCurrentTime=${effectiveCurrentTime.toFixed(2)}, position=${clampedPosition.toFixed(2)}%`,
    )

    // Сохраняем позицию в ref для сравнения
    positionRef.current = clampedPosition

    // Обновляем состояние
    setPosition(clampedPosition)
  }, [currentTime, displayTime, startTime, endTime])

  // Обновляем позицию при изменении currentTime
  useEffect(() => {
    // Сохраняем текущее время для следующего сравнения
    lastTimeRef.current = currentTime

    // Вызываем функцию расчета позиции
    calculatePosition()

    // Используем requestAnimationFrame для более плавного обновления, но с ограничением частоты
    let animationFrameId: number
    let lastUpdateTime = 0
    const updateInterval = 100 // Обновляем не чаще чем раз в 100 мс

    const updatePosition = (timestamp: number) => {
      // Ограничиваем частоту обновлений
      if (timestamp - lastUpdateTime >= updateInterval) {
        lastUpdateTime = timestamp
        calculatePosition()
      }

      animationFrameId = requestAnimationFrame(updatePosition)
    }

    // Запускаем анимацию
    animationFrameId = requestAnimationFrame(updatePosition)

    return () => {
      // Останавливаем анимацию при размонтировании
      cancelAnimationFrame(animationFrameId)
    }
  }, [currentTime, calculatePosition])

  // Обработчик начала перетаскивания
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    isDraggingRef.current = true

    // Обработчик перемещения мыши
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return

      const container = (e.target as HTMLElement).closest(".relative")
      if (!container) return

      const rect = container.getBoundingClientRect()
      // Учитываем смещение в 120 пикселей при расчете позиции
      const x = moveEvent.clientX - rect.left - 120
      const width = rect.width - 120

      // Проверяем, что x находится в допустимом диапазоне
      if (x < 0) {
        console.log(`[TimelineBar] Перетаскивание за левую границу: x=${x}`)
        return
      }

      // Рассчитываем новое время (с учетом смещения)
      const percent = Math.max(0, Math.min(1, x / width))
      const duration = endTime - startTime
      const newTime = startTime + percent * duration

      // Логируем для отладки
      console.log(
        `[TimelineBar] Перетаскивание: x=${x}, width=${width}, percent=${percent.toFixed(2)}, newTime=${newTime.toFixed(2)}`,
      )

      // Устанавливаем новое время
      setCurrentTime(newTime)
    }

    // Обработчик отпускания кнопки мыши
    const handleMouseUp = () => {
      isDraggingRef.current = false
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  return { position, handleMouseDown }
}

export function TimelineBar({ sectionStartTime, sectionDuration, height }: TimelineBarProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Используем useSectionTime напрямую, без передачи контекстов
  const { position, handleMouseDown } = useSectionTime({
    startTime: sectionStartTime,
    endTime: sectionStartTime + sectionDuration,
  })

  // Добавляем логирование для отладки только при изменении параметров секции
  useEffect(() => {
    console.log(
      `TimelineBar: sectionStartTime=${sectionStartTime}, sectionDuration=${sectionDuration}`,
    )
  }, [sectionStartTime, sectionDuration])

  if (position < 0) return null

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0">
      <div
        className="pointer-events-auto absolute z-50 flex cursor-ew-resize flex-col items-center hover:opacity-90"
        style={{
          left: `calc(120px + ${position}%)`,
          top: "0",
          transform: "translateX(-50%)",
          height: `${height + 70}px`,
        }}
        onMouseDown={handleMouseDown}
      >
        <div className="flex flex-col items-center">
          <div className="h-[6px] w-[10px] bg-red-600" />
          <div className="h-0 w-0 border-t-[5px] border-r-[5px] border-l-[5px] border-t-red-600 border-r-transparent border-l-transparent" />
        </div>
        <div className="mt-[-2px] w-[2px] flex-1 bg-red-600" />
      </div>
    </div>
  )
}
