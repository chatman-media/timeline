import { useTimelineScale } from "@/hooks/use-timeline-scale"

import { Button } from "../ui/button"

export function ScaleControl() {
  const { scale, decreaseScale, increaseScale } = useTimelineScale()
  const scalePercentage = `${Math.round(scale * 100)}%`

  const scaleStyle = {
    width: `${scale * 100}%`,
  }

  return (
    <div className="flex flex-col gap-4 w-full px-3 sm:px-5">
      <div className="flex flex-row gap-2 justify-end">
        <div className="m-2 flex items-center w-90">
          <Button
            onClick={decreaseScale}
            variant="secondary"
            size="icon"
            className="h-8 w-8"
          >
            -
          </Button>

          <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-800 rounded relative mx-2">
            <div
              className="absolute h-full bg-primary rounded"
              style={scaleStyle}
            />
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={scale}
              onChange={() => decreaseScale()}
              className="absolute w-full h-full opacity-0 cursor-pointer"
            />
          </div>

          <Button
            onClick={increaseScale}
            variant="secondary"
            size="icon"
            className="h-8 w-8"
          >
            +
          </Button>

          <span className="text-sm text-gray-500 dark:text-gray-400 w-16 text-right">
            {scalePercentage}
          </span>
        </div>
      </div>
    </div>
  )
}
