import { useRef } from "react"

import { useSectionTime } from "@/hooks/use-section-time"

interface TimelineBarProps {
  startTime: number
  endTime: number
  height: number
}

export function TimelineBar({ startTime, endTime, height }: TimelineBarProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { position, handleMouseDown } = useSectionTime({
    sectionStartTime: startTime,
    sectionDuration: endTime - startTime,
    startTime,
    endTime,
  })

  if (position < 0) return null

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none">
      <div
        className="absolute z-50 flex flex-col items-center pointer-events-auto cursor-ew-resize hover:opacity-90"
        style={{
          left: `${position}%`,
          top: "0",
          transform: "translateX(-50%)",
          height: `${height}px`,
        }}
        onMouseDown={handleMouseDown}
      >
        <div className="flex flex-col items-center">
          <div className="w-[10px] h-[6px] bg-red-600" />
          <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-red-600" />
        </div>
        <div className="w-[2px] mt-[-2px] bg-red-600 flex-1" />
        <div className="flex flex-col items-center">
          <div className="w-[2px] mb-[-2px] bg-red-600 h-[5px]" />
          <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[5px] border-b-red-600" />
          <div className="w-[10px] h-[6px] bg-red-600" />
        </div>
      </div>
    </div>
  )
}
