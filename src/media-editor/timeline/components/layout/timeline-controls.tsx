import { Minus, Plus } from "lucide-react"
import { useTranslation } from "react-i18next"

import { useTimeline } from "@/media-editor/timeline/services"

interface TimelineControlsProps {
  minScale?: number
  maxScale?: number
  sectorDate?: string
}

export function TimelineControls({
  minScale = 0.001,
  maxScale = 18,
  sectorDate,
}: TimelineControlsProps) {
  const { t } = useTranslation()
  const { zoomLevel, zoom: handleZoom } = useTimeline()

  // Получаем текущий масштаб для сектора или общий масштаб
  const currentZoomLevel = zoomLevel || 1

  // Если указан sectorDate, отправляем событие для изменения масштаба сектора
  const handleSectorZoom = (newScale: number) => {
    if (sectorDate) {
      // Отправляем событие для обновления масштаба сектора
      window.dispatchEvent(
        new CustomEvent("sector-zoom-change", {
          detail: { sectorDate, zoomLevel: newScale },
        }),
      )
    } else {
      // Используем общий масштаб
      handleZoom(newScale)
    }
  }

  const logMinScale = Math.log(minScale)
  const logMaxScale = Math.log(maxScale)
  const logCurrentScale = Math.log(currentZoomLevel)
  const logStep = (logMaxScale - logMinScale) / 100

  const handleScaleDecrease = (): void => {
    const newLogScale = logCurrentScale - logStep
    const newScale = Math.exp(Math.max(newLogScale, logMinScale))
    handleSectorZoom(newScale)
  }

  const handleScaleIncrease = (): void => {
    const newLogScale = logCurrentScale + logStep
    const newScale = Math.exp(Math.min(newLogScale, logMaxScale))
    handleSectorZoom(newScale)
  }

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const sliderValue = Number(e.target.value)
    const logScale = logMinScale + (sliderValue / 100) * (logMaxScale - logMinScale)
    const newScale = Math.exp(logScale)
    handleSectorZoom(newScale)
  }

  const sliderValue =
    logMaxScale === logMinScale
      ? 0
      : ((logCurrentScale - logMinScale) / (logMaxScale - logMinScale)) * 100

  return (
    <div className="z-10 flex items-center gap-2 p-2">
      <button
        onClick={handleScaleDecrease}
        className="flex h-4 w-4 items-center justify-center rounded-full border-1 border-white bg-gray-800 text-gray-200 hover:bg-gray-700"
        title={t('timeline.zoom.zoomOut')}
      >
        <Minus size={12} />
      </button>

      <div className="relative h-1 w-24 rounded-full border border-white bg-gray-800">
        <div
          className="absolute top-0 left-0 h-full rounded-full bg-white"
          style={{ width: `${sliderValue}%` }}
        />
        <input
          type="range"
          min={0}
          max={100}
          value={String(sliderValue)}
          onChange={handleSliderChange}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          aria-label={t('timeline.zoom.fitToScreen')}
        />
      </div>

      <button
        onClick={handleScaleIncrease}
        className="flex h-4 w-4 items-center justify-center rounded-full border-1 border-white bg-gray-800 text-gray-200 hover:bg-gray-700"
        title={t('timeline.zoom.zoomIn')}
      >
        <Plus size={12} />
      </button>
    </div>
  )
}
