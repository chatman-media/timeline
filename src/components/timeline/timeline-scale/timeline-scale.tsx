import { useTimelineContext } from "@/providers/timeline-provider"

import { TimelineMarks } from "."

interface TimelineScaleProps {
  startTime: number
  endTime: number
  duration: number
}

export function TimelineScale({ startTime, endTime, duration }: TimelineScaleProps) {
  const { zoomLevel } = useTimelineContext()

  console.log("TimelineScale zoomLevel:", zoomLevel)

  // Определяем шаг в зависимости от масштаба
  let timeStep = 1
  if (zoomLevel > 5) {
    timeStep = 1 // При большом увеличении - 1 секунда
  } else if (zoomLevel > 2) {
    timeStep = 5 // При увеличении - 5 секунд
  } else if (zoomLevel > 1) {
    timeStep = 10 // При небольшом увеличении - 10 секунд
  } else if (zoomLevel > 0.5) {
    timeStep = 30 // При уменьшении - 30 секунд
  } else {
    timeStep = 60 // При сильном уменьшении - 1 минута
  }

  console.log("TimelineScale timeStep:", timeStep)

  // При увеличении масштаба делаем более мелкие деления
  const subStep = timeStep / (zoomLevel > 1 ? 5 : 2)

  return (
    <div className="relative mb-[13px] flex w-full flex-col">
      <div className="h-0.5 w-full" style={{ background: "rgb(47, 61, 62)", height: "1px" }} />
      <TimelineMarks
        startTime={startTime}
        endTime={endTime}
        duration={duration}
        timeStep={timeStep}
        subStep={subStep}
        isActive={true}
      />
    </div>
  )
}
