import { MediaFile, TimeRange } from "@/types/videos"

interface TimelineVideoMarkerProps {
  video: MediaFile
  adjustedRange: TimeRange
  trackId: string
  videoIndex: number
}

export function TimelineVideoMarker(
  { video, adjustedRange, trackId, videoIndex }: TimelineVideoMarkerProps,
) {
  const videoStart = video.startTime || 0
  const videoDuration = video.duration || 0
  const rangeWidth = (videoDuration / adjustedRange.duration) * 100
  const rangePosition = ((videoStart - adjustedRange.startTime) / adjustedRange.duration) * 100

  return (
    <div
      key={`${trackId}-${videoIndex}`}
      className="h-0.5 absolute"
      style={{
        width: `${rangeWidth}%`,
        left: `${rangePosition}%`,
        background: "rgb(25, 102, 107)",
      }}
    />
  )
}
