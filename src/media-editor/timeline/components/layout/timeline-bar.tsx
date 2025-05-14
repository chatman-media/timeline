import { useCallback, useEffect, useRef, useState } from "react"

import { usePlayerContext } from "@/media-editor/media-player"
import { useDisplayTime } from "@/media-editor/media-player/contexts"
import { useTimeline } from "@/media-editor/timeline/services"

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
}

// Функция для расчета позиции и обработки перемещения курсора времени
function useSectionTime({
  startTime,
  endTime,
  currentTime: propCurrentTime,
  displayTime: propDisplayTime,
}: SectionTimeProps) {
  // Используем sectorTimes из глобальной переменной
  // Получаем значения из контекста
  const playerContext = usePlayerContext()
  const displayTimeContext = useDisplayTime()
  const timelineContext = useTimeline()

  // Используем значения из пропсов, если они переданы, иначе из контекста
  const currentTime = propCurrentTime !== undefined ? propCurrentTime : playerContext.currentTime
  const displayTime =
    propDisplayTime !== undefined ? propDisplayTime : displayTimeContext.displayTime
  const setCurrentTime = playerContext.setCurrentTime
  const seek = timelineContext.seek
  const isPlaying = playerContext.isPlaying

  // Получаем длительность видео из пропсов или из контекста
  // Но не используем ее в этой функции

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

    // Если displayTime равно 0, но есть сохраненное время для этого сектора,
    // используем сохраненное время
    if (displayTime === 0 && sectorTimes && Object.keys(sectorTimes).length > 0) {
      // Получаем дату сектора из currentTime, если это Unix timestamp
      const sectorDate =
        currentTime > 365 * 24 * 60 * 60
          ? new Date(currentTime * 1000).toISOString().split("T")[0]
          : null

      if (sectorDate && sectorTimes[sectorDate] !== undefined) {
        effectiveCurrentTime = sectorTimes[sectorDate]
        console.log(
          `[useSectionTime] Используем сохраненное время ${effectiveCurrentTime.toFixed(2)} для сектора ${sectorDate}`,
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
        // Используем видео из контекста, переданного в параметрах
        const video = playerContext.video

        // Если есть активное видео с startTime, учитываем его при расчете позиции
        if (video && video.startTime && video.startTime > 0) {
          // Используем точно такой же алгоритм расчета, как в VideoItem
          // Рассчитываем позицию в процентах от ширины секции
          const videoStartTime = video.startTime || 0
          const relativeDisplayTime = displayTime || 0

          // Рассчитываем позицию как процент от длительности секции
          // Используем точно такую же формулу, как в VideoItem
          positionPercent = Math.max(
            0,
            Math.min(
              100,
              ((videoStartTime - startTime + relativeDisplayTime) / sectionDuration) * 100,
            ),
          )

          console.log(
            `[useSectionTime] Расчет позиции для видео из таймлайна: videoStartTime=${videoStartTime.toFixed(2)}, startTime=${startTime.toFixed(2)}, relativeDisplayTime=${relativeDisplayTime.toFixed(2)}, sectionDuration=${sectionDuration.toFixed(2)}, positionPercent=${positionPercent.toFixed(2)}%`,
          )

          // Принудительно обновляем позицию, если displayTime равен 0
          // Это нужно для корректного позиционирования бара при клике на видео
          if (relativeDisplayTime === 0) {
            console.log(`[useSectionTime] Принудительное обновление позиции для displayTime=0`)
            positionPercent = Math.max(
              0,
              Math.min(100, ((videoStartTime - startTime) / sectionDuration) * 100),
            )
          }
        } else {
          // Рассчитываем позицию как процент от длительности секции
          // Используем displayTime как относительное время от начала секции
          positionPercent = (displayTime / sectionDuration) * 100
        }

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
  }, [currentTime, displayTime, startTime, endTime, seek, setCurrentTime])

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
  }, [currentTime, displayTime, calculatePosition, isPlaying, seek, setCurrentTime])

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
      // Не учитываем отступ, так как он уже учтен в позиции видео
      const x = moveEvent.clientX - rect.left
      const width = rect.width

      // Проверяем, что x находится в допустимом диапазоне
      if (x < 0) {
        console.log(`[TimelineBar] Перетаскивание за левую границу: x=${x}`)
        return
      }

      // Рассчитываем новое время (с учетом смещения)
      const percent = Math.max(0, Math.min(1, x / width))

      // Определяем, используем ли мы Unix timestamp
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

        // Вычисляем абсолютное время для seek
        const videoStartTime = playerContext.video?.startTime || 0
        const absoluteTime = videoStartTime + newDisplayTime

        // Вызываем seek с абсолютным временем
        seek(absoluteTime)
        console.log(
          `[TimelineBar] Вызвана функция seek с абсолютным временем: ${absoluteTime.toFixed(2)} (startTime=${videoStartTime}, displayTime=${newDisplayTime.toFixed(2)})`,
        )

        // Обновляем currentTime в контексте плеера
        // Это нужно для обновления элементов управления плеером
        setCurrentTime(absoluteTime)
        console.log(
          `[TimelineBar] Обновлен currentTime в контексте плеера: ${absoluteTime.toFixed(2)}`,
        )

        // Сохраняем тот же Unix timestamp для совместимости
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

      // Устанавливаем новое время в зависимости от типа времени
      if (isUnixTimestamp) {
        // Для Unix timestamp уже вызвали seek выше
      } else {
        // Для обычного времени вызываем и setCurrentTime, и seek
        setCurrentTime(newTime)
        console.log(
          `[TimelineBar] Установлено новое время через setCurrentTime: ${newTime.toFixed(2)}`,
        )

        // Вызываем seek из контекста таймлайна для обновления времени видео
        seek(newTime)
        console.log(`[TimelineBar] Вызвана функция seek с временем: ${newTime.toFixed(2)}`)
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

// Объект для хранения времени для каждого сектора
// Используем глобальную переменную, чтобы сохранять время между рендерами
// Экспортируем, чтобы использовать в функции useSectionTime
export const sectorTimes: Record<string, number> = {}

export function TimelineBar({
  sectionStartTime,
  sectionDuration,
  height,
  isActive = false,
}: TimelineBarProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { currentTime, video } = usePlayerContext()
  const { displayTime } = useDisplayTime()

  // Получаем дату сектора из видео, если оно есть
  const sectorDate = video?.startTime
    ? new Date(video.startTime * 1000).toISOString().split("T")[0]
    : null

  // Добавляем логирование для отладки
  useEffect(() => {
    if (video) {
      console.log(
        `[TimelineBar] Видео: ${video.id}, startTime=${video.startTime}, displayTime=${displayTime}, isActive=${isActive}`,
      )

      // Если есть дата сектора, сохраняем текущее displayTime для этого сектора
      // Сохраняем время для всех секторов, не только для активного
      if (sectorDate && displayTime > 0) {
        sectorTimes[sectorDate] = displayTime
        console.log(
          `[TimelineBar] Сохранено время ${displayTime.toFixed(2)} для сектора ${sectorDate}, isActive=${isActive}`,
        )
      }
    }
  }, [video, displayTime, sectorDate, isActive])

  // Длительность видео доступна через duration, но не используется напрямую в этом компоненте

  // Проверяем и корректируем параметры секции
  const effectiveSectionStartTime = sectionStartTime || 0
  const effectiveSectionDuration = sectionDuration || 20 // Используем 20 секунд по умолчанию, если длительность не задана

  // Получаем функции из контекста
  const { setCurrentTime } = usePlayerContext()
  const { setDisplayTime } = useDisplayTime()
  const { seek } = useTimeline()

  // Эффект для обработки события preserve-sectors-state
  useEffect(() => {
    const handlePreserveSectorsState = (e: CustomEvent) => {
      const { currentSectorDate, newSectorDate } = e.detail || {}

      // Если это наш сектор и он не активен, сохраняем его состояние
      if (sectorDate && sectorDate !== newSectorDate) {
        console.log(
          `[TimelineBar] Сохраняем состояние сектора ${sectorDate} при переключении с ${currentSectorDate} на ${newSectorDate}`,
        )

        // Сохраняем текущее время для этого сектора
        if (displayTime > 0) {
          sectorTimes[sectorDate] = displayTime
          console.log(
            `[TimelineBar] Сохранено время ${displayTime.toFixed(2)} для сектора ${sectorDate} при переключении`,
          )
        }
      }
    }

    // Добавляем слушатель события
    window.addEventListener("preserve-sectors-state", handlePreserveSectorsState as EventListener)

    return () => {
      // Удаляем слушатель события при размонтировании
      window.removeEventListener(
        "preserve-sectors-state",
        handlePreserveSectorsState as EventListener,
      )
    }
  }, [sectorDate, displayTime])

  // Эффект для восстановления времени при активации сектора
  useEffect(() => {
    // Восстанавливаем время только при активации сектора
    if (isActive && sectorDate && sectorTimes[sectorDate] !== undefined) {
      const savedTime = sectorTimes[sectorDate]

      // Обновляем displayTime
      if (savedTime !== displayTime) {
        console.log(
          `[TimelineBar] Восстановлено время ${savedTime.toFixed(2)} для сектора ${sectorDate}`,
        )

        // Обновляем displayTime через контекст
        setDisplayTime(savedTime)

        // Вычисляем абсолютное время для seek
        if (video?.startTime) {
          const videoStartTime = video.startTime
          const absoluteTime = videoStartTime + savedTime

          // Вызываем seek с абсолютным временем
          seek(absoluteTime)

          // Обновляем currentTime в контексте плеера
          setCurrentTime(absoluteTime)

          console.log(
            `[TimelineBar] Установлено абсолютное время ${absoluteTime.toFixed(2)} для сектора ${sectorDate}`,
          )
        }
      }
    }
  }, [isActive, sectorDate, displayTime, video, setDisplayTime, seek, setCurrentTime])

  // Для Unix timestamp используем относительные значения для startTime и endTime
  // Для обычного времени используем реальные значения startTime и endTime
  // Это обеспечит корректное соответствие масштабу дорожки
  const normalizedStartTime = effectiveSectionStartTime
  const normalizedEndTime = effectiveSectionStartTime + effectiveSectionDuration

  // Используем useSectionTime с передачей displayTime для корректной работы с видео из сектора
  // Для неактивных секторов используем сохраненное время
  const savedDisplayTime =
    sectorDate && sectorTimes[sectorDate] !== undefined ? sectorTimes[sectorDate] : displayTime

  // Создаем собственный обработчик для перемещения бара
  const handleBarMouseDown = (e: React.MouseEvent) => {
    // Если сектор неактивен, сначала делаем его активным
    if (!isActive && sectorDate) {
      // Сохраняем текущее состояние всех секторов
      console.log(`[TimelineBar] Сохраняем состояние всех секторов перед активацией ${sectorDate}`)

      // Отправляем событие для активации сектора
      window.dispatchEvent(
        new CustomEvent("activate-sector", {
          detail: {
            sectorDate,
            preserveOtherSectors: true, // Флаг для сохранения состояния других секторов
          },
        }),
      )

      // Логируем активацию сектора
      console.log(`[TimelineBar] Активируем сектор ${sectorDate}`)

      // Затем продолжаем с перемещением бара
      setTimeout(() => {
        // Получаем обработчик перемещения из useSectionTime
        const { handleMouseDown } = useSectionTime({
          startTime: normalizedStartTime,
          endTime: normalizedEndTime,
          currentTime: currentTime,
          displayTime: savedDisplayTime,
        })

        // Вызываем обработчик перемещения
        if (handleMouseDown) {
          handleMouseDown(e)
        }
      }, 100)
    } else {
      // Если сектор уже активен, просто вызываем обработчик перемещения
      handleMouseDown(e)
    }
  }

  // Получаем позицию из useSectionTime
  const { position, handleMouseDown } = useSectionTime({
    startTime: normalizedStartTime,
    endTime: normalizedEndTime,
    currentTime: currentTime, // Всегда передаем currentTime
    displayTime: isActive ? displayTime : savedDisplayTime, // Для неактивных секторов используем сохраненное время
  })

  // Добавляем логирование для отладки позиции
  useEffect(() => {
    // Логируем позицию для всех секторов, не только для активных
    const effectiveDisplayTime = isActive ? displayTime : savedDisplayTime
    console.log(
      `[TimelineBar] Позиция бара: ${position}%, displayTime=${effectiveDisplayTime}, currentTime=${currentTime}, isActive=${isActive}, sectorDate=${sectorDate}`,
    )
  }, [isActive, position, displayTime, currentTime, savedDisplayTime, sectorDate])

  // Если позиция отрицательная, устанавливаем ее в 0
  const displayPosition = position < 0 ? 0 : position
  // Определяем цвет бара в зависимости от активности сектора
  const barColor = isActive ? "bg-red-600" : "bg-gray-400"
  const borderColor = isActive ? "border-t-red-600" : "border-t-gray-400"
  const barWidth = isActive ? "w-[3px]" : "w-[2px]" // Увеличиваем ширину активного бара

  // Рассчитываем позицию бара так же, как и для видео
  // Если есть видео, используем его startTime
  let barPosition = displayPosition
  if (video && video.startTime !== undefined) {
    const videoStartTime = video.startTime || 0
    const sectionDuration = normalizedEndTime - normalizedStartTime

    // Проверяем, есть ли displayTime и находится ли оно в пределах видео
    // Для неактивных секторов используем сохраненное время
    const effectiveDisplayTime = isActive ? displayTime : savedDisplayTime

    if (effectiveDisplayTime > 0) {
      // Используем формулу с учетом displayTime
      barPosition = Math.max(
        0,
        Math.min(
          100,
          ((videoStartTime - normalizedStartTime + effectiveDisplayTime) / sectionDuration) * 100,
        ),
      )

      console.log(
        `[TimelineBar] Позиция бара для видео с displayTime: ${barPosition}%, videoStartTime=${videoStartTime}, normalizedStartTime=${normalizedStartTime}, displayTime=${effectiveDisplayTime}, sectionDuration=${sectionDuration}, isActive=${isActive}`,
      )
    } else {
      // Используем ту же формулу, что и в VideoItem, без учета displayTime
      barPosition = Math.max(
        0,
        Math.min(100, ((videoStartTime - normalizedStartTime) / sectionDuration) * 100),
      )

      console.log(
        `[TimelineBar] Позиция бара для видео без displayTime: ${barPosition}%, videoStartTime=${videoStartTime}, normalizedStartTime=${normalizedStartTime}, sectionDuration=${sectionDuration}`,
      )
    }
  }

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0"
      style={{ zIndex: 400 }}
    >
      <div
        className={`pointer-events-auto absolute flex cursor-ew-resize flex-col items-center hover:opacity-90 ${isActive ? "" : "opacity-50"}`}
        style={{
          left: `${barPosition}%`,
          top: "-33px",
          transform: "translateX(-50%)",
          height: `${height}px`,
          zIndex: 400,
        }}
        // Добавляем дополнительные атрибуты для отладки
        data-position={barPosition}
        data-video-id={video?.id}
        data-active={isActive}
        data-sector-date={sectorDate}
        onMouseDown={handleBarMouseDown}
      >
        {/* Верхняя часть индикатора (треугольник) */}
        <div className="flex flex-col items-center" style={{ zIndex: 400 }}>
          <div className={`h-[6px] w-[10px] ${barColor}`} style={{ zIndex: 400 }} />
          <div
            className={`h-0 w-0 border-t-[5px] border-r-[5px] border-l-[5px] ${borderColor} border-r-transparent border-l-transparent`}
            style={{ zIndex: 400 }}
          />
        </div>
        {/* Вертикальная линия */}
        <div className={`mt-[-2px] ${barWidth} flex-1 ${barColor}`} style={{ zIndex: 400 }} />
      </div>
    </div>
  )
}
