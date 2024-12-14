import { useRef } from "react"
import { Track } from "@/types/videos"
import { TimelineScale } from "./timeline-scale"
import { VideoTrack } from "../track"
import { TrackSliceWrap } from "../track/track-slice-wrap"
import { useTimelineScale } from "@/hooks/use-timeline-scale"
import { TimelineSectionBar } from "./timeline-section-bar"

interface TimelineSectionProps {
  date: string
  tracks: Track[]
  startTime: number
  endTime: number
  duration: number
}

export function TimelineSection(
  { date, tracks, startTime, endTime, duration }: TimelineSectionProps,
) {
  const parentRef = useRef<HTMLDivElement>(null)
  const { timeStep, subStep, adjustedRange } = useTimelineScale(duration, startTime, endTime)

  return (
    <div className="timeline-section mb-4">
      <div className="relative">
        <TimelineSectionBar
          sectionStartTime={adjustedRange.startTime}
          sectionDuration={adjustedRange.duration}
          height={tracks.length * 90}
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
              className="relative"
              style={{ height: 80 }}
            >
              <VideoTrack
                track={track}
                index={index}
                parentRef={parentRef}
                TrackSliceWrap={TrackSliceWrap}
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
