import { Track } from "@/types/videos"
import { TimelineMarks } from "./timeline-marks"

interface TimelineScaleProps {
  tracks: Track[]
  timeStep: number
  subStep: number
  adjustedRange: TimeRange
}

interface TimeRange {
  startTime: number
  endTime: number
  duration: number
}

export function TimelineScale({
  tracks,
  timeStep,
  subStep,
  adjustedRange,
}: TimelineScaleProps) {
  return (
    <div className="relative w-full flex flex-col mb-[13px]">
      <div
        className="h-0.5 w-full"
        style={{ background: "rgb(47, 61, 62)", height: "1px" }}
      >
        {tracks.map((track: Track) =>
          track.videos.map((video, videoIndex) => {
            const videoStart = video.startTime || 0
            const videoDuration = video.duration || 0
            const rangeWidth = (videoDuration / adjustedRange.duration) * 100
            const rangePosition =
              ((videoStart - adjustedRange.startTime) / adjustedRange.duration) * 100

            return (
              <div
                key={`${track.id}-${videoIndex}`}
                className="h-0.5 absolute"
                style={{
                  width: `${rangeWidth}%`,
                  left: `${rangePosition}%`,
                  background: "rgb(25, 102, 107)",
                }}
              />
            )
          })
        )}
      </div>

      <div className="relative w-full h-8">
        <TimelineMarks
          startTime={adjustedRange.startTime}
          endTime={adjustedRange.endTime}
          duration={adjustedRange.duration}
          timeStep={timeStep}
          subStep={subStep}
        />
      </div>
    </div>
  )
}
