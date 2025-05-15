import { useEffect, useRef } from "react"

import { usePlayerContext } from "@/media-editor/media-player"
import { useDisplayTime } from "@/media-editor/media-player/contexts"
import { useSectionTime } from "@/media-editor/timeline/hooks/use-section-time"
import { useTimeline } from "@/media-editor/timeline/services"

interface TimelineBarProps {
  startTime: number
  endTime: number
  sectionStartTime: number
  sectionDuration: number
  height: number
  isActive?: boolean // Добавляем флаг активного сектора
}

export function TimelineBar({
  sectionStartTime,
  sectionDuration,
  height,
  isActive = false,
}: TimelineBarProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { currentTime, video } = usePlayerContext()
  const { displayTime } = useDisplayTime()
  const timelineContext = useTimeline()

  // Получаем дату сектора из видео, если оно есть
  const sectorDate = video?.startTime
    ? new Date(video.startTime * 1000).toISOString().split("T")[0]
    : null

  // Создаем ref для хранения последнего логированного состояния
  const lastLoggedState = useRef({
    videoId: "",
    displayTime: -1,
    isActive: false,
  })

  // Добавляем логирование для отладки с ограничением частоты
  useEffect(() => {
    if (video) {
      // Логируем только если состояние существенно изменилось
      if (
        lastLoggedState.current.videoId !== video.id ||
        Math.abs(lastLoggedState.current.displayTime - displayTime) > 0.5 ||
        lastLoggedState.current.isActive !== isActive
      ) {
        // Обновляем последнее логированное состояние
        lastLoggedState.current = {
          videoId: video.id,
          displayTime: displayTime,
          isActive: isActive,
        }

        // Отключаем логирование для уменьшения количества сообщений
        // console.log(
        //   `[TimelineBar] Видео: ${video.id}, startTime=${video.startTime}, displayTime=${displayTime}, isActive=${isActive}`,
        // )
      }

      // Если есть дата сектора, сохраняем текущее displayTime для этого сектора
      // Сохраняем время для всех секторов, не только для активного
      if (sectorDate && displayTime > 0 && timelineContext) {
        // Отправляем событие SEEK в машину состояний таймлайна
        timelineContext.seek(displayTime)
        // Отключаем логирование для уменьшения количества сообщений
        // console.log(
        //   `[TimelineBar] Отправлено событие SEEK со временем ${displayTime.toFixed(2)} для сектора ${sectorDate}, isActive=${isActive}`,
        // )
      }
    }
  }, [video, displayTime, sectorDate, isActive])

  // Проверяем и корректируем параметры секции
  const effectiveSectionStartTime = sectionStartTime || 0
  const effectiveSectionDuration = sectionDuration || 20 // Используем 20 секунд по умолчанию, если длительность не задана
  // Управление состоянием секторов перенесено в машину состояний плеера

  // Для Unix timestamp используем относительные значения для startTime и endTime
  // Для обычного времени используем реальные значения startTime и endTime
  // Это обеспечит корректное соответствие масштабу дорожки
  const normalizedStartTime = effectiveSectionStartTime
  const normalizedEndTime = effectiveSectionStartTime + effectiveSectionDuration

  // Используем useSectionTime с передачей displayTime для корректной работы с видео из сектора
  // Для неактивных секторов используем сохраненное время из контекста таймлайна
  // Для активных секторов используем текущее displayTime
  const savedDisplayTime =
    !isActive &&
    sectorDate &&
    timelineContext?.sectorTimes &&
    timelineContext.sectorTimes[sectorDate] !== undefined
      ? timelineContext.sectorTimes[sectorDate]
      : isActive
        ? displayTime
        : 0 // Для активного сектора используем displayTime, для неактивных без сохраненного времени - 0

  // Создаем собственный обработчик для перемещения бара
  const handleBarMouseDown = (e: React.MouseEvent) => {
    // Если сектор неактивен, сначала делаем его активным
    if (!isActive && sectorDate) {
      // Сохраняем текущее состояние всех секторов
      console.log(`[TimelineBar] Сохраняем состояние всех секторов перед активацией ${sectorDate}`)

      // Устанавливаем preferredSource в "timeline" при активации сектора
      if (typeof window !== "undefined" && window.playerContext) {
        console.log(
          `[TimelineBar] Устанавливаем preferredSource в "timeline" при активации сектора ${sectorDate}`,
        )
        window.playerContext.setPreferredSource("timeline")
      }

      // Отправляем событие для активации сектора через машину состояний
      window.dispatchEvent(
        new CustomEvent("activate-sector", {
          detail: {
            sectorDate,
            preserveOtherSectors: true, // Флаг для сохранения состояния других секторов
          },
        }),
      )

      // Отключаем логирование для уменьшения количества сообщений
      // console.log(`[TimelineBar] Активируем сектор ${sectorDate} через машину состояний`)

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

  // Добавляем эффект для принудительного обновления позиции при изменении savedDisplayTime
  useEffect(() => {
    if (!isActive && savedDisplayTime > 0) {
      console.log(
        `[TimelineBar] Обновляем позицию для неактивного сектора ${sectorDate} со временем ${savedDisplayTime.toFixed(2)}`,
      )
    }
  }, [isActive, savedDisplayTime, sectorDate])

  // Добавляем эффект для сохранения позиции при переключении между параллельными видео
  useEffect(() => {
    // Если видео изменилось, сохраняем текущую позицию для всех секторов
    if (video && video.id && displayTime > 0 && timelineContext) {
      // Отправляем событие SAVE_ALL_SECTORS_TIME в машину состояний таймлайна
      timelineContext.saveAllSectorsTime(video.id, displayTime, currentTime)

      // Отключаем логирование для уменьшения количества сообщений
      // console.log(
      //   `[TimelineBar] Отправлено событие SAVE_ALL_SECTORS_TIME для видео ${video.id} с displayTime=${displayTime.toFixed(2)}`,
      // )
    }
  }, [video?.id, displayTime, currentTime, timelineContext])

  // Используем ref для хранения последнего отправленного времени
  const lastSentTimeRef = useRef<{ sectorId: string | null; time: number }>({
    sectorId: null,
    time: -1,
  })

  // Добавляем эффект для обновления позиции бара при изменении видео
  useEffect(() => {
    // Если видео изменилось, обновляем позицию бара
    if (video && video.id && sectorDate && timelineContext) {
      // Проверяем, не отправляли ли мы уже это время для этого сектора
      if (
        lastSentTimeRef.current.sectorId === sectorDate &&
        Math.abs(lastSentTimeRef.current.time - displayTime) < 0.01
      ) {
        // Пропускаем отправку, если время почти не изменилось
        return
      }

      // Сохраняем текущее время и сектор
      lastSentTimeRef.current = {
        sectorId: sectorDate,
        time: displayTime,
      }

      // Отправляем событие SET_SECTOR_TIME в машину состояний таймлайна
      timelineContext.setSectorTime(sectorDate, displayTime, false)

      // Отключаем логирование для уменьшения количества сообщений
      // console.log(
      //   `[TimelineBar] Отправлено событие SET_SECTOR_TIME для сектора ${sectorDate} с displayTime=${displayTime.toFixed(2)}`,
      // )
    }
  }, [video?.id, sectorDate, displayTime, timelineContext])

  // Если позиция отрицательная, устанавливаем ее в 0
  const displayPosition = position < 0 ? 0 : position
  // Определяем цвет бара в зависимости от активности сектора
  const barColor = isActive ? "bg-red-600" : "bg-gray-400"
  const borderColor = isActive ? "border-t-red-600" : "border-t-gray-400"
  const barWidth = isActive ? "w-[3px]" : "w-[2px]" // Увеличиваем ширину активного бара

  // Рассчитываем позицию бара
  const barPosition = displayPosition

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0"
      style={{ zIndex: 400 }}
    >
      <div
        className={`pointer-events-auto absolute flex cursor-ew-resize flex-col items-center hover:opacity-90 ${isActive ? "" : "opacity-50"}`}
        style={{
          left: `${barPosition}%`, // Позиция бара в процентах от ширины контейнера
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
