import { useRef } from "react"

import { useTimelineScale } from "@/hooks/use-timeline-scale"
import { useTimelineZoom } from "@/hooks/use-timeline-zoom"
import { Track } from "@/types/videos"

import { VideoTrack } from "../track"
import { TimelineControls } from "./timeline-controls"
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
  const { scale, setScale, containerRef } = useTimelineZoom()
  const { timeStep, subStep, adjustedRange } = useTimelineScale(duration, startTime, endTime, scale)

  return (
    <div
      ref={containerRef}
      className={`timeline-section relative flex flex-col ${isActive ? "" : "bg-muted/50"}`}
      style={{ overflow: "hidden" }}
    >
      <div className="h-8 relative flex items-center justify-end px-4">
        <TimelineControls scale={scale} setScale={setScale} />
      </div>

      <div className="relative flex-1">
        <div className="w-full flex flex-col gap-2">
          <TimelineScale
            tracks={tracks}
            timeStep={timeStep}
            subStep={subStep}
            adjustedRange={adjustedRange}
            isActive={isActive}
          />

          <div className="flex flex-col gap-2 relative">
            {tracks.map((track, index) => (
              <div
                key={`${track.id}-${date}`}
                className="relative"
                style={{
                  height: 80,
                  zIndex: tracks.length - index,
                }}
              >
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

        <TimelineSectionBar
          startTime={startTime}
          endTime={endTime}
          sectionStartTime={adjustedRange.startTime}
          sectionDuration={adjustedRange.duration}
          height={tracks.length * 88}
        />
      </div>
    </div>
  )
}
