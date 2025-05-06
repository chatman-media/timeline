import { memo, useRef } from "react"

import { useTimeline } from "@/media-editor/timeline/services"
import { Track } from "@/types/media"

import { VideoItem } from "./video-item"

interface TimelineTrackProps {
  track: Track
  index: number
  sectionStartTime: number
  sectionDuration: number
  coordinates: {
    left: number
    width: number
    videos: Record<
      string,
      {
        left: number
        width: number
      }
    >
  }
}

const TimelineTrack = memo(function TimelineTrack({
  track,
  coordinates,
  sectionStartTime,
}: TimelineTrackProps) {
  const { zoomLevel } = useTimeline()
  const containerRef = useRef<HTMLDivElement>(null)

  if (!track.videos || track.videos.length === 0) {
    return null
  }

  return (
    <div className="flex" ref={containerRef}>
      <div className="h-full w-full">
        <div
          className="relative h-full"
          style={{
            left: `${coordinates.left}%`,
            width: `${coordinates.width}%`,
          }}
        >
          <div
            className="drag--parent flex-1"
            style={{
              cursor: "pointer",
              zIndex: 1,
              position: "relative",
            }}
          >
            <div className="slice--parent" style={{ backgroundColor: "rgba(1, 74, 79, 0.25)" }}>
              <div className="timline-border absolute h-full w-full">
                <div className="flex h-full w-full flex-col justify-start">
                  <div className="relative flex" style={{ height: "70px" }}>
                    {/* Используем компонент VideoItem для отображения каждого видео */}
                    {track.videos?.map((video) => (
                      <VideoItem
                        key={video.id}
                        video={video}
                        track={track}
                        sectionStart={sectionStartTime}
                        zoomLevel={zoomLevel}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

TimelineTrack.displayName = "VideoTrack"

export { TimelineTrack as VideoTrack }
