import { useRef } from "react"
import { Track } from "@/types/videos"
import { TimelineScale } from "./timeline-scale"
import { VideoTrack } from "../track"
import { useTimelineScale } from "@/hooks/use-timeline-scale"
import { TimelineSectionBar } from "./timeline-section-bar"

interface TimelineSectionProps {
  date: string
  tracks: Track[]
  startTime: number
  endTime: number
  duration: number
  isActive?: boolean
}

export function TimelineSection(
  { date, tracks, startTime, endTime, duration, isActive = false }: TimelineSectionProps,
) {
  const parentRef = useRef<HTMLDivElement>(null)
  const { timeStep, subStep, adjustedRange } = useTimelineScale(duration, startTime, endTime)

  return (
    <div
      className={`timeline-section ${
        isActive ? "border-l-[1px] border-[#ffffff]" : "border-l-[1px] border-transparent"
      }`}
    >
      <div className="relative">
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
          />

          {tracks.map((track, index) => (
            <div
              key={`${track.id}-${date}`}
              className="relative last:mb-6"
              style={{ height: 80 }}
            >
              <VideoTrack
                track={track}
                index={index}
                parentRef={parentRef}
                sectionStartTime={adjustedRange.startTime}
                sectionDuration={adjustedRange.duration}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}