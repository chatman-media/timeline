import { useCallback, useEffect, useRef, useState } from "react"

import { usePlayerContext } from "@/media-editor/media-player"
import { useDisplayTime } from "@/media-editor/media-player/contexts"

interface TimelineBarProps {
  startTime: number
  endTime: number
  sectionStartTime: number
  sectionDuration: number
  height: number
  isActive?: boolean // Добавляем флаг активного сектора
}

// Интерфейс для параметров useSectionTime
interface SectionTimeProps {
  startTime: number
  endTime: number
  currentTime?: number
  displayTime?: number
  videoDuration?: number // Добавляем длительность видео
}

// Функция для расчета позиции и обработки перемещения курсора времени
function useSectionTime({
  startTime,
  endTime,
  currentTime: propCurrentTime,
  displayTime: propDisplayTime,
  videoDuration: propVideoDuration,
}: SectionTimeProps) {
  // Получаем значения из контекста
  const playerContext = usePlayerContext()
  const displayTimeContext = useDisplayTime()

  // Используем значения из пропсов, если они переданы, иначе из контекста
  const currentTime = propCurrentTime !== undefined ? propCurrentTime : playerContext.currentTime
  const displayTime =
    propDisplayTime !== undefined ? propDisplayTime : displayTimeContext.displayTime
  const setCurrentTime = playerContext.setCurrentTime
  const isPlaying = playerContext.isPlaying

  // Получаем длительность видео из пропсов или из контекста
  // Используем переданную длительность, длительность из контекста или 20 секунд по умолчанию
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const videoDuration = propVideoDuration || playerContext.duration || 20

  const [position, setPosition] = useState<number>(0)
  const isDraggingRef = useRef(false)
  const lastTimeRef = useRef<number>(currentTime)
  const positionRef = useRef<number>(0)

  // Функция для расчета позиции
  const calculatePosition = useCallback(() => {
    if (startTime === undefined || endTime === undefined) return

    const duration = endTime - startTime
    if (duration <= 0) {
      console.log(
        `[useSectionTime] Некорректная длительность: ${duration}, startTime: ${startTime}, endTime: ${endTime}`,
      )
      // Устанавливаем позицию в 0% для некорректной длительности
      if (positionRef.current !== 0) {
        positionRef.current = 0
        setPosition(0)
      }
      return
    }

    // Обновляем позицию при изменении displayTime
    // Это обеспечит плавное движение бара при воспроизведении
    if (displayTime !== undefined && displayTime > 0) {
      const newPosition = (displayTime / duration) * 100
      console.log(
        `[calculatePosition] displayTime=${displayTime.toFixed(2)}, duration=${duration.toFixed(2)}, newPosition=${newPosition.toFixed(2)}%, currentPosition=${positionRef.current.toFixed(2)}%`,
      )

      // Всегда обновляем позицию при изменении displayTime
      positionRef.current = newPosition
      setPosition(newPosition)
      return // Выходим из функции, так как позиция уже обновлена
    }

    // Обрабатываем Unix timestamp
    let effectiveCurrentTime = currentTime

    // Если currentTime - это Unix timestamp (больше года в секундах)
    if (currentTime > 365 * 24 * 60 * 60) {
      // Используем displayTime из контекста, который содержит относительное время
      effectiveCurrentTime = displayTime

      // Логируем только при изменении времени, чтобы избежать спама в консоли
      if (Math.abs(lastTimeRef.current - currentTime) > 0.01) {
        console.log(
          `[useSectionTime] Обнаружен Unix timestamp (${currentTime}), используем относительное время из контекста: ${effectiveCurrentTime}`,
        )
      }
    }

    // Принудительно обновляем позицию при изменении displayTime
    // Это необходимо для корректного движения бара при воспроизведении видео из сектора
    if (currentTime > 365 * 24 * 60 * 60) {
      // Всегда используем displayTime для Unix timestamp
      effectiveCurrentTime = displayTime

      // Логируем изменения displayTime
      if (Math.abs(lastTimeRef.current - displayTime) > 0.01) {
        console.log(`[useSectionTime] Обновление позиции по displayTime: ${displayTime.toFixed(2)}`)
        lastTimeRef.current = displayTime
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
    let relativeTime = 0
    let positionPercent = 0

    // Для всех случаев используем единый подход к расчету позиции
    // Это обеспечит корректное соответствие масштабу дорожки
    if (currentTime > 365 * 24 * 60 * 60) {
      // Для Unix timestamp используем displayTime как относительное время от startTime
      // Это обеспечит корректное соответствие масштабу дорожки

      // Рассчитываем позицию как процент от длительности секции
      const sectionDuration = endTime - startTime

      // Проверяем, что длительность секции корректная
      if (sectionDuration <= 0) {
        console.log(`[useSectionTime] Некорректная длительность секции: ${sectionDuration}`)
        positionPercent = 0
      } else {
        // Рассчитываем позицию как процент от длительности секции
        // Используем displayTime как относительное время от начала секции
        positionPercent = (displayTime / sectionDuration) * 100

        // Ограничиваем позицию в пределах 0-100%
        positionPercent = Math.max(0, Math.min(100, positionPercent))

        console.log(
          `[useSectionTime] Расчет позиции для Unix timestamp: displayTime=${displayTime.toFixed(2)}, sectionDuration=${sectionDuration.toFixed(2)}, positionPercent=${positionPercent.toFixed(2)}%, startTime=${startTime}, endTime=${endTime}`,
        )
      }
    } else {
      // Для обычного времени используем displayTime вместо currentTime
      // Это обеспечит корректное движение бара при воспроизведении

      // Проверяем, что displayTime определено
      if (displayTime !== undefined && displayTime > 0) {
        // Используем displayTime как относительное время от начала секции
        positionPercent = (displayTime / duration) * 100

        console.log(
          `[useSectionTime] Расчет позиции с displayTime: displayTime=${displayTime.toFixed(2)}, startTime=${startTime}, duration=${duration}, positionPercent=${positionPercent.toFixed(2)}%`,
        )
      } else {
        // Если displayTime не определено, используем стандартный расчет
        relativeTime = effectiveCurrentTime - startTime
        positionPercent = (relativeTime / duration) * 100

        console.log(
          `[useSectionTime] Расчет позиции для обычного времени: currentTime=${effectiveCurrentTime}, startTime=${startTime}, duration=${duration}, positionPercent=${positionPercent.toFixed(2)}%`,
        )
      }
    }

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

  // Обновляем позицию при изменении currentTime или displayTime
  useEffect(() => {
    // Если перетаскивание активно, не обновляем позицию
    if (isDraggingRef.current) return

    // Сохраняем текущее время для следующего сравнения
    if (currentTime > 365 * 24 * 60 * 60) {
      // Для Unix timestamp сохраняем displayTime
      lastTimeRef.current = displayTime
    } else {
      // Для обычного времени сохраняем currentTime
      lastTimeRef.current = currentTime
    }

    // Вызываем функцию расчета позиции
    calculatePosition()

    // Используем requestAnimationFrame только при воспроизведении
    if (isPlaying) {
      console.log(
        `[TimelineBar] Запускаем анимацию для обновления позиции (isPlaying=${isPlaying})`,
      )

      // Используем requestAnimationFrame для более плавного обновления, но с ограничением частоты
      let animationFrameId: number
      let lastUpdateTime = 0
      const updateInterval = 16 // Уменьшаем интервал до 16 мс (примерно 60 FPS) для более плавного движения

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
    }
  }, [currentTime, displayTime, calculatePosition, isPlaying])

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
      // Не учитываем смещение, так как левая панель удалена
      const x = moveEvent.clientX - rect.left
      const width = rect.width

      // Проверяем, что x находится в допустимом диапазоне
      if (x < 0) {
        console.log(`[TimelineBar] Перетаскивание за левую границу: x=${x}`)
        return
      }

      // Рассчитываем новое время (с учетом смещения)
      const percent = Math.max(0, Math.min(1, x / width))

      // Проверяем, используем ли мы Unix timestamp
      const isUnixTimestamp = currentTime > 365 * 24 * 60 * 60

      let newTime
      if (isUnixTimestamp) {
        // Для Unix timestamp используем процент от длительности секции
        const sectionDuration = endTime - startTime

        // Рассчитываем новое время воспроизведения
        const newDisplayTime = percent * sectionDuration
        console.log(
          `[TimelineBar] Перетаскивание для Unix timestamp: percent=${percent.toFixed(2)}, sectionDuration=${sectionDuration.toFixed(2)}, newDisplayTime=${newDisplayTime.toFixed(2)}, startTime=${startTime}, endTime=${endTime}`,
        )

        // Обновляем displayTime через контекст
        if (displayTimeContext && displayTimeContext.setDisplayTime) {
          displayTimeContext.setDisplayTime(newDisplayTime)
          console.log(
            `[TimelineBar] Установлен displayTime через контекст: ${newDisplayTime.toFixed(2)}`,
          )
        }

        // Сохраняем тот же Unix timestamp
        newTime = currentTime
      } else {
        // Для обычного времени используем стандартный расчет
        const duration = endTime - startTime
        newTime = startTime + percent * duration
        console.log(
          `[TimelineBar] Перетаскивание для обычного времени: percent=${percent.toFixed(2)}, duration=${duration.toFixed(2)}, newTime=${newTime.toFixed(2)}, startTime=${startTime}, endTime=${endTime}`,
        )
      }

      // Логируем для отладки
      console.log(
        `[TimelineBar] Перетаскивание: x=${x}, width=${width}, percent=${percent.toFixed(2)}, newTime=${newTime.toFixed(2)}, isUnixTimestamp=${isUnixTimestamp}`,
      )

      // Устанавливаем новое время для обычного времени (не Unix timestamp)
      if (!isUnixTimestamp) {
        setCurrentTime(newTime)
        console.log(`[TimelineBar] Установлено новое время: ${newTime.toFixed(2)}`)
      }
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

export function TimelineBar({
  sectionStartTime,
  sectionDuration,
  height,
  isActive = false,
}: TimelineBarProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { currentTime, duration } = usePlayerContext()
  const { displayTime } = useDisplayTime()

  // Получаем длительность видео из контекста
  const videoDuration = duration || sectionDuration || 20 // Используем длительность видео, длительность секции или 20 секунд по умолчанию

  // Проверяем и корректируем параметры секции
  const effectiveSectionStartTime = sectionStartTime || 0
  const effectiveSectionDuration = sectionDuration || 20 // Используем 20 секунд по умолчанию, если длительность не задана

  // Определяем, используем ли мы Unix timestamp
  const isUnixTimestamp = currentTime > 365 * 24 * 60 * 60

  // Для Unix timestamp используем относительные значения для startTime и endTime
  // Для Unix timestamp используем реальные значения startTime и endTime
  // Это обеспечит корректное соответствие масштабу дорожки
  const normalizedStartTime = effectiveSectionStartTime
  const normalizedEndTime = effectiveSectionStartTime + effectiveSectionDuration

  // Используем useSectionTime с передачей displayTime для корректной работы с видео из сектора
  // Но только если сектор активен
  const { position, handleMouseDown } = useSectionTime({
    startTime: normalizedStartTime,
    endTime: normalizedEndTime,
    currentTime: isActive ? currentTime : 0, // Передаем currentTime только для активного сектора
    displayTime: isActive ? displayTime : 0, // Передаем displayTime только для активного сектора
    videoDuration: videoDuration, // Передаем длительность видео
  })

  // Если позиция отрицательная, устанавливаем ее в 0
  const displayPosition = position < 0 ? 0 : position

  // Добавляем отладочную информацию для активного сектора только при изменении
  useEffect(() => {
    if (isActive) {
      console.log(
        `[TimelineBar] Активный сектор: ${isActive}, normalizedStartTime: ${normalizedStartTime}, normalizedEndTime: ${normalizedEndTime}, displayTime: ${displayTime}, position: ${position}%, displayPosition: ${displayPosition}%, videoDuration: ${videoDuration}`,
      )
    }
  }, [
    isActive,
    normalizedStartTime,
    normalizedEndTime,
    displayTime,
    position,
    displayPosition,
    videoDuration,
  ])

  // Добавляем логирование для отладки только при изменении параметров секции
  useEffect(() => {
    console.log(
      `TimelineBar: normalizedStartTime=${normalizedStartTime}, normalizedEndTime=${normalizedEndTime}, isUnixTimestamp=${isUnixTimestamp}, isActive=${isActive}, videoDuration=${videoDuration}`,
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedStartTime, normalizedEndTime, isActive, videoDuration])

  // Добавляем логирование для отладки времени
  useEffect(() => {
    if (isActive && currentTime > 365 * 24 * 60 * 60) {
      console.log(
        `TimelineBar: currentTime=${currentTime} (Unix timestamp), displayTime=${displayTime.toFixed(2)}, position=${position.toFixed(2)}%, displayPosition=${displayPosition.toFixed(2)}%, isActive=${isActive}, videoDuration=${videoDuration.toFixed(2)}`,
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime, displayTime, position, displayPosition, isActive, videoDuration])

  // Определяем цвет бара в зависимости от активности сектора
  const barColor = isActive ? "bg-red-600" : "bg-gray-400"
  const borderColor = isActive ? "border-t-red-600" : "border-t-gray-400"
  const barWidth = isActive ? "w-[3px]" : "w-[2px]" // Увеличиваем ширину активного бара

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0"
      style={{ zIndex: 400 }}
    >
      <div
        className={`pointer-events-auto absolute flex cursor-ew-resize flex-col items-center hover:opacity-90 ${isActive ? "" : "opacity-50"}`}
        style={{
          left: `calc(${displayPosition}% + 10px)` /* Добавляем отступ 10px для выравнивания с дорожками */,
          top: "-30px" /* Поднимаем бар, чтобы он был виден на шкале */,
          transform: "translateX(-50%)",
          height: `${height + 40}px` /* Увеличиваем высоту, чтобы бар доставал до шкалы */,
          zIndex: 400 /* Увеличиваем z-index, чтобы бар был поверх шкалы */,
        }}
        onMouseDown={handleMouseDown}
      >
        <div className="flex flex-col items-center" style={{ zIndex: 400 }}>
          <div className={`h-[6px] w-[10px] ${barColor}`} style={{ zIndex: 400 }} />
          <div
            className={`h-0 w-0 border-t-[5px] border-r-[5px] border-l-[5px] ${borderColor} border-r-transparent border-l-transparent`}
            style={{ zIndex: 400 }}
          />
        </div>
        <div className={`mt-[-2px] ${barWidth} flex-1 ${barColor}`} style={{ zIndex: 400 }} />
      </div>
    </div>
  )
}
