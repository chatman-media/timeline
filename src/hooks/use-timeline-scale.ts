import { useCallback, useMemo, useState } from "react"
import { useMedia } from "./use-media"

interface UseTimelineScaleReturn {
  scale: number
  setScale: (value: number) => void
  increaseScale: () => void
  decreaseScale: () => void
  scalePercentage: string
  scaleStyle: { width: string }
  maxDuration: number
  minStartTime: number
  roundedStartTime: number
  roundedEndTime: number
  timeStep: number
  subStep: number
}

export function useTimelineScale(): UseTimelineScaleReturn {
  const { tracks } = useMedia()

  // Вычисляем начальные значения на основе треков
  const initialValues = useMemo(() => {
    if (!tracks || tracks.length === 0) {
      return {
        maxDuration: 0,
        minStartTime: 0,
        scale: 1,
      }
    }

    // Находим минимальное время начала и максимальную длительность
    let minStart = Infinity
    let maxEnd = -Infinity

    tracks.forEach((track) => {
      if (track.startTime < minStart) minStart = track.startTime
      const trackEnd = track.startTime + track.combinedDuration
      if (trackEnd > maxEnd) maxEnd = trackEnd
    })

    return {
      maxDuration: maxEnd - minStart,
      minStartTime: minStart,
      scale: 1,
    }
  }, [tracks])

  const [scale, setScale] = useState(initialValues.scale)
  const maxDuration = initialValues.maxDuration
  const minStartTime = initialValues.minStartTime

  // Определяем масштаб округления в зависимости от длительности
  const getTimeScale = (duration: number) => {
    if (duration >= 3600) return 3600 // Часы для записей от 1 часа
    if (duration >= 300) return 60 // Минуты для записей от 5 минут
    if (duration >= 60) return 30 // Полминуты для записей от 1 минуты
    return 1 // Секунды для коротких записей
  }

  const timeScale = getTimeScale(maxDuration)

  // Расчеты для шкалы времени
  const timeScaleCalculations = useMemo(() => {
    const baseMainMarks = 10 // Базовое количество основных делений
    const numSubMarks = 5 // Количество промежуточных делений между основными

    // Определяем шаг времени в зависимости от масштаба и длительности
    const timeStep = Math.max(1, Math.ceil(maxDuration / (baseMainMarks * scale)))
    const subStep = timeStep / numSubMarks

    const roundedStartTime = Math.floor(minStartTime / timeStep) * timeStep
    const endTime = minStartTime + maxDuration
    const roundedEndTime = Math.ceil(endTime / timeStep) * timeStep

    return {
      roundedStartTime,
      roundedEndTime,
      timeStep,
      subStep,
    }
  }, [maxDuration, minStartTime, scale])

  return {
    ...timeScaleCalculations,
    maxDuration,
    minStartTime,
    scale,
    setScale,
  }
}
