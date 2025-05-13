import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"

import { Slider } from "@/components/ui/slider"

// Интерфейс для компонента слайдера громкости
export interface VolumeSliderProps {
  volume: number
  volumeRef?: React.RefObject<number> // Опциональный параметр
  onValueChange: (value: number[]) => void
  onValueCommit: () => void
}

// Мемоизированный компонент слайдера громкости для предотвращения лишних рендеров
export const VolumeSlider = memo(
  ({ volume, volumeRef, onValueChange, onValueCommit }: VolumeSliderProps) => {
    // Используем локальное состояние для отображения слайдера
    const [localVolume, setLocalVolume] = useState(volume)

    // Используем ref для отслеживания, находится ли слайдер в процессе перетаскивания
    const isDraggingRef = useRef(false)

    // Используем ref для дебаунсинга обновлений
    const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Обновляем локальное состояние при изменении громкости извне,
    // но только если слайдер не перетаскивается в данный момент
    useEffect(() => {
      if (!isDraggingRef.current) {
        setLocalVolume(volume)
      }
    }, [volume])

    // Обработчик изменения громкости внутри компонента
    const handleLocalVolumeChange = useCallback(
      (value: number[]) => {
        const newVolume = value[0]

        // Устанавливаем флаг, что слайдер перетаскивается
        isDraggingRef.current = true

        // Обновляем локальное состояние для визуального отображения
        setLocalVolume(newVolume)

        // Обновляем значение в volumeRef, если он предоставлен
        if (volumeRef && typeof volumeRef.current !== "undefined") {
          volumeRef.current = newVolume
        }

        // Используем дебаунсинг для уменьшения количества обновлений
        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current)
        }

        // Вызываем onValueChange с задержкой для уменьшения нагрузки
        updateTimeoutRef.current = setTimeout(() => {
          onValueChange(value)
          updateTimeoutRef.current = null
        }, 50) // Небольшая задержка для снижения частоты обновлений
      },
      [onValueChange, volumeRef],
    )

    // Обработчик завершения изменения громкости
    const handleValueCommit = useCallback(() => {
      // Сбрасываем флаг перетаскивания
      isDraggingRef.current = false

      // Очищаем таймаут, если он был установлен
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
        updateTimeoutRef.current = null
      }

      // Вызываем колбэк завершения
      onValueCommit()
    }, [onValueCommit])

    // Вычисляем стили для слайдера
    const fillStyle = useMemo(() => ({ width: `${localVolume * 100}%` }), [localVolume])
    const thumbStyle = useMemo(() => ({ left: `calc(${localVolume * 100}% - 5px)` }), [localVolume])

    return (
      <div className="relative h-1 w-full rounded-full border border-white bg-gray-800">
        <div className="absolute top-0 left-0 h-full rounded-full bg-white" style={fillStyle} />
        <div
          className="absolute top-1/2 h-[11px] w-[11px] -translate-y-1/2 rounded-full border border-white bg-white"
          style={thumbStyle}
        />
        <Slider
          value={[localVolume]}
          min={0}
          max={1}
          step={0.01}
          onValueChange={handleLocalVolumeChange}
          onValueCommit={handleValueCommit}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </div>
    )
  },
)
