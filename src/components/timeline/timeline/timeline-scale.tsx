import { useTimeline } from "../../../providers/timeline-provider"
import { TimelineMarks } from "./timeline-marks"

interface TimelineScaleProps {
  startTime: number
  endTime: number
  duration: number
}

export function TimelineScale({ startTime, endTime, duration }: TimelineScaleProps) {
  const { zoomLevel } = useTimeline()
  const timeStep = Math.ceil(100 / zoomLevel)
  const subStep = timeStep / 5

  return (
    <div className="relative w-full flex flex-col mb-[13px]">
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
