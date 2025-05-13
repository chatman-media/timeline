import { useTimelineScale } from "../use-timeline-scale"
import { TimelineMarks } from "./timeline-marks"

interface TimeRange {
  startTime: number
  endTime: number
  duration: number
}

interface TimelineScaleProps {
  // Старый интерфейс
  timeStep?: number
  subStep?: number
  adjustedRange?: TimeRange
  isActive?: boolean
  timeToPosition?: (time: number) => number

  // Новый интерфейс
  startTime?: number
  endTime?: number
  duration?: number
  sectorDate?: string
  sectorZoomLevel?: number
}

export function TimelineScale({
  // Поддержка старого интерфейса
  timeStep: propTimeStep,
  subStep: propSubStep,
  adjustedRange: propAdjustedRange,
  isActive = true,
  timeToPosition,

  // Поддержка нового интерфейса
  startTime,
  endTime,
  duration,
  sectorZoomLevel = 1,
}: TimelineScaleProps) {
  // Создаем объект adjustedRange из новых параметров, если они переданы
  const adjustedRange = propAdjustedRange || {
    startTime: startTime || 0,
    endTime: endTime || 0,
    duration: duration || 0,
  }

  // Используем хук для расчета шагов шкалы времени
  const { timeStep: calculatedTimeStep, subStep: calculatedSubStep } = useTimelineScale(
    adjustedRange.duration,
    adjustedRange.startTime,
    adjustedRange.endTime,
    sectorZoomLevel,
  )

  // Используем переданные значения или рассчитанные
  const timeStep = propTimeStep || calculatedTimeStep
  const subStep = propSubStep || calculatedSubStep

  // Если функция timeToPosition не передана, создаем ее локально
  const calculatePosition =
    timeToPosition ||
    ((time: number) => {
      return ((time - adjustedRange.startTime) / adjustedRange.duration) * 100
    })

  return (
    <div className={`relative mb-[13px] flex w-full flex-col`} style={{ zIndex: 300 }}>
      {/* Добавляем заголовок и линию времени */}
      <div className="flex">
        {/* Удалена левая панель */}
        <div className="relative w-full pl-[10px]" style={{ zIndex: 300 }}>
          <div
            className="h-0.5"
            style={{
              background: "rgb(47, 61, 62)",
              height: "1px",
              zIndex: 300,
              width: "100%",
            }}
          >
            {/* Не отображаем видеоклипы здесь, они будут отображаться в VideoTrack */}
          </div>
        </div>
      </div>

      <TimelineMarks
        startTime={adjustedRange.startTime}
        endTime={adjustedRange.endTime}
        duration={adjustedRange.duration}
        timeStep={timeStep}
        subStep={subStep}
        isActive={isActive}
        timeToPosition={calculatePosition}
        sectionId={`section-${startTime?.toFixed(0) || "0"}-${endTime?.toFixed(0) || "0"}`}
      />
    </div>
  )
}
