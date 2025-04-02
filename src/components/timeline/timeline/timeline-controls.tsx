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
  minScale = 0.1,
  maxScale = 2.0,
}: TimelineControlsProps) {
  const scaleStep = scale < 0.3 ? 0.1 : scale < 0.8 ? 0.2 : 0.3

  return (
    <div className="flex items-center gap-2 p-2 z-10">
      <button
        onClick={() => setScale(Math.max(scale - scaleStep, minScale))}
        className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-800 hover:bg-gray-700 text-gray-200"
      >
        <Minus size={14} />
      </button>
      
      <input
        type="range"
        min={minScale * 100}
        max={maxScale * 100}
        value={scale * 100}
        onChange={(e) => setScale(Number(e.target.value) / 100)}
        className="w-24 h-1 rounded-full appearance-none cursor-pointer"
        style={{
          background: "linear-gradient(to right, rgb(25, 102, 107), rgb(25, 102, 107))",
        }}
      />
      
      <button
        onClick={() => setScale(Math.min(scale + scaleStep, maxScale))}
        className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-800 hover:bg-gray-700 text-gray-200"
      >
        <Plus size={14} />
      </button>
    </div>
  )
} 