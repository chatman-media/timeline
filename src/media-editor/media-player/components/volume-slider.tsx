import { memo, useCallback, useEffect, useMemo, useState } from "react"

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

    // Обновляем локальное состояние при изменении громкости извне
    useEffect(() => {
      setLocalVolume(volume)
    }, [volume])

    // Обработчик изменения громкости внутри компонента
    const handleLocalVolumeChange = useCallback(
      (value: number[]) => {
        const newVolume = value[0]
        setLocalVolume(newVolume)

        // Обновляем значение в volumeRef, если он предоставлен
        if (volumeRef && typeof volumeRef.current !== "undefined") {
          volumeRef.current = newVolume
        }

        onValueChange(value)
      },
      [onValueChange, volumeRef],
    )

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
          onValueCommit={onValueCommit}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </div>
    )
  },
)
