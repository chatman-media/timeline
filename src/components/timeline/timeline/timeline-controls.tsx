import { Minus, Plus } from "lucide-react"

interface TimelineControlsProps {
  scale: number
  setScale: (scale: number) => void
  minScale?: number
  maxScale?: number
}

export function TimelineControls({
  scale,
  setScale,
  minScale = 0.001,
  maxScale = 18,
}: TimelineControlsProps) {
  const logMinScale = Math.log(minScale)
  const logMaxScale = Math.log(maxScale)
  const logCurrentScale = Math.log(scale)
  
  const logStep = (logMaxScale - logMinScale) / 100
  
  const handleScaleDecrease = () => {
    const newLogScale = logCurrentScale - logStep
    const newScale = Math.exp(Math.max(newLogScale, logMinScale))
    setScale(newScale)
  }

  const handleScaleIncrease = () => {
    const newLogScale = logCurrentScale + logStep
    const newScale = Math.exp(Math.min(newLogScale, logMaxScale))
    setScale(newScale)
  }

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sliderValue = Number(e.target.value)
    const logScale = logMinScale + (sliderValue / 100) * (logMaxScale - logMinScale)
    setScale(Math.exp(logScale))
  }

  const sliderValue = ((logCurrentScale - logMinScale) / (logMaxScale - logMinScale)) * 100

  return (
    <div className="flex items-center gap-2 p-2 z-10">
      <button
        onClick={handleScaleDecrease}
        className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-800 hover:bg-gray-700 text-gray-200"
      >
        <Minus size={14} />
      </button>
      
      <input
        type="range"
        min={0}
        max={100}
        value={sliderValue}
        onChange={handleSliderChange}
        className="w-24 h-1 rounded-full appearance-none cursor-pointer"
        style={{
          background: "linear-gradient(to right, rgb(25, 102, 107), rgb(25, 102, 107))",
        }}
      />
      
      <button
        onClick={handleScaleIncrease}
        className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-800 hover:bg-gray-700 text-gray-200"
      >
        <Plus size={14} />
      </button>
    </div>
  )
} 