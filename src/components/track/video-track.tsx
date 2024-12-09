import { memo } from "react"

import { TimeRange, type Track } from "@/types/videos"

import { TrackMetadata } from "./track-metadata"
import { TrackTimestamps } from "./track-timestamps"
import { useMedia } from "@/hooks/use-media"

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
  maxDuration,
  activeVideo,
  handleTrackClick,
  parentRef,
  TrackSliceWrap,
  currentTime,
}: VideoTrackProps) => {
  const { timeToPercent } = useMedia()
  const firstVideo = track.videos[0]
  const lastVideo = track.videos[track.videos.length - 1]

  // Получаем временные метки для первого и последнего видео
  const trackStartTime = firstVideo.startTime || 0
  const trackEndTime = (lastVideo.startTime || 0) + (lastVideo.duration || 0)

  // Используем timeToPercent для корректного расчета позиции
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
                  <TrackMetadata
                    track={track}
                    videoStream={videoStream}
                  />
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
