import { memo } from "react"

import { TimeRange, type Track } from "@/types/videos"

import { TrackMetadata } from "./track-metadata"
import { TrackTimestamps } from "./track-timestamps"

interface VideoTrackProps {
  track: Track
  index: number
  timeRanges: TimeRange[]
  maxDuration: number
  activeVideo: string | null | undefined
  handleTrackClick: (e: React.MouseEvent, track: Track) => void
  parentRef: React.RefObject<HTMLDivElement> | null
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
}: VideoTrackProps) => {
  const firstVideo = track.videos[0]
  const lastVideo = track.videos[track.videos.length - 1]
  const trackStartTime = new Date(firstVideo.probeData?.format.tags?.creation_time || 0).getTime() /
    1000
  const trackEndTime =
    new Date(lastVideo.probeData?.format.tags?.creation_time || 0).getTime() / 1000 +
    (lastVideo.probeData?.format.duration || 0)

  const minStartTime = timeRanges && timeRanges.length > 0
    ? Math.min(...timeRanges.map((x) => x.start))
    : trackStartTime

  const startOffset = ((trackStartTime - minStartTime) / maxDuration) *
    100
  const width = ((trackEndTime - trackStartTime) / maxDuration) * 100

  const videoStream = firstVideo.probeData?.streams.find((s) => s.codec_type === "video")
  const isActive = track.index === parseInt(activeVideo?.replace("V", "") || "0")

  return (
    <div className="flex">
      <div className="w-full">
        <div style={{ marginLeft: `${startOffset}%`, width: `${width}%` }}>
          <div
            className={`drag--parent flex-1 ${isActive ? "drag--parent--bordered" : ""}`}
            onClick={(e) => handleTrackClick(e, track)}
            style={{ cursor: "pointer" }}
          >
            <TrackSliceWrap ref={parentRef}>
              <div className="absolute h-full w-full timline-border">
                <div className="flex h-full w-full flex-col justify-between">
                  <TrackMetadata
                    track={track}
                    videoStream={videoStream}
                  />
                  {
                    /* <TrackThumbnails
                    track={track}
                    trackStartTime={trackStartTime}
                    trackEndTime={trackEndTime}
                    scale={scale}
                  /> */
                  }
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
