import { Minus, Plus } from "lucide-react"

import { useTimelineContext } from "@/providers/timeline-provider"

interface TimelineControlsProps {
  minScale?: number
  maxScale?: number
}

export function TimelineControls({ minScale = 0.001, maxScale = 18 }: TimelineControlsProps) {
  const { zoomLevel, zoom: handleZoom } = useTimelineContext()

  console.log("TimelineControls initial zoomLevel:", zoomLevel)

  const logMinScale = Math.log(minScale)
  const logMaxScale = Math.log(maxScale)
  const logCurrentScale = Math.log(zoomLevel || 1)
  const logStep = (logMaxScale - logMinScale) / 100

  console.log("TimelineControls scale values:", {
    minScale,
    maxScale,
    currentScale: zoomLevel,
    logMinScale,
    logMaxScale,
    logCurrentScale,
    logStep,
  })

  const handleScaleDecrease = () => {
    const newLogScale = logCurrentScale - logStep
    const newScale = Math.exp(Math.max(newLogScale, logMinScale))
    console.log("TimelineControls decrease:", {
      newLogScale,
      newScale,
      currentScale: zoomLevel,
    })
    handleZoom(newScale)
  }

  const handleScaleIncrease = () => {
    const newLogScale = logCurrentScale + logStep
    const newScale = Math.exp(Math.min(newLogScale, logMaxScale))
    console.log("TimelineControls increase:", {
      newLogScale,
      newScale,
      currentScale: zoomLevel,
    })
    handleZoom(newScale)
  }

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sliderValue = Number(e.target.value)
    const logScale = logMinScale + (sliderValue / 100) * (logMaxScale - logMinScale)
    const newScale = Math.exp(logScale)
    console.log("TimelineControls slider:", {
      sliderValue,
      logScale,
      newScale,
      currentScale: zoomLevel,
    })
    handleZoom(newScale)
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
        />
      </div>

      <button
        onClick={handleScaleIncrease}
        className="flex h-4 w-4 items-center justify-center rounded-full border-1 border-white bg-gray-800 text-gray-200 hover:bg-gray-700"
      >
        <Plus size={12} />
      </button>
    </div>
  )
}
