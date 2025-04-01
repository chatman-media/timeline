import { useRef, useState } from "react"

import { Slider } from "@/components/ui/slider"
import { useTimelineScale } from "@/hooks/use-timeline-scale"
import { Track } from "@/types/videos"

import { VideoTrack } from "../track"
import { TimelineScale } from "./timeline-scale"
import { TimelineSectionBar } from "./timeline-section-bar"

interface TimelineSectionProps {
  date: string
  tracks: Track[]
  startTime: number
  endTime: number
  duration: number
  isActive?: boolean
}

export function TimelineSection({
  date,
  tracks,
  startTime,
  endTime,
  duration,
  isActive = false,
}: TimelineSectionProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const { timeStep, subStep, adjustedRange } = useTimelineScale(duration, startTime, endTime, scale)

  const handleScaleChange = (value: number[]) => {
    setScale(value[0])
  }

  return (
    <div className={`timeline-section ${isActive ? "" : "bg-muted/50"}`}>
      <div className="relative">
        <div className="absolute right-4 top-[-12px] flex items-center gap-2 z-10 w-[200px]">
          <Slider
            defaultValue={[1]}
            min={0.1}
            max={5}
            step={0.1}
            value={[scale]}
            onValueChange={handleScaleChange}
            className="w-full"
          />
        </div>

        <TimelineSectionBar
          startTime={startTime}
          endTime={endTime}
          sectionStartTime={adjustedRange.startTime}
          sectionDuration={adjustedRange.duration}
          height={tracks.length * 88}
        />

        <div className="w-full flex flex-col gap-2">
          <TimelineScale
            tracks={tracks}
            timeStep={timeStep}
            subStep={subStep}
            adjustedRange={adjustedRange}
            isActive={isActive}
          />

          {tracks.map((track, index) => (
            <div key={`${track.id}-${date}`} className="relative last:mb-6" style={{ height: 80 }}>
              <VideoTrack
                track={track}
                index={index}
                parentRef={parentRef}
                sectionStartTime={adjustedRange.startTime}
                sectionDuration={adjustedRange.duration}
                scale={scale}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
