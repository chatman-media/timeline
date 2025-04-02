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
  const adjustedRange = useMemo((): TimeRange => {
    const timeRange = endTime - startTime
    const padding = timeRange * 0.05 // 5% отступ с каждой стороны

    // Применяем масштаб к диапазону
    const scaledRange = timeRange * scale
    const scaledPadding = padding * scale

    return {
      startTime: startTime - scaledPadding,
      endTime: endTime + scaledPadding,
      duration: scaledRange + scaledPadding * 2,
    }
  }, [startTime, endTime, scale])

  const { timeStep, subStep } = useMemo(() => {
    const getTimeScale = (visibleDuration: number): TimeScale => {
      // Базовые интервалы в зависимости от видимой длительности
      if (visibleDuration <= 10) return { main: 1, sub: 0.25 }
      if (visibleDuration <= 30) return { main: 2.5, sub: 0.5 }
      if (visibleDuration <= 60) return { main: 5, sub: 1 }
      if (visibleDuration <= 300) return { main: 15, sub: 2.5 }
      if (visibleDuration <= 900) return { main: 30, sub: 7.5 }
      if (visibleDuration <= 3600) return { main: 150, sub: 30 }
      if (visibleDuration <= 3600*3) return { main: 450, sub: 90 }
      return { main: 1080, sub: 360 }
    }

    // Получаем шкалу на основе видимой длительности
    const visibleDuration = adjustedRange.duration
    const timeScale = getTimeScale(visibleDuration)

    return {
      timeStep: timeScale.main,
      subStep: timeScale.sub,
    }
  }, [adjustedRange.duration])

  return {
    timeStep,
    subStep,
    adjustedRange,
  }
}
