import { memo } from "react"

import { type Track } from "@/types/videos"

import { formatBitrate, formatDuration, formatTimeWithMilliseconds } from "@/lib/utils"
import { useTimelineScale } from "@/hooks/use-timeline-scale"
import { useVideoStore } from "@/stores/videoStore"

interface VideoTrackProps {
  track: Track
  index: number
  parentRef?: React.RefObject<HTMLDivElement> | null
  TrackSliceWrap?: React.FC<{ children: React.ReactNode }>
}

const VideoTrack = memo(({
  track,
  parentRef,
  TrackSliceWrap,
}: VideoTrackProps) => {
  const { activeTrackId, setActiveTrack, setActiveVideo } = useVideoStore()
  const { minStartTime, maxDuration } = useTimelineScale()
  const firstVideo = track.videos[0]
  const lastVideo = track.videos[track.videos.length - 1]
  const timeToPercent = (time: number) => ((time - minStartTime) / maxDuration) * 100

  // Calculate these values before using them in JSX
  const trackStartTime = firstVideo.startTime || 0
  const trackEndTime = (lastVideo.startTime || 0) + (lastVideo.duration || 0)
  const startOffset = timeToPercent(trackStartTime)
  const width = timeToPercent(trackEndTime) - startOffset

  const videoStream = firstVideo.probeData?.streams.find((s) => s.codec_type === "video")
  const audioStream = firstVideo.probeData?.streams.find((s) => s.codec_type === "audio")
  const isActive = track.id === activeTrackId

  const handleClick = (e: React.MouseEvent, track: Track, videoId?: string) => {
    console.log("handleClick", track, videoId)
    setActiveTrack(track.id)
    if (videoId) {
      setActiveVideo(videoId)
    }
  }

  return (
    <div className="flex">
      <div className="w-full">
        <div
          className="absolute h-full"
          style={{
            left: `${startOffset}%`,
            width: `${width}%`,
          }}
        >
          <div
            className={`drag--parent flex-1 ${isActive ? "drag--parent--bordered" : ""}`}
            style={{ cursor: "pointer" }}
          >
            <TrackSliceWrap ref={parentRef}>
              <div className="absolute h-full w-full timline-border">
                <div className="flex h-full w-full flex-col justify-start">
                  <div className="flex relative">
                    {track.videos.map((video, idx) => {
                      const videoStart = video.startTime || 0
                      const videoDuration = video.duration || 0

                      if (track.videos.length === 1) {
                        return (
                          <div
                            key={video.id}
                            className="absolute h-full w-full"
                            style={{
                              left: "0%",
                              width: "100%",
                              height: "70px",
                            }}
                          >
                            <div className="relative h-full w-full border-r border-gray-600 last:border-r-0">
                              <div
                                className="h-full w-full video-metadata flex flex-row justify-between items-start text-xs text-white truncate p-1 py-[3px] rounded border border-gray-800 hover:border-gray-100 dark:hover:border-gray-100 dark:border-gray-800 m-0"
                                style={{ backgroundColor: "#004346", lineHeight: "13px" }}
                                onClick={(e) => handleClick(e, track, video.id)}
                              >
                                <span className="">V{track.index}</span>
                                {video.path.split("/").pop()}
                                <div className="w-full p-0 m-0 flex space-x-2 justify-end text-xs text-white">
                                  {video.isVideo
                                    ? (
                                      <div className="flex flex-row video-metadata truncate text-xs text-white">
                                        <span>{videoStream?.codec_name?.toUpperCase()}</span>
                                        <span>{videoStream?.width}×{videoStream?.height}</span>
                                        <span>{videoStream?.display_aspect_ratio}</span>
                                        <span>
                                          {videoStream?.r_frame_rate &&
                                            ` ${Math.round(eval(videoStream.r_frame_rate))} fps`}
                                        </span>
                                        {
                                          /* <span>
                                      {videoStream?.bit_rate &&
                                        formatBitrate(videoStream.bit_rate)}
                                    </span> */
                                        }
                                        <span>{formatDuration(track.combinedDuration, 3)}</span>
                                      </div>
                                    )
                                    : (
                                      <div className="flex flex-row video-metadata truncate text-xs text-white">
                                        <span>{audioStream?.codec_name}</span>
                                        <span>каналов: {audioStream?.channels}</span>
                                        <span>
                                          {audioStream?.sample_rate &&
                                            `${
                                              Math.round(parseInt(audioStream.sample_rate) / 1000)
                                            }kHz`}
                                        </span>
                                        <span>
                                          {audioStream?.bit_rate &&
                                            `${formatBitrate(audioStream.bit_rate)}`}
                                        </span>
                                        <span>
                                          {formatDuration(track.combinedDuration, 3)}
                                        </span>
                                      </div>
                                    )}
                                </div>
                              </div>
                              <div className="absolute bottom-0 left-0 text-xs text-gray-100 ml-1">
                                {formatTimeWithMilliseconds(videoStart, false, true, true)}
                              </div>
                              <div className="absolute bottom-0 right-0 text-xs text-gray-100 mr-1">
                                {formatTimeWithMilliseconds(
                                  videoStart + videoDuration,
                                  false,
                                  true,
                                  true,
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      }

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
                            height: "70px",
                            // backgroundColor: "rgba(175, 130, 130, 0.5)"
                          }}
                        >
                          <div className="relative h-full w-full border-r border-gray-600 last:border-r-0">
                            <div
                              className="h-full w-full video-metadata flex flex-row justify-between items-start text-xs text-white truncate p-1 py-[3px] rounded border border-gray-800 hover:border-gray-100 dark:hover:border-gray-100 dark:border-gray-800 m-0"
                              style={{ backgroundColor: "#004346", lineHeight: "13px" }}
                              onClick={(e) => handleClick(e, track, video.id)}
                            >
                              {idx === 0 && <span>V{track.index}</span>}
                              {video.path.split("/").pop()}
                              {idx === 0
                                ? (
                                  <div className="w-full p-0 m-0 flex space-x-2 justify-end text-xs text-white">
                                    <div className="flex flex-row video-metadata truncate text-xs text-white">
                                      <span>
                                        {videoStream?.codec_name?.toUpperCase()}
                                      </span>
                                      <span>{videoStream?.width}×{videoStream?.height}</span>
                                      <span>{videoStream?.display_aspect_ratio}</span>
                                      <span>
                                        {videoStream?.r_frame_rate &&
                                          ` ${Math.round(eval(videoStream.r_frame_rate))} fps`}
                                      </span>
                                      {
                                        /* <span>
                                      {videoStream?.bit_rate &&
                                        formatBitrate(videoStream.bit_rate)}
                                    </span> */
                                      }
                                    </div>
                                  </div>
                                )
                                : (
                                  <div className="w-full p-0 m-0 flex space-x-2 justify-end text-xs text-white">
                                    <div className="flex flex-row video-metadata truncate text-xs text-white">
                                      <span>{formatDuration(track.combinedDuration, 3)}</span>
                                    </div>
                                  </div>
                                )}
                            </div>
                            <div className="absolute bottom-0 left-0 text-xs text-gray-100 ml-1">
                              {formatTimeWithMilliseconds(videoStart, false, true, true)}
                            </div>
                            <div className="absolute bottom-0 right-0 text-xs text-gray-100 mr-1">
                              {formatTimeWithMilliseconds(
                                videoStart + videoDuration,
                                false,
                                true,
                                true,
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {
                    /* <TrackTimestamps
                    trackStartTime={trackStartTime}
                    trackEndTime={trackEndTime}
                  /> */
                  }
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
