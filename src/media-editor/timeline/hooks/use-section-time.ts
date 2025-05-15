import { useCallback, useEffect, useRef, useState } from "react"

import { usePlayerContext } from "@/media-editor/media-player"
import { useDisplayTime } from "@/media-editor/media-player/contexts"
import { useTimeline } from "@/media-editor/timeline/services"

// Для обратной совместимости создаем пустой объект, который будет использоваться
// в компонентах, которые еще не обновлены для использования контекста таймлайна
// В дальнейшем этот объект можно будет удалить
export const sectorTimes: Record<string, number> = {}

// Интерфейс для параметров useSectionTime
interface SectionTimeProps {
  startTime: number
  endTime: number
  currentTime?: number
  displayTime?: number
}

/**
 * Хук для расчета позиции и обработки перемещения курсора времени
 * @param props Параметры для расчета позиции
 * @returns Объект с позицией и обработчиком перемещения
 */
export function useSectionTime({
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

  const [position, setPosition] = useState<number>(0)
  const isDraggingRef = useRef(false)
  const lastTimeRef = useRef<number>(currentTime)
  const positionRef = useRef<number>(0)

  // Используем ref для отслеживания последнего времени расчета позиции
  const lastCalculationTimeRef = useRef(0)

  // Функция для расчета позиции с дебаунсингом
  const calculatePosition = useCallback(() => {
    // Проверяем, не слишком ли часто вызывается функция
    const now = Date.now()
    if (now - lastCalculationTimeRef.current < 50) {
      // Ограничиваем до 20 вызовов в секунду
      return
    }
    lastCalculationTimeRef.current = now
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
      // Логируем только при существенных изменениях
      if (Math.abs(newPosition - positionRef.current) > 1) {
        console.log(
          `[calculatePosition] displayTime=${displayTime.toFixed(2)}, duration=${duration.toFixed(2)}, newPosition=${newPosition.toFixed(2)}%, currentPosition=${positionRef.current.toFixed(2)}%`,
        )
      }

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
        // console.log(
        //   `[useSectionTime] Обнаружен Unix timestamp (${currentTime}), используем относительное время из контекста: ${effectiveCurrentTime}`,
        // )
      }
    }

    // Если displayTime равно 0, но есть сохраненное время для этого сектора,
    // используем сохраненное время из контекста таймлайна
    if (displayTime === 0 && timelineContext) {
      // Получаем дату сектора из currentTime, если это Unix timestamp
      const sectorDate =
        currentTime > 365 * 24 * 60 * 60
          ? new Date(currentTime * 1000).toISOString().split("T")[0]
          : null

      // Проверяем, есть ли сохраненное время в контексте таймлайна
      if (
        sectorDate &&
        timelineContext.sectorTimes &&
        timelineContext.sectorTimes[sectorDate] !== undefined
      ) {
        effectiveCurrentTime = timelineContext.sectorTimes[sectorDate]
        // console.log(
        //   `[useSectionTime] Используем сохраненное время ${effectiveCurrentTime.toFixed(2)} для сектора ${sectorDate} из контекста таймлайна`,
        // )
      }
      // Для обратной совместимости проверяем также глобальную переменную
      else if (sectorDate && sectorTimes[sectorDate] !== undefined) {
        effectiveCurrentTime = sectorTimes[sectorDate]
        console.log(
          `[useSectionTime] Используем сохраненное время ${effectiveCurrentTime.toFixed(2)} для сектора ${sectorDate} из глобальной переменной (устаревший метод)`,
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

          // Логируем только при существенных изменениях
          if (Math.abs(positionPercent - positionRef.current) > 1) {
            console.log(
              `[useSectionTime] Расчет позиции для видео из таймлайна: videoStartTime=${videoStartTime.toFixed(2)}, startTime=${startTime.toFixed(2)}, relativeDisplayTime=${relativeDisplayTime.toFixed(2)}, sectionDuration=${sectionDuration.toFixed(2)}, positionPercent=${positionPercent.toFixed(2)}%`,
            )
          }

          // Принудительно обновляем позицию, если displayTime равен 0
          // Это нужно для корректного позиционирования бара при клике на видео
          if (relativeDisplayTime === 0) {
            // Логируем только при существенных изменениях
            if (Math.abs(positionPercent - positionRef.current) > 1) {
              console.log(`[useSectionTime] Принудительное обновление позиции для displayTime=0`)
            }
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

        // Логируем только при существенных изменениях
        if (Math.abs(positionPercent - positionRef.current) > 1) {
          console.log(
            `[useSectionTime] Расчет позиции для Unix timestamp: displayTime=${displayTime.toFixed(2)}, sectionDuration=${sectionDuration.toFixed(2)}, positionPercent=${positionPercent.toFixed(2)}%, startTime=${startTime}, endTime=${endTime}`,
          )
        }
      }
    } else {
      // Для обычного времени используем displayTime вместо currentTime
      // Это обеспечит корректное движение бара при воспроизведении

      // Проверяем, что displayTime определено
      if (displayTime !== undefined && displayTime > 0) {
        // Используем displayTime как относительное время от начала секции
        positionPercent = (displayTime / duration) * 100

        // Логируем только при существенных изменениях
        if (Math.abs(positionPercent - positionRef.current) > 1) {
          console.log(
            `[useSectionTime] Расчет позиции с displayTime: displayTime=${displayTime.toFixed(2)}, startTime=${startTime}, duration=${duration}, positionPercent=${positionPercent.toFixed(2)}%`,
          )
        }
      } else {
        // Если displayTime не определено, используем стандартный расчет
        relativeTime = effectiveCurrentTime - startTime
        positionPercent = (relativeTime / duration) * 100

        // Логируем только при существенных изменениях
        if (Math.abs(positionPercent - positionRef.current) > 1) {
          console.log(
            `[useSectionTime] Расчет позиции для обычного времени: currentTime=${effectiveCurrentTime}, startTime=${startTime}, duration=${duration}, positionPercent=${positionPercent.toFixed(2)}%`,
          )
        }
      }
    }

    // Ограничиваем позицию в пределах 0-100%
    const clampedPosition = Math.max(0, Math.min(100, positionPercent))

    // Проверяем, изменилась ли позиция существенно
    if (Math.abs(clampedPosition - positionRef.current) < 0.1) return

    // Логируем для отладки только при существенных изменениях
    if (Math.abs(clampedPosition - positionRef.current) > 1) {
      console.log(
        `TimelineBar: effectiveCurrentTime=${effectiveCurrentTime.toFixed(2)}, position=${clampedPosition.toFixed(2)}%`,
      )
    }

    // Сохраняем позицию в ref для сравнения
    positionRef.current = clampedPosition

    // Обновляем состояние
    setPosition(clampedPosition)
  }, [currentTime, displayTime, startTime, endTime, seek, setCurrentTime, playerContext.video])

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
      // Логируем только при первом запуске анимации
      if (!window.animationStarted) {
        console.log(
          `[TimelineBar] Запускаем анимацию для обновления позиции (isPlaying=${isPlaying})`,
        )
        window.animationStarted = true
      }

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

  // Используем ref для хранения последних обработанных событий, чтобы избежать бесконечного цикла
  const lastProcessedEventRef = useRef<{
    sectorTimeChange: { sectorId?: string; time?: number; timestamp: number } | null
    saveAllSectorsTime: { videoId?: string; displayTime?: number; timestamp: number } | null
  }>({
    sectorTimeChange: null,
    saveAllSectorsTime: null,
  })

  // Добавляем обработчик события sector-time-change для обновления позиции бара
  useEffect(() => {
    // Обработчик события sector-time-change
    const handleSectorTimeChange = (event: CustomEvent) => {
      const { sectorId, time, isActiveOnly } = event.detail || {}

      if (sectorId && time !== undefined) {
        // Проверяем, не обрабатывали ли мы уже это событие недавно
        const lastEvent = lastProcessedEventRef.current.sectorTimeChange
        const now = Date.now()

        if (
          lastEvent &&
          lastEvent.sectorId === sectorId &&
          lastEvent.time === time &&
          now - lastEvent.timestamp < 100
        ) {
          // Пропускаем событие, если оно уже было обработано недавно
          return
        }

        // Сохраняем информацию о текущем событии
        lastProcessedEventRef.current.sectorTimeChange = {
          sectorId,
          time,
          timestamp: now,
        }

        console.log(
          `[useSectionTime] Получено событие sector-time-change: sectorId=${sectorId}, time=${time.toFixed(2)}, isActiveOnly=${isActiveOnly}`,
        )

        // Получаем дату сектора из currentTime, если это Unix timestamp
        const sectorDate =
          currentTime > 365 * 24 * 60 * 60
            ? new Date(currentTime * 1000).toISOString().split("T")[0]
            : null

        // Если это наш сектор или событие не только для активного сектора, обновляем позицию
        if (sectorDate === sectorId || !isActiveOnly) {
          console.log(
            `[useSectionTime] Обновляем позицию для сектора ${sectorId} со временем ${time.toFixed(2)}`,
          )

          // Сохраняем время для сектора в контексте таймлайна и глобальной переменной
          if (timelineContext && timelineContext.sectorTimes) {
            timelineContext.sectorTimes[sectorId] = time
            console.log(
              `[useSectionTime] Сохранено время ${time.toFixed(2)} для сектора ${sectorId} в контексте таймлайна`,
            )
          }

          // Для обратной совместимости сохраняем также в глобальной переменной
          sectorTimes[sectorId] = time
          console.log(
            `[useSectionTime] Сохранено время ${time.toFixed(2)} для сектора ${sectorId} в глобальной переменной`,
          )

          // Если это наш сектор, обновляем локальное displayTime через контекст
          if (sectorDate === sectorId && displayTimeContext && displayTimeContext.setDisplayTime) {
            displayTimeContext.setDisplayTime(time)
            console.log(
              `[useSectionTime] Обновлено displayTime на ${time.toFixed(2)} для сектора ${sectorId}`,
            )
          }

          // Принудительно вызываем calculatePosition для обновления позиции
          setTimeout(() => {
            calculatePosition()
          }, 0)
        }
      }
    }

    // Обработчик события save-all-sectors-time для сохранения позиции при переключении между параллельными видео
    const handleSaveAllSectorsTime = (event: CustomEvent) => {
      const { videoId, displayTime } = event.detail || {}

      if (videoId && displayTime !== undefined) {
        // Проверяем, не обрабатывали ли мы уже это событие недавно
        const lastEvent = lastProcessedEventRef.current.saveAllSectorsTime
        const now = Date.now()

        if (
          lastEvent &&
          lastEvent.videoId === videoId &&
          lastEvent.displayTime === displayTime &&
          now - lastEvent.timestamp < 100
        ) {
          // Пропускаем событие, если оно уже было обработано недавно
          return
        }

        // Сохраняем информацию о текущем событии
        lastProcessedEventRef.current.saveAllSectorsTime = {
          videoId,
          displayTime,
          timestamp: now,
        }

        console.log(
          `[useSectionTime] Получено событие save-all-sectors-time: videoId=${videoId}, displayTime=${displayTime.toFixed(2)}`,
        )

        // Получаем дату сектора из currentTime, если это Unix timestamp
        const sectorDate =
          currentTime > 365 * 24 * 60 * 60
            ? new Date(currentTime * 1000).toISOString().split("T")[0]
            : null

        // Если есть дата сектора, сохраняем время для этого сектора
        if (sectorDate && timelineContext) {
          // Сохраняем время для сектора в контексте таймлайна
          if (timelineContext.sectorTimes) {
            timelineContext.sectorTimes[sectorDate] = displayTime
            console.log(
              `[useSectionTime] Сохранено время ${displayTime.toFixed(2)} для сектора ${sectorDate} в контексте таймлайна`,
            )
          }

          // Для обратной совместимости сохраняем также в глобальной переменной
          sectorTimes[sectorDate] = displayTime
          console.log(
            `[useSectionTime] Сохранено время ${displayTime.toFixed(2)} для сектора ${sectorDate} в глобальной переменной`,
          )

          // Принудительно вызываем calculatePosition для обновления позиции
          setTimeout(() => {
            calculatePosition()
          }, 0)
        }
      }
    }

    // Добавляем обработчики событий
    window.addEventListener("sector-time-change", handleSectorTimeChange as EventListener)
    window.addEventListener("save-all-sectors-time", handleSaveAllSectorsTime as EventListener)

    // Удаляем обработчики при размонтировании
    return () => {
      window.removeEventListener("sector-time-change", handleSectorTimeChange as EventListener)
      window.removeEventListener("save-all-sectors-time", handleSaveAllSectorsTime as EventListener)
    }
  }, [currentTime, calculatePosition, timelineContext])

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
