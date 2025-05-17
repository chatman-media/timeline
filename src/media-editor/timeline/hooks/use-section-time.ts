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

  // Получаем дату сектора из currentTime, если это Unix timestamp
  const sectorDate =
    currentTime > 365 * 24 * 60 * 60
      ? new Date(currentTime * 1000).toISOString().split("T")[0]
      : null

  // Используем значение displayTime для конкретного сектора, если оно есть
  // Иначе используем значение из пропсов или глобальное значение
  const displayTime =
    propDisplayTime !== undefined
      ? propDisplayTime
      : sectorDate && displayTimeContext.sectorDisplayTimes[sectorDate] !== undefined
        ? displayTimeContext.sectorDisplayTimes[sectorDate]
        : displayTimeContext.displayTime
  const setCurrentTime = playerContext.setCurrentTime
  const seek = timelineContext.seek
  const isPlaying = playerContext.isPlaying

  const [position, setPosition] = useState<number>(0)
  const isDraggingRef = useRef(false)
  const lastTimeRef = useRef<number>(currentTime)
  const positionRef = useRef<number>(0)

  // Используем ref для отслеживания последнего времени расчета позиции
  const lastCalculationTimeRef = useRef(0)
  // Добавляем ref для отслеживания последней установленной позиции
  const lastPositionRef = useRef<number | null>(null)

  // Функция для расчета позиции с дебаунсингом
  const calculatePosition = useCallback(() => {
    // Проверяем, не слишком ли часто вызывается функция
    const now = Date.now()
    // Увеличиваем интервал до 300мс (3 вызова в секунду) для предотвращения зацикливания
    if (now - lastCalculationTimeRef.current < 300) {
      // Ограничиваем до 3 вызовов в секунду
      return
    }
    lastCalculationTimeRef.current = now

    // Получаем дату сектора из currentTime, если это Unix timestamp
    const sectorDate =
      currentTime > 365 * 24 * 60 * 60
        ? new Date(currentTime * 1000).toISOString().split("T")[0]
        : null

    // Получаем активный сектор из контекста таймлайна
    const activeSector = timelineContext?.activeSector?.id

    // ОЧЕНЬ СТРОГАЯ ПРОВЕРКА: Обрабатываем только активный сектор
    // Если sectorDate не совпадает с activeSector, пропускаем обновление
    if (!sectorDate || !activeSector || sectorDate !== activeSector) {
      // Логируем только в 0.1% случаев для уменьшения количества сообщений
      if (Math.random() < 0.001) {
        console.log(
          `[useSectionTime] Пропускаем обновление позиции бара для неактивного сектора: sectorDate=${sectorDate}, activeSector=${activeSector}`,
        )
      }
      // Пропускаем обновление для неактивных секторов
      return
    }

    // Если мы дошли до этой точки, значит сектор активный
    const isActiveSector = true

    // Проверяем, есть ли значение в sectorDisplayTimes для этого сектора
    const hasSectorDisplayTime =
      displayTimeContext &&
      displayTimeContext.sectorDisplayTimes &&
      displayTimeContext.sectorDisplayTimes[sectorDate] !== undefined

    // Добавляем логи для отладки проблемы с барами (только в 10% случаев для уменьшения спама)
    if (Math.random() < 0.1) {
      console.log(
        `[useSectionTime] calculatePosition вызван: startTime=${startTime?.toFixed(2)}, endTime=${endTime?.toFixed(2)}, currentTime=${currentTime?.toFixed(2)}, displayTime=${displayTime?.toFixed(2)}, isActiveSector=${isActiveSector}, hasSectorDisplayTime=${hasSectorDisplayTime}, stack=${new Error().stack?.split("\n").slice(2, 4).join(" <- ")}`,
      )
    }

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
    if (displayTime !== undefined) {
      // Используем displayTime даже если оно равно 0, чтобы бар устанавливался в начало видео
      // Проверяем, что displayTime не превышает duration, чтобы избежать огромных процентных значений
      const clampedDisplayTime = Math.min(displayTime, duration)
      const newPosition = (clampedDisplayTime / duration) * 100

      // Проверяем, что позиция находится в разумных пределах (0-100%)
      const clampedPosition = Math.max(0, Math.min(100, newPosition))

      // Логируем только если позиция существенно изменилась или это первое обновление
      if (
        Math.abs(clampedPosition - (lastPositionRef.current || 0)) > 0.5 ||
        lastPositionRef.current === null
      ) {
        console.log(
          `[useSectionTime] Обновляем позицию бара: displayTime=${displayTime.toFixed(3)}, clampedDisplayTime=${clampedDisplayTime.toFixed(3)}, duration=${duration.toFixed(3)}, newPosition=${clampedPosition.toFixed(2)}%`,
        )
      }

      positionRef.current = clampedPosition
      setPosition(clampedPosition)

      // Сохраняем последнюю позицию и время
      lastPositionRef.current = clampedPosition
      lastTimeRef.current = displayTime

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

    // Если displayTime равно 0, это может означать, что пользователь только что кликнул на видео
    // и мы должны установить бар в начало этого видео, а не использовать сохраненное время
    if (displayTime === 0 && timelineContext) {
      // Получаем дату сектора из currentTime, если это Unix timestamp
      const sectorDate =
        currentTime > 365 * 24 * 60 * 60
          ? new Date(currentTime * 1000).toISOString().split("T")[0]
          : null

      // Получаем активное видео из контекста плеера
      const activeVideo = playerContext.video

      // Если есть активное видео и у него есть startTime, используем его для установки бара
      if (activeVideo && activeVideo.startTime && activeVideo.startTime > 0) {
        // Получаем дату сектора из startTime видео
        const videoSectorDate = new Date(activeVideo.startTime * 1000).toISOString().split("T")[0]

        // Если это тот же сектор, что и текущий, используем startTime видео
        if (sectorDate === videoSectorDate) {
          // Используем startTime видео как абсолютное время
          effectiveCurrentTime = activeVideo.startTime
          console.log(
            `[useSectionTime] Используем startTime видео ${activeVideo.id} (${effectiveCurrentTime.toFixed(2)}) для установки бара в начало видео`,
          )
          return // Выходим из функции, чтобы не перезаписать это значение
        }
      }

      // Если нет активного видео или это другой сектор, проверяем сохраненное время
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

      // Для активного сектора всегда обновляем позицию при изменении displayTime
      if (isActiveSector && displayTime !== undefined) {
        // Проверяем, что displayTime не превышает duration, чтобы избежать огромных процентных значений
        const clampedDisplayTime = Math.min(displayTime, duration)
        // Рассчитываем позицию напрямую
        const newPosition = (clampedDisplayTime / duration) * 100
        // Проверяем, что позиция находится в разумных пределах (0-100%)
        const clampedPosition = Math.max(0, Math.min(100, newPosition))

        // Логируем только если позиция существенно изменилась или это первое обновление
        if (
          Math.abs(clampedPosition - (lastPositionRef.current || 0)) > 0.5 ||
          lastPositionRef.current === null
        ) {
          console.log(
            `[useSectionTime] Принудительное обновление позиции для активного сектора: displayTime=${displayTime}, clampedDisplayTime=${clampedDisplayTime.toFixed(3)}, duration=${duration.toFixed(3)}, newPosition=${clampedPosition.toFixed(2)}%`,
          )
        }

        // Обновляем позицию
        positionRef.current = clampedPosition
        setPosition(clampedPosition)

        // Сохраняем последнюю позицию и время
        lastPositionRef.current = clampedPosition
        lastTimeRef.current = displayTime

        return // Выходим из функции, так как позиция уже обновлена
      }

      // Логируем изменения displayTime для неактивных секторов (только в 10% случаев)
      if (
        displayTime !== undefined &&
        Math.abs(lastTimeRef.current - displayTime) > 0.1 &&
        Math.random() < 0.1
      ) {
        console.log(`[useSectionTime] Обновление позиции по displayTime: ${displayTime}`)
        lastTimeRef.current = displayTime
      }
    }

    // Проверяем, находится ли effectiveCurrentTime в пределах секции
    // Для Unix timestamp (абсолютное время) не выполняем эту проверку,
    // так как мы хотим, чтобы бар перемещался в начало выбранного видео
    if (currentTime > 365 * 24 * 60 * 60) {
      // Для Unix timestamp (абсолютное время) используем другую логику
      // Если displayTime равно 0, это означает, что мы только что кликнули на видео
      // и хотим установить бар в начало этого видео
      if (displayTime === 0) {
        // Получаем видео из контекста
        const video = playerContext.video

        // Если есть видео и у него есть startTime
        if (video && video.startTime) {
          // Получаем дату сектора из startTime видео
          const sectorDate = new Date(video.startTime * 1000).toISOString().split("T")[0]

          // Если у нас есть контекст таймлайна и в нем есть секторы
          if (timelineContext && timelineContext.sectors && timelineContext.sectors.length > 0) {
            // Находим сектор по дате
            const sector = timelineContext.sectors.find((s) => s.id === sectorDate)

            if (sector) {
              // Находим минимальное время начала видео в секторе
              const minStartTime = Math.min(
                ...sector.tracks.flatMap((t) =>
                  (t.videos || []).map((v) => v.startTime || Infinity),
                ),
                sector.startTime || Infinity, // Используем startTime сектора как запасной вариант
              )

              // Если нашли минимальное время, используем его как точку отсчета
              if (minStartTime !== Infinity) {
                // Для параллельных видео мы хотим установить бар в начало выбранного видео,
                // а не в начало дорожки или сектора

                // Рассчитываем позицию видео относительно начала сектора
                const videoPosition =
                  ((video.startTime - minStartTime) / (endTime - startTime)) * 100

                // Проверяем, существенно ли изменилась позиция
                const newPosition = Math.max(0, Math.min(100, videoPosition))

                // Всегда устанавливаем позицию бара при клике на видео
                positionRef.current = newPosition
                setPosition(newPosition)

                // Логируем установку позиции
                console.log(
                  `[useSectionTime] Устанавливаем позицию бара для абсолютного времени при клике на видео: videoStartTime=${video.startTime.toFixed(2)}, minStartTime=${minStartTime.toFixed(2)}, position=${positionRef.current.toFixed(2)}%`,
                )

                return
              }
            }
          }
        }
      }
    } else {
      // Для обычного времени используем стандартную проверку
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

        // Находим минимальное время начала видео в секторе
        // Это будет точкой отсчета для всех видео в секторе
        let sectionStartTime = startTime

        // Если есть активное видео с startTime, используем его как базу для расчета
        if (video && video.startTime && video.startTime > 0) {
          // Получаем дату сектора из startTime видео
          const sectorDate = new Date(video.startTime * 1000).toISOString().split("T")[0]

          // Если у нас есть контекст таймлайна и в нем есть секторы
          if (timelineContext && timelineContext.sectors && timelineContext.sectors.length > 0) {
            // Находим сектор по дате
            const sector = timelineContext.sectors.find((s) => s.id === sectorDate)

            if (sector) {
              // Находим минимальное время начала видео в секторе
              const minStartTime = Math.min(
                ...sector.tracks.flatMap((t) =>
                  (t.videos || []).map((v) => v.startTime || Infinity),
                ),
                sector.startTime || Infinity, // Используем startTime сектора как запасной вариант
              )

              // Если нашли минимальное время, используем его как точку отсчета
              if (minStartTime !== Infinity) {
                sectionStartTime = minStartTime
              }
            }
          }

          const videoStartTime = video.startTime || 0
          const relativeDisplayTime = displayTime || 0

          // Рассчитываем позицию как процент от длительности секции
          // Используем единую формулу для всех видео в секторе
          positionPercent = Math.max(
            0,
            Math.min(100, (relativeDisplayTime / sectionDuration) * 100),
          )

          // Логируем только при существенных изменениях и только в 10% случаев
          if (Math.abs(positionPercent - positionRef.current) > 1 && Math.random() < 0.1) {
            console.log(
              `[useSectionTime] Расчет позиции для видео из таймлайна: sectionStartTime=${sectionStartTime.toFixed(2)}, videoStartTime=${videoStartTime.toFixed(2)}, relativeDisplayTime=${relativeDisplayTime}, sectionDuration=${sectionDuration.toFixed(2)}, positionPercent=${positionPercent.toFixed(2)}%`,
            )
          }
        } else {
          // Рассчитываем позицию как процент от длительности секции
          // Используем displayTime как относительное время от начала секции
          positionPercent = (displayTime / sectionDuration) * 100
        }

        // Ограничиваем позицию в пределах 0-100%
        positionPercent = Math.max(0, Math.min(100, positionPercent))

        // Логируем только при существенных изменениях и только в 10% случаев
        if (Math.abs(positionPercent - positionRef.current) > 1 && Math.random() < 0.1) {
          console.log(
            `[useSectionTime] Расчет позиции для Unix timestamp: displayTime=${displayTime}, sectionDuration=${sectionDuration.toFixed(2)}, positionPercent=${positionPercent.toFixed(2)}%, startTime=${startTime}, endTime=${endTime}`,
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

        // Логируем только при существенных изменениях и только в 10% случаев
        if (Math.abs(positionPercent - positionRef.current) > 1 && Math.random() < 0.1) {
          console.log(
            `[useSectionTime] Расчет позиции с displayTime: displayTime=${displayTime}, startTime=${startTime}, duration=${duration}, positionPercent=${positionPercent.toFixed(2)}%`,
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
    // Используем очень маленький порог для активного сектора, чтобы бар двигался плавно
    // Для неактивных секторов можно использовать больший порог
    const isSectorActive = timelineContext?.activeSector?.id === sectorDate
    if (!isSectorActive && Math.abs(clampedPosition - positionRef.current) < 0.1) return

    // Логируем для отладки только при существенных изменениях
    if (Math.abs(clampedPosition - positionRef.current) > 1) {
      console.log(
        `TimelineBar: effectiveCurrentTime=${effectiveCurrentTime.toFixed(2)}, position=${clampedPosition.toFixed(2)}%`,
      )
    }

    // Сохраняем позицию в ref для сравнения
    positionRef.current = clampedPosition
    lastPositionRef.current = clampedPosition

    // Обновляем состояние
    setPosition(clampedPosition)
  }, [currentTime, displayTime, startTime, endTime, seek, setCurrentTime, playerContext.video])

  // Обновляем позицию при изменении currentTime или displayTime
  useEffect(() => {
    // Если перетаскивание активно, не обновляем позицию
    if (isDraggingRef.current) return

    // Получаем дату сектора из currentTime, если это Unix timestamp
    const sectorDate =
      currentTime > 365 * 24 * 60 * 60
        ? new Date(currentTime * 1000).toISOString().split("T")[0]
        : null

    // Получаем активный сектор из контекста таймлайна
    const activeSector = timelineContext?.activeSector?.id

    // СТРОГАЯ ПРОВЕРКА: Обрабатываем событие только если это активный сектор
    // Это предотвратит обновление позиции бара для неактивных секторов
    const isActiveSector = sectorDate && activeSector && sectorDate === activeSector

    // Если это не активный сектор, выходим из эффекта
    if (!isActiveSector) {
      // Логируем только в 1% случаев для уменьшения количества сообщений
      if (Math.random() < 0.01) {
        console.log(
          `[useSectionTime] Пропускаем обновление позиции бара для неактивного сектора в useEffect: sectorDate=${sectorDate}, activeSector=${activeSector}`,
        )
      }
      return
    }

    // Проверяем, существенно ли изменилось время
    let timeChanged = false

    if (currentTime > 365 * 24 * 60 * 60) {
      // Для Unix timestamp проверяем изменение displayTime
      timeChanged = Math.abs(lastTimeRef.current - displayTime) > 0.1
      // Сохраняем displayTime
      lastTimeRef.current = displayTime
    } else {
      // Для обычного времени проверяем изменение currentTime
      timeChanged = Math.abs(lastTimeRef.current - currentTime) > 0.1
      // Сохраняем currentTime
      lastTimeRef.current = currentTime
    }

    // Вызываем функцию расчета позиции только если:
    // 1. Время существенно изменилось или это первый вызов (lastTimeRef.current === 0)
    // 2. И это ТОЛЬКО активный сектор (строгая проверка)
    // 3. И если активный сектор определен, то это должен быть наш сектор
    if (
      (timeChanged || lastTimeRef.current === 0) &&
      isActiveSector &&
      sectorDate &&
      sectorDate === activeSector
    ) {
      console.log(
        `[useSectionTime] Вызываем calculatePosition для сектора ${sectorDate} (активный сектор: ${activeSector}, isActiveSector=${isActiveSector})`,
      )

      // Если displayTime равно 0, это может означать, что пользователь кликнул на видео
      // и мы должны установить бар в начало этого видео
      if (displayTime === 0) {
        // Получаем активное видео из контекста плеера
        const activeVideo = playerContext.video

        // Если есть активное видео и у него есть startTime, используем его для установки бара
        if (activeVideo && activeVideo.startTime && activeVideo.startTime > 0) {
          // Получаем дату сектора из startTime видео
          const videoSectorDate = new Date(activeVideo.startTime * 1000).toISOString().split("T")[0]

          // Если это тот же сектор, что и текущий, принудительно вызываем calculatePosition
          if (sectorDate === videoSectorDate) {
            console.log(
              `[useSectionTime] Обнаружен клик на видео ${activeVideo.id} в секторе ${sectorDate}, принудительно обновляем позицию бара в useEffect`,
            )
          }
        }
      }

      calculatePosition()
    }

    // Используем requestAnimationFrame только при воспроизведении
    if (isPlaying) {
      // Используем requestAnimationFrame с ограничением частоты обновлений
      let animationFrameId: number
      let lastUpdateTime = 0
      // Увеличиваем интервал до 50 мс (20 FPS) для уменьшения нагрузки
      const updateInterval = 50

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
  }, [
    currentTime,
    displayTime,
    calculatePosition,
    isPlaying,
    seek,
    setCurrentTime,
    timelineContext?.activeSector?.id,
    displayTimeContext.sectorDisplayTimes,
  ])

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
      const { sectorId, time } = event.detail || {}

      if (sectorId && time !== undefined) {
        // Проверяем, не обрабатывали ли мы уже это событие недавно
        const lastEvent = lastProcessedEventRef.current.sectorTimeChange
        const now = Date.now()

        if (
          lastEvent &&
          lastEvent.sectorId === sectorId &&
          lastEvent.time === time &&
          now - lastEvent.timestamp < 200 // Увеличиваем интервал до 200мс
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

        // Получаем дату сектора из currentTime, если это Unix timestamp
        const sectorDate =
          currentTime > 365 * 24 * 60 * 60
            ? new Date(currentTime * 1000).toISOString().split("T")[0]
            : null

        // Получаем активный сектор из контекста таймлайна
        const activeSector = timelineContext?.activeSector?.id

        // ОЧЕНЬ СТРОГАЯ ПРОВЕРКА: Обрабатываем событие ТОЛЬКО если:
        // 1. Указан sectorId и он совпадает с sectorDate
        // 2. И этот сектор является активным сектором
        // 3. И sectorDate совпадает с activeSector

        // Если не выполняется хотя бы одно из условий, пропускаем обработку события
        if (
          !sectorDate ||
          !activeSector ||
          sectorDate !== activeSector ||
          sectorDate !== sectorId
        ) {
          // Логируем только в 0.01% случаев для минимизации спама
          if (Math.random() < 0.0001) {
            console.log(
              `[useSectionTime] Пропускаем обработку sector-time-change для сектора ${sectorId}, так как не выполняются условия: sectorDate=${sectorDate}, activeSector=${activeSector}`,
            )
          }
          return
        }

        // Если мы дошли до этой точки, значит все условия выполнены
        // Логируем только в 5% случаев для уменьшения спама
        if (Math.random() < 0.05) {
          console.log(
            `[useSectionTime] Обрабатываем sector-time-change для активного сектора ${sectorId} со временем ${time.toFixed(2)}`,
          )
        }

        // Проверяем, изменилось ли время для сектора
        const hasTimeChanged =
          !timelineContext?.sectorTimes?.[sectorId] ||
          Math.abs(timelineContext.sectorTimes[sectorId] - time) > 0.1 // Увеличиваем порог до 0.1с

        // Сохраняем время для сектора в контексте таймлайна только если оно изменилось
        if (timelineContext && timelineContext.sectorTimes && hasTimeChanged) {
          timelineContext.sectorTimes[sectorId] = time

          // Логируем только в 5% случаев для уменьшения спама
          if (Math.random() < 0.05) {
            console.log(
              `[useSectionTime] Сохранено время ${time.toFixed(2)} для сектора ${sectorId} в контексте таймлайна`,
            )
          }

          // Для обратной совместимости сохраняем также в глобальной переменной
          sectorTimes[sectorId] = time
        }

        // Обновляем локальное displayTime через контекст
        if (displayTimeContext && displayTimeContext.setDisplayTime) {
          // Передаем sectorId при вызове setDisplayTime
          displayTimeContext.setDisplayTime(time, true, sectorId)

          // Логируем только в 5% случаев для уменьшения спама
          if (Math.random() < 0.05) {
            console.log(
              `[useSectionTime] Обновлено displayTime на ${time.toFixed(2)} для сектора ${sectorId} (isActiveOnly=true)`,
            )
          }
        }

        // Принудительно вызываем calculatePosition для обновления позиции
        // Но только если прошло достаточно времени с последнего вызова
        if (now - lastCalculationTimeRef.current > 300) {
          calculatePosition()
          lastCalculationTimeRef.current = now
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
          now - lastEvent.timestamp < 200 // Увеличиваем интервал до 200мс
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

        // Получаем дату сектора из currentTime, если это Unix timestamp
        const sectorDate =
          currentTime > 365 * 24 * 60 * 60
            ? new Date(currentTime * 1000).toISOString().split("T")[0]
            : null

        // Получаем активный сектор из контекста таймлайна
        const activeSector = timelineContext?.activeSector?.id

        // ОЧЕНЬ СТРОГАЯ ПРОВЕРКА: Обрабатываем событие ТОЛЬКО если:
        // 1. Есть дата сектора
        // 2. И этот сектор является активным сектором
        // 3. И sectorDate совпадает с activeSector

        // Если не выполняется хотя бы одно из условий, пропускаем обработку события
        if (!sectorDate || !activeSector || sectorDate !== activeSector) {
          // Логируем только в 0.01% случаев для минимизации спама
          if (Math.random() < 0.0001) {
            console.log(
              `[useSectionTime] Пропускаем обработку save-all-sectors-time для видео ${videoId}, так как не выполняются условия: sectorDate=${sectorDate}, activeSector=${activeSector}`,
            )
          }
          return
        }

        // Если мы дошли до этой точки, значит все условия выполнены
        // Логируем только в 5% случаев для уменьшения спама
        if (Math.random() < 0.05) {
          console.log(
            `[useSectionTime] Обрабатываем save-all-sectors-time для видео ${videoId} с временем ${displayTime.toFixed(2)}`,
          )
        }

        // Проверяем, изменилось ли время для сектора
        const hasTimeChanged =
          !timelineContext?.sectorTimes?.[sectorDate] ||
          Math.abs(timelineContext.sectorTimes[sectorDate] - displayTime) > 0.1 // Увеличиваем порог до 0.1с

        // Сохраняем время для сектора в контексте таймлайна только если оно изменилось
        if (timelineContext && timelineContext.sectorTimes && hasTimeChanged) {
          // Сохраняем время только для текущего сектора (isActiveOnly=true)
          if (timelineContext.setSectorTime) {
            timelineContext.setSectorTime(sectorDate, displayTime, true)

            // Логируем только в 5% случаев для уменьшения спама
            if (Math.random() < 0.05) {
              console.log(
                `[useSectionTime] Отправлено событие SET_SECTOR_TIME для сектора ${sectorDate} с временем ${displayTime.toFixed(2)} (isActiveOnly=true)`,
              )
            }

            // Обновляем displayTime для этого сектора
            if (displayTimeContext && displayTimeContext.setDisplayTime) {
              // Передаем sectorId при вызове setDisplayTime
              displayTimeContext.setDisplayTime(displayTime, true, sectorDate)

              // Логируем только в 5% случаев для уменьшения спама
              if (Math.random() < 0.05) {
                console.log(
                  `[useSectionTime] Обновлено displayTime на ${displayTime.toFixed(2)} для сектора ${sectorDate} (isActiveOnly=true)`,
                )
              }
            }
          } else {
            // Если нет метода setSectorTime, используем прямое обновление (устаревший метод)
            timelineContext.sectorTimes[sectorDate] = displayTime

            // Для обратной совместимости сохраняем также в глобальной переменной
            sectorTimes[sectorDate] = displayTime

            // Обновляем displayTime для этого сектора
            if (displayTimeContext && displayTimeContext.setDisplayTime) {
              // Передаем sectorId при вызове setDisplayTime
              displayTimeContext.setDisplayTime(displayTime, true, sectorDate)
            }
          }
        }

        // Принудительно вызываем calculatePosition для обновления позиции
        // Но только если прошло достаточно времени с последнего вызова
        if (now - lastCalculationTimeRef.current > 300) {
          calculatePosition()
          lastCalculationTimeRef.current = now
        }
      }
    }

    // Обработчик события display-time-change
    const handleDisplayTimeChange = (event: CustomEvent) => {
      const { time, sectorId } = event.detail || {}

      if (time === undefined) return

      // Получаем дату сектора из currentTime, если это Unix timestamp
      const sectorDate =
        currentTime > 365 * 24 * 60 * 60
          ? new Date(currentTime * 1000).toISOString().split("T")[0]
          : null

      // Получаем активный сектор из контекста таймлайна
      const activeSector = timelineContext?.activeSector?.id

      // ОЧЕНЬ СТРОГАЯ ПРОВЕРКА: Обрабатываем событие ТОЛЬКО если:
      // 1. Указан sectorId и он совпадает с sectorDate
      // 2. И этот сектор является активным сектором
      // 3. И sectorDate совпадает с activeSector

      // Проверяем, является ли текущий сектор активным
      const isCurrentSectorActive = sectorDate === activeSector

      // Проверяем, предназначено ли событие для этого сектора
      const isEventForThisSector = sectorId && sectorDate && sectorDate === sectorId

      // Если не выполняется хотя бы одно из условий, пропускаем обработку события
      if (
        !isEventForThisSector ||
        !isCurrentSectorActive ||
        !activeSector ||
        sectorDate !== activeSector
      ) {
        // Логируем только в 0.01% случаев для минимизации спама
        if (Math.random() < 0.0001) {
          console.log(
            `[useSectionTime] Пропускаем обновление для сектора ${sectorId}, так как не выполняются условия: isEventForThisSector=${isEventForThisSector}, isCurrentSectorActive=${isCurrentSectorActive}, activeSector=${activeSector}, sectorDate=${sectorDate}`,
          )
        }
        return
      }

      // Если мы дошли до этой точки, значит все условия выполнены
      // Логируем только в 5% случаев для уменьшения спама
      if (Math.random() < 0.05) {
        console.log(
          `[useSectionTime] Обновляем позицию для активного сектора ${sectorDate} со временем ${time.toFixed(3)}`,
        )
      }

      // Если у нас есть startTime и endTime, рассчитываем позицию напрямую
      if (startTime !== undefined && endTime !== undefined) {
        const duration = endTime - startTime
        if (duration > 0) {
          // Проверяем, что время не превышает длительность, чтобы избежать огромных процентных значений
          const clampedTime = Math.min(time, duration)
          // Рассчитываем позицию напрямую
          const newPosition = (clampedTime / duration) * 100
          // Проверяем, что позиция находится в разумных пределах (0-100%)
          const clampedPosition = Math.max(0, Math.min(100, newPosition))

          // Проверяем, существенно ли изменилась позиция
          if (Math.abs(clampedPosition - (lastPositionRef.current || 0)) > 0.5) {
            // Логируем только в 5% случаев для уменьшения спама
            if (Math.random() < 0.05) {
              console.log(
                `[useSectionTime] Обновление позиции для активного сектора ${sectorDate}: time=${time.toFixed(3)}, clampedTime=${clampedTime.toFixed(3)}, newPosition=${clampedPosition.toFixed(2)}%`,
              )
            }

            // Обновляем позицию
            positionRef.current = clampedPosition
            setPosition(clampedPosition)

            // Сохраняем последнюю позицию и время
            lastPositionRef.current = clampedPosition
            lastTimeRef.current = time
          }
        }
      }
    }

    // Добавляем обработчики событий
    window.addEventListener("sector-time-change", handleSectorTimeChange as EventListener)
    window.addEventListener("save-all-sectors-time", handleSaveAllSectorsTime as EventListener)
    window.addEventListener("display-time-change", handleDisplayTimeChange as EventListener)

    // Удаляем обработчики при размонтировании
    return () => {
      window.removeEventListener("sector-time-change", handleSectorTimeChange as EventListener)
      window.removeEventListener("save-all-sectors-time", handleSaveAllSectorsTime as EventListener)
      window.removeEventListener("display-time-change", handleDisplayTimeChange as EventListener)
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
      // Проверяем startTime, так как он более надежный индикатор, чем currentTime
      const isUnixTimestamp = startTime > 365 * 24 * 60 * 60

      let newTime
      if (isUnixTimestamp) {
        // Для Unix timestamp используем процент от длительности секции
        const sectionDuration = endTime - startTime

        // Рассчитываем новое абсолютное время
        const newAbsoluteTime = startTime + percent * sectionDuration

        // Получаем видео из контекста
        const activeVideo = playerContext.video

        // Рассчитываем новое относительное время (displayTime)
        let newDisplayTime = 0

        if (activeVideo && activeVideo.startTime) {
          // Вычисляем относительное время от начала видео
          newDisplayTime = Math.max(0, newAbsoluteTime - activeVideo.startTime)
        } else {
          // Если нет видео или startTime, используем процент от длительности секции
          newDisplayTime = percent * sectionDuration
        }

        console.log(
          `[TimelineBar] Перетаскивание для Unix timestamp: percent=${percent.toFixed(2)}, sectionDuration=${sectionDuration.toFixed(2)}, newAbsoluteTime=${newAbsoluteTime.toFixed(2)}, newDisplayTime=${newDisplayTime.toFixed(2)}, startTime=${startTime}, endTime=${endTime}`,
        )

        // Обновляем displayTime через контекст
        // Важно: устанавливаем displayTime только если это относительное время от начала видео
        // Это предотвратит "соскакивание" при перемещении бара
        if (
          displayTimeContext &&
          displayTimeContext.setDisplayTime &&
          activeVideo &&
          activeVideo.startTime
        ) {
          // Проверяем, что новое время находится в пределах видео
          const videoDuration = activeVideo.duration || 0

          // Ограничиваем displayTime длительностью видео
          const clampedDisplayTime = Math.max(0, Math.min(videoDuration, newDisplayTime))

          // Получаем дату сектора из видео
          const videoSectorDate = new Date(activeVideo.startTime * 1000).toISOString().split("T")[0]

          // Устанавливаем относительное время от начала видео с указанием sectorId
          displayTimeContext.setDisplayTime(clampedDisplayTime, true, videoSectorDate)
          console.log(
            `[TimelineBar] Установлен displayTime через контекст: ${clampedDisplayTime.toFixed(2)} для сектора ${videoSectorDate} (относительное время от начала видео ${activeVideo.startTime.toFixed(2)}, isActiveOnly=true)`,
          )
        }

        // Получаем дату сектора из видео
        if (activeVideo && activeVideo.startTime) {
          const sectorDate = new Date(activeVideo.startTime * 1000).toISOString().split("T")[0]

          // Если у нас есть контекст таймлайна и в нем есть секторы
          if (timelineContext && timelineContext.sectors && timelineContext.sectors.length > 0) {
            // Находим сектор по дате
            const sector = timelineContext.sectors.find((s) => s.id === sectorDate)

            if (sector) {
              // Сохраняем абсолютное время для сектора
              if (timelineContext.sectorTimes) {
                // Проверяем, что новое время находится в пределах сектора
                const sectorStartTime = sector.startTime || startTime
                const sectorEndTime = sector.endTime || endTime

                // Ограничиваем абсолютное время пределами сектора
                const clampedAbsoluteTime = Math.max(
                  sectorStartTime,
                  Math.min(sectorEndTime, newAbsoluteTime),
                )

                // Сохраняем абсолютное время для сектора
                timelineContext.sectorTimes[sectorDate] = clampedAbsoluteTime
                console.log(
                  `[TimelineBar] Сохранено абсолютное время ${clampedAbsoluteTime.toFixed(2)} для сектора ${sectorDate} (ограничено пределами сектора: ${sectorStartTime.toFixed(2)}-${sectorEndTime.toFixed(2)})`,
                )
              }
            }
          }
        }

        // Получаем видео из контекста
        const currentVideo = playerContext.video

        // Определяем, находится ли новое абсолютное время в пределах текущего видео
        let isTimeInVideoRange = false
        let finalAbsoluteTime = newAbsoluteTime

        if (currentVideo && currentVideo.startTime) {
          const videoStartTime = currentVideo.startTime
          const videoDuration = currentVideo.duration || 0
          const videoEndTime = videoStartTime + videoDuration

          // Проверяем, находится ли новое время в пределах видео
          isTimeInVideoRange = newAbsoluteTime >= videoStartTime && newAbsoluteTime <= videoEndTime

          // Если время не в пределах видео, ограничиваем его
          if (!isTimeInVideoRange) {
            // Если новое время меньше начала видео, устанавливаем его в начало видео
            if (newAbsoluteTime < videoStartTime) {
              finalAbsoluteTime = videoStartTime
              console.log(
                `[TimelineBar] Новое время ${newAbsoluteTime.toFixed(2)} меньше начала видео ${videoStartTime.toFixed(2)}, устанавливаем в начало видео`,
              )
            }
            // Если новое время больше конца видео, устанавливаем его в конец видео
            else if (newAbsoluteTime > videoEndTime) {
              finalAbsoluteTime = videoEndTime
              console.log(
                `[TimelineBar] Новое время ${newAbsoluteTime.toFixed(2)} больше конца видео ${videoEndTime.toFixed(2)}, устанавливаем в конец видео`,
              )
            }
          }
        }

        // Вызываем seek с абсолютным временем
        seek(finalAbsoluteTime)
        console.log(
          `[TimelineBar] Вызвана функция seek с абсолютным временем: ${finalAbsoluteTime.toFixed(2)} (displayTime=${newDisplayTime.toFixed(2)}, isTimeInVideoRange=${isTimeInVideoRange})`,
        )

        // Обновляем currentTime в контексте плеера
        // Это нужно для обновления элементов управления плеером
        setCurrentTime(finalAbsoluteTime)
        console.log(
          `[TimelineBar] Обновлен currentTime в контексте плеера: ${finalAbsoluteTime.toFixed(2)}`,
        )

        // Сохраняем абсолютное время для возврата
        newTime = finalAbsoluteTime
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
