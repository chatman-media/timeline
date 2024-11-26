import { useCallback, useState } from "react"

interface TimelineProps {
  startTime: number
  duration: number
  onChange?: (time: number) => void
}

export interface TimelineMetadata {
  isPlaying: boolean // Состояние воспроизведения
  playbackRate: number // Скорость воспроизведения (1 = нормальная)
  loop: boolean // Зацикленное воспроизведение
  markers: { // Маркеры на временной шкале
    id: string
    time: number
    label: string
    color?: string
  }[]
  inPoint: number // Точка входа для обрезки
  outPoint: number // Точка выхода для обрезки
  snapToGrid: boolean // Привязка к сетке временной шкалы
  zoom: number // Уровень масштабирования (1 = 100%)
}

export const useTimeline = ({ startTime, duration, onChange }: TimelineProps) => {
  const [currentTime, setCurrentTime] = useState(startTime)
  const [metadata, setMetadata] = useState<TimelineMetadata>({
    isPlaying: false,
    playbackRate: 1,
    loop: false,
    markers: [],
    inPoint: startTime,
    outPoint: startTime + duration,
    snapToGrid: true,
    zoom: 1,
  })

  // Преобразование времени в проценты
  const timeToPercent = useCallback((time: number) => {
    return ((time - startTime) / duration) * 100
  }, [startTime, duration])

  // Преобразование процентов во время
  const percentToTime = useCallback((percent: number) => {
    return startTime + (duration * percent) / 100
  }, [startTime, duration])

  // Обновление времени с вызовом callback
  const updateTime = useCallback((time: number) => {
    setCurrentTime(time)
    onChange?.(time)
  }, [onChange])

  // Обновление метаданных
  const updateMetadata = useCallback((updates: Partial<TimelineMetadata>) => {
    setMetadata((prev) => ({ ...prev, ...updates }))
  }, [])

  // Добавление маркера
  const addMarker = useCallback((time: number, label: string, color?: string) => {
    setMetadata((prev) => ({
      ...prev,
      markers: [...prev.markers, {
        id: crypto.randomUUID(),
        time,
        label,
        color,
      }],
    }))
  }, [])

  // Удаление маркера
  const removeMarker = useCallback((id: string) => {
    setMetadata((prev) => ({
      ...prev,
      markers: prev.markers.filter((marker) => marker.id !== id),
    }))
  }, [])

  // Установка точек входа/выхода
  const setInOutPoints = useCallback((inPoint: number, outPoint: number) => {
    setMetadata((prev) => ({
      ...prev,
      inPoint: Math.max(startTime, inPoint),
      outPoint: Math.min(startTime + duration, outPoint),
    }))
  }, [startTime, duration])

  return {
    currentTime,
    timeToPercent,
    percentToTime,
    updateTime,
    metadata,
    updateMetadata,
    addMarker,
    removeMarker,
    setInOutPoints,
  }
}
