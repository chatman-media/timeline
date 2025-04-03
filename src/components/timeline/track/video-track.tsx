import { memo } from "react"

import { useRootStore } from "@/hooks/use-root-store"
import { formatBitrate, formatDuration, formatTimeWithMilliseconds } from "@/lib/utils"
import { type Track } from "@/types/videos"
import { getAspectRatio, getFps } from "@/utils/video-utils"

interface VideoTrackProps {
  track: Track
  index: number
  parentRef: React.RefObject<HTMLDivElement>
  sectionStartTime: number
  sectionDuration: number
}

const VideoTrack = memo(
  ({ track, parentRef, sectionStartTime, sectionDuration }: VideoTrackProps) => {
    const { setCurrentTime, setActiveVideo, activeTrackId, setActiveTrack } = useRootStore()

    if (!track.videos || track.videos.length === 0) {
      return null
    }

    const firstVideo = track.videos[0]
    const lastVideo = track.videos[track.videos.length - 1]

    if (!firstVideo || !lastVideo) {
      return null
    }

    const timeToPercent = (time: number) => {
      if (!sectionStartTime || !sectionDuration || sectionDuration === 0) return 0
      const percent = ((time - sectionStartTime) / sectionDuration) * 100
      return Math.max(0, Math.min(100, percent))
    }

    const trackStartTime = firstVideo.startTime || 0
    const trackEndTime = (lastVideo.startTime || 0) + (lastVideo.duration || 0)
    const startOffset = timeToPercent(trackStartTime)
    const width = timeToPercent(trackEndTime) - startOffset

    const videoStream = firstVideo.probeData?.streams.find((s) => s.codec_type === "video")
    const audioStream = firstVideo.probeData?.streams.find((s) => s.codec_type === "audio")
    const isActive = track.id === activeTrackId

    const handleClick = (_e: React.MouseEvent, track: Track, videoId?: string) => {
      setActiveTrack(track.id)
      if (videoId) {
        setActiveVideo(videoId)
        const video = track.videos.find((v) => v.id === videoId)
        if (video) {
          const videoStartTime = video.startTime || 0
          setCurrentTime(videoStartTime)
        }
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
              <div className="slice--parent bg-[#014a4f]" ref={parentRef}>
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
                              {/* Содержимое для одиночного видео */}
                              <div className="relative h-full w-full border-r border-gray-600 last:border-r-0">
                                <div
                                  className="h-full w-full video-metadata flex flex-row justify-between items-start text-xs text-white truncate p-1 py-[3px] rounded border border-gray-800 hover:border-gray-100 dark:hover:border-gray-100 dark:border-gray-800 m-0"
                                  style={{
                                    backgroundColor: "#004346",
                                    lineHeight: "13px",
                                  }}
                                  onClick={(e) => handleClick(e, track, video.id)}
                                >
                                  <span className="bg-[#033032]">V{track.index}</span>
                                  <span className="bg-[#033032]">
                                    {video.path.split("/").pop()}
                                  </span>
                                  <div className="w-full p-0 m-0 flex space-x-2 justify-end text-xs text-white">
                                    {video.isVideo ? (
                                      <div className="flex flex-row video-metadata truncate text-xs text-white">
                                        <span>{videoStream?.codec_name?.toUpperCase()}</span>
                                        {/* <span>{videoStream?.color_space?.toUpperCase()}</span> */}
                                        <span>
                                          {videoStream?.width}×{videoStream?.height}
                                        </span>
                                        <span>{getAspectRatio(videoStream)}</span>
                                        <span>{getFps(videoStream)} fps</span>
                                        <span>{formatDuration(track.combinedDuration, 3)}</span>
                                      </div>
                                    ) : (
                                      <div className="flex flex-row video-metadata truncate text-xs text-white">
                                        <span>{audioStream?.codec_name}</span>
                                        <span>каналов: {audioStream?.channels}</span>
                                        <span>
                                          {audioStream?.sample_rate &&
                                            `${Math.round(
                                              parseInt(`${audioStream.sample_rate}`) / 1000,
                                            )}kHz`}
                                        </span>
                                        <span>
                                          {audioStream?.bit_rate &&
                                            `${formatBitrate(parseInt(audioStream.bit_rate))}`}
                                        </span>
                                        <span
                                          className="bg-[#033032] text-[11px] mb-[2px] px-[3px]"
                                          style={{
                                            display: width < 16 ? "none" : "block",
                                          }}
                                        >
                                          {formatDuration(track.combinedDuration, 3)}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div
                                  className="absolute bottom-0 left-0 text-xs text-gray-100 mb-[2px] ml-1 bg-[#033032] text-[11px] px-[3px]"
                                  style={{
                                    display: width < 16 ? "none" : "block",
                                  }}
                                >
                                  {formatTimeWithMilliseconds(videoStart, false, true, true)}
                                </div>
                                <div
                                  className="absolute bottom-0 right-0 text-xs text-gray-100 mb-[2px] mr-1 bg-[#033032] text-[11px] px-[3px]"
                                  style={{
                                    display: width < 16 ? "none" : "block",
                                  }}
                                >
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

                        const segmentStart =
                          ((videoStart - trackStartTime) / (trackEndTime - trackStartTime)) * 100
                        const segmentWidth = (videoDuration / (trackEndTime - trackStartTime)) * 100

                        console.log("Segment calculations:", {
                          videoStart,
                          videoEnd: videoStart + videoDuration,
                          segmentStart,
                          segmentWidth,
                          trackStartTime,
                          trackEndTime,
                        })

                        return (
                          <div
                            key={video.id || video.name}
                            className="absolute h-full"
                            style={{
                              left: `${segmentStart}%`,
                              width: `${segmentWidth}%`,
                              height: "70px",
                            }}
                          >
                            <div className="relative h-full w-full border-r border-gray-600 last:border-r-0">
                              <div
                                className="h-full w-full video-metadata flex flex-row justify-between items-start text-xs text-white truncate p-1 py-[3px] rounded border border-gray-800 hover:border-gray-100 dark:hover:border-gray-100 dark:border-gray-800 m-0"
                                style={{
                                  backgroundColor: "#004346",
                                  lineHeight: "13px",
                                }}
                                onClick={(e) => handleClick(e, track, video.id)}
                              >
                                {idx === 0 && (
                                  <span className="bg-[#033032] text-[11px]">V{track.index}</span>
                                )}
                                <span className="bg-[#033032] text-[11px]">
                                  {video.path.split("/").pop()}
                                </span>
                                {idx === 0 ? (
                                  <div className="w-full p-0 m-0 flex space-x-2 justify-end text-xs text-white">
                                    <div className="flex flex-row video-metadata truncate text-xs text-white">
                                      <span>{videoStream?.codec_name?.toUpperCase()}</span>
                                      {/* <span>{videoStream?.color_space?.toUpperCase()}</span> */}
                                      <span>
                                        {videoStream?.width}×{videoStream?.height}
                                      </span>
                                      <span>{getAspectRatio(videoStream)}</span>
                                      <span>{getFps(videoStream)} fps</span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="w-full p-0 m-0 flex space-x-2 justify-end text-xs text-white">
                                    <div className="flex flex-row video-metadata truncate text-xs text-white mb-[2px]">
                                      <span className="bg-[#033032] text-[11px]">
                                        {formatDuration(track.combinedDuration, 3)}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div
                                className="absolute bottom-0 left-0 text-xs text-gray-100 mb-[2px] ml-1 bg-[#033032] text-[11px] px-[3px]"
                                style={{
                                  display: segmentWidth < 16 ? "none" : "block",
                                }}
                              >
                                {formatTimeWithMilliseconds(videoStart, false, true, true)}
                              </div>
                              <div
                                className="absolute bottom-0 right-0 text-xs text-gray-100 mb-[2px] mr-1 bg-[#033032] text-[11px] px-[3px]"
                                style={{
                                  display: segmentWidth < 16 ? "none" : "block",
                                }}
                              >
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
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  },
)

VideoTrack.displayName = "VideoTrack"

export { VideoTrack }
