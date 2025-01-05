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

export function useTimelineScale(
  duration: number,
  startTime: number,
  endTime: number,
  scale: number = 1,
) {
  const { timeStep, subStep } = useMemo(() => {
    const getTimeScale = (duration: number): TimeScale => {
      // Базовые интервалы в зависимости от длительности
      if (duration <= 30) return { main: 5, sub: 1 }
      if (duration <= 60) return { main: 10, sub: 2 }
      if (duration <= 300) return { main: 30, sub: 5 }
      if (duration <= 900) return { main: 60, sub: 15 }
      if (duration <= 3600) return { main: 300, sub: 60 }
      return { main: 900, sub: 300 }
    }

    // Получаем базовую шкалу и применяем масштаб
    const baseScale = getTimeScale(duration)
    return {
      timeStep: baseScale.main / scale,
      subStep: baseScale.sub / scale,
    }
  }, [duration, scale])

  const adjustedRange = useMemo((): TimeRange => {
    const timeRange = endTime - startTime
    const padding = timeRange * 0.03 // 3% отступ с каждой стороны

    // Применяем масштаб к диапазону
    const scaledRange = timeRange * scale
    const scaledPadding = padding * scale

    return {
      startTime: startTime - scaledPadding,
      endTime: endTime + scaledPadding,
      duration: scaledRange + (scaledPadding * 2),
    }
  }, [startTime, endTime, scale])

  return {
    timeStep,
    subStep,
    adjustedRange,
  }
}
