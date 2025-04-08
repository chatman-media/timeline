import { useMemo } from "react"
import { TimeRange } from "@/types/time-range"

export function useTimelineScale(
  startTime: number,
  endTime: number,
  scale: number
) {
  const timeStep = useMemo(() => {
    const desiredPixelsPerStep = 100
    const pixelsPerSecond = scale
    const step = Math.ceil(desiredPixelsPerStep / pixelsPerSecond)
    return Math.max(0.1, step)
  }, [scale])

  const subStep = useMemo(() => {
    return timeStep / 5
  }, [timeStep])

  const adjustedRange = useMemo<TimeRange>(() => {
    const start = Math.floor(startTime / timeStep) * timeStep
    const end = Math.ceil(endTime / timeStep) * timeStep
    return { start, end, type: "time" }
  }, [startTime, endTime, timeStep])

  return {
    timeStep,
    subStep,
    adjustedRange,
  }
}
