import { useMemo, useState } from "react"
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

  // Расчеты для шкалы времени
  const timeScaleCalculations = useMemo(() => {
    // Определяем масштаб округления в зависимости от длительности
    const getTimeScale = (duration: number) => {
      if (duration >= 3600) return 3600 // Часы для записей от 1 часа
      if (duration >= 300) return 60 // Минуты для записей от 5 минут
      if (duration >= 60) return 30 // Полминуты для записей от 1 минуты
      return 1 // Секунды для коротких записей
    }

    const timeScale = getTimeScale(maxDuration)
    const baseMainMarks = 10 // Базовое количество основных делений
    const numSubMarks = 5 // Количество промежуточных делений между основными

    // Округляем начальное время согласно масштабу
    const roundedStartTime = Math.floor(minStartTime / timeScale) * timeScale
    const endTime = roundedStartTime + maxDuration
    const roundedEndTime = Math.ceil(endTime / timeScale) * timeScale

    // Вычисляем шаг для круглых значений
    const timeStep = Math.ceil((roundedEndTime - roundedStartTime) / baseMainMarks / timeScale) * timeScale
    const subStep = timeStep / numSubMarks

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
