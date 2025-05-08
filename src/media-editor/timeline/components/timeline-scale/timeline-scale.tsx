import { TimelineMarks } from "./timeline-marks"

interface TimelineScaleProps {
  timeStep: number
  subStep: number
  adjustedRange: TimeRange
  isActive: boolean
  timeToPosition?: (time: number) => number
}

interface TimeRange {
  startTime: number
  endTime: number
  duration: number
}

export function TimelineScale({
  timeStep,
  subStep,
  adjustedRange,
  isActive,
  timeToPosition,
}: TimelineScaleProps) {
  // Если функция timeToPosition не передана, создаем ее локально
  const calculatePosition =
    timeToPosition ||
    ((time: number) => {
      return ((time - adjustedRange.startTime) / adjustedRange.duration) * 100
    })
  return (
    <div className={`relative mb-[13px] flex w-full flex-col`}>
      {/* Добавляем заголовок и линию времени */}
      <div className="flex">
        <div className="sticky left-0 z-10 min-w-[120px]"></div>
        <div className="relative w-full">
          <div className="h-0.5 w-full" style={{ background: "rgb(47, 61, 62)", height: "1px" }}>
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
      />
    </div>
  )
}
