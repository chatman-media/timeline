import { memo } from "react"

import { TimeRange, type Track } from "@/types/videos"

import { TrackMetadata } from "./track-metadata"
import { TrackTimestamps } from "./track-timestamps"
import { useMedia } from "@/hooks/use-media"
import { formatDuration } from "@/lib/utils"
import { useTimelineScale } from "@/hooks/use-timeline-scale"

interface VideoTrackProps {
  track: Track
  index: number
  timeRanges: TimeRange[]
  maxDuration: number
  activeVideo: string | null | undefined
  handleTrackClick: (e: React.MouseEvent, track: Track) => void
  parentRef?: React.RefObject<HTMLDivElement> | null
  currentTime: number
  TrackSliceWrap?: React.FC<{ children: React.ReactNode }>
}

const VideoTrack = memo(({
  track,
  timeRanges,
  activeVideo,
  handleTrackClick,
  parentRef,
  TrackSliceWrap,
  currentTime,
}: VideoTrackProps) => {
  const { tracks } = useMedia()
  const { scale, minStartTime, maxDuration } = useTimelineScale()
  const firstVideo = track.videos[0]
  const lastVideo = track.videos[track.videos.length - 1]
  const timeToPercent = (time: number) => ((time - minStartTime) / maxDuration) * 100

  // Calculate these values before using them in JSX
  const trackStartTime = firstVideo.startTime || 0
  const trackEndTime = (lastVideo.startTime || 0) + (lastVideo.duration || 0)
  const startOffset = timeToPercent(trackStartTime)
  const width = timeToPercent(trackEndTime) - startOffset

  const videoStream = firstVideo.probeData?.streams.find((s) => s.codec_type === "video")
  const isActive = track.index === parseInt(activeVideo?.replace("V", "") || "0")

  return (
    <div className="flex">
      <div className="w-full">
        <div style={{ marginLeft: `${startOffset}%`, width: `${width}%` }}>
          <div
            className={`drag--parent flex-1 ${isActive ? "drag--parent--bordered" : ""}`}
            onClick={(e) => handleTrackClick?.(e, track)}
            style={{ cursor: "pointer" }}
          >
            <TrackSliceWrap ref={parentRef}>
              <div className="absolute h-full w-full timline-border">
                <div className="flex h-full w-full flex-col justify-between">
                  <div className="w-full px-1 mb-1 flex justify-between text-xs text-gray-100">
                    <div className="flex flex-row video-metadata truncate mr-2">
                      <span>V{track.index}</span>
                      <span>{videoStream?.codec_name?.toUpperCase()}</span>
                      <span>{videoStream?.width}×{videoStream?.height}</span>
                      <span>{videoStream?.display_aspect_ratio}</span>
                    </div>
                    <div className="flex flex-col items-end time">
                      <span>{formatDuration(track.combinedDuration, 2)}</span>
                    </div>
                  </div>

                  <div className="flex h-[calc(100%-2rem)] relative">
                    {track.videos.map((video, idx) => {
                      const videoStart = video.startTime || 0
                      const videoDuration = video.duration || 0

                      // Используем локальные переменные для расчета процентов
                      const trackStartTime = track.videos[0].startTime || 0
                      const trackEndTime = (track.videos[track.videos.length - 1].startTime || 0) +
                        (track.videos[track.videos.length - 1].duration || 0)

                      const segmentStart =
                        ((videoStart - trackStartTime) / (trackEndTime - trackStartTime)) * 100
                      const segmentWidth = (videoDuration / (trackEndTime - trackStartTime)) * 100

                      console.log("Segment Start:", segmentStart)
                      console.log("Segment Width:", segmentWidth)

                      return (
                        <div
                          key={video.id || video.name}
                          className="absolute h-full"
                          style={{
                            left: `${segmentStart}%`,
                            width: `${segmentWidth}%`,
                            // backgroundColor: "rgba(175, 130, 130, 0.5)"
                          }}
                        >
                          <div className="relative h-full w-full border-r border-gray-600 last:border-r-0">
                            <div
                              className="h-full w-full text-xs text-white truncate bg-opacity-50 p-1 rounded border border-gray-800 hover:border-gray-100 dark:hover:border-gray-100 dark:border-gray-800"
                              style={{ backgroundColor: "rgba(175, 130, 130, 0.5)" }}
                            >
                              {video.path.split("/").pop()}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <TrackTimestamps
                    trackStartTime={trackStartTime}
                    trackEndTime={trackEndTime}
                  />
                </div>
              </div>
            </TrackSliceWrap>
          </div>
        </div>
      </div>
    </div>
  )
})

VideoTrack.displayName = "VideoTrack"

export { VideoTrack }
