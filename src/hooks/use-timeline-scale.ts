import { useMemo } from "react"

interface TimeScale {
  main: number
  sub: number
}

interface TimeRange {
  startTime: number
  endTime: number
  duration: number
}

export function useTimelineScale(duration: number, startTime: number, endTime: number) {
  const { timeStep, subStep } = useMemo(() => {
    const getTimeScale = (duration: number): TimeScale => {
      if (duration <= 30) return { main: 5, sub: 1 }
      if (duration <= 60) return { main: 10, sub: 2 }
      if (duration <= 300) return { main: 30, sub: 5 }
      if (duration <= 900) return { main: 60, sub: 15 }
      if (duration <= 3600) return { main: 300, sub: 60 }
      return { main: 900, sub: 300 }
    }

    const scale = getTimeScale(duration)
    return {
      timeStep: scale.main,
      subStep: scale.sub,
    }
  }, [duration])

  const adjustedRange = useMemo((): TimeRange => {
    const timeRange = endTime - startTime
    const padding = timeRange * 0.03
    return {
      startTime: startTime - padding,
      endTime: endTime + padding,
      duration: (endTime + padding) - (startTime - padding),
    }
  }, [startTime, endTime])

  return {
    timeStep,
    subStep,
    adjustedRange,
  }
}
