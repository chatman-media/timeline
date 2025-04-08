import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"

import { useRootStore } from "@/hooks/use-root-store"
import { useWaveformCache } from "@/hooks/use-waveform-cache"
import { formatBitrate, formatDuration, formatTimeWithMilliseconds } from "@/lib/utils"
import { TimelineTrack } from "@/types/timeline"

import { Waveform } from "../waveform"

interface VideoTrackProps {
  track: TimelineTrack
  index: number
  sectionStartTime: number
  sectionDuration: number
}

const VideoTrack = memo(function VideoTrack({
  track,
  sectionStartTime,
  sectionDuration,
}: VideoTrackProps) {
  const {
    setCurrentTime,
    setActiveVideo,
    activeTrackId,
    setActiveTrack,
    volume: globalVolume,
    trackVolumes,
  } = useRootStore()
  const { getWaveform } = useWaveformCache()
  const containerRef = useRef<HTMLDivElement>(null)
  const [visibleVideos, setVisibleVideos] = useState<string[]>([])
  const videoElementsRef = useRef<Record<string, HTMLVideoElement>>({})

  useEffect(() => {
    // Обновляем громкость для всех видео в треке
    Object.values(videoElementsRef.current).forEach((videoElement) => {
      if (videoElement) {
        const trackVolume = trackVolumes[track.id] ?? 1
        videoElement.volume = globalVolume * trackVolume
      }
    })
  }, [globalVolume, trackVolumes, track.id])

  if (!track.videos || track.videos.length === 0) {
    return null
  }

  const firstVideo = track.videos[0]
  const lastVideo = track.videos[track.videos.length - 1]

  if (!firstVideo || !lastVideo) {
    return null
  }

  const timeToPercent = useCallback(
    (time: number) => {
      if (!sectionStartTime || !sectionDuration || sectionDuration === 0) return 0
      const percent = ((time - sectionStartTime) / sectionDuration) * 100
      return Math.max(0, Math.min(100, percent))
    },
    [sectionStartTime, sectionDuration],
  )

  const trackStartTime = firstVideo.startTime ?? 0
  const trackEndTime = (lastVideo.startTime ?? 0) + (lastVideo.duration ?? 0)
  const startOffset = timeToPercent(trackStartTime)
  const width = timeToPercent(trackEndTime) - startOffset

  const isActive = track.id === activeTrackId

  const handleClick = useCallback(
    (_e: React.MouseEvent, track: TimelineTrack, videoId?: string) => {
      setActiveTrack(track.id)
      if (videoId) {
        setActiveVideo(videoId)
        const video = track.videos.find((v) => v.id === videoId)
        if (video) {
          const videoStartTime = video.startTime ?? 0
          setCurrentTime(videoStartTime)
        }
      }
    },
    [setActiveTrack, setActiveVideo, setCurrentTime],
  )

  // Определяем видимые видео
  useEffect(() => {
    if (!containerRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleIds = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => entry.target.getAttribute("data-video-id") || "")
          .filter(Boolean)

        setVisibleVideos((prev: string[]) => {
          const newSet = new Set([...prev, ...visibleIds])
          return Array.from(newSet)
        })
      },
      { threshold: 0.1 },
    )

    containerRef.current.querySelectorAll("[data-video-id]").forEach((el) => {
      observer.observe(el)
    })

    return () => observer.disconnect()
  }, [track.videos])

  return (
    <div className="flex" ref={containerRef}>
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
            <div className="slice--parent bg-[#014a4f]">
              <div className="absolute h-full w-full timline-border">
                <div className="flex h-full w-full flex-col justify-start">
                  <div className="flex relative">
                    {track.videos.map((video) => {
                      const videoStart = video.startTime || 0
                      const videoDuration = video.duration || 0
                      const isVisible = visibleVideos.includes(video.id)

                      if (track.videos.length === 1) {
                        return (
                          <div
                            key={video.id}
                            data-video-id={video.id}
                            className="absolute h-full w-full"
                            style={{
                              left: "0%",
                              width: "100%",
                              height: "70px",
                            }}
                            onClick={(e) => handleClick(e, track, video.id)}
                          >
                            <div className="relative h-full w-full border-r border-gray-600 last:border-r-0">
                              <div
                                className="h-full w-full video-metadata flex flex-row justify-between items-start text-xs text-white truncate p-1 py-[3px] rounded border border-gray-800 hover:border-gray-100 dark:hover:border-gray-100 dark:border-gray-800 m-0 pointer-events-none"
                                style={{
                                  backgroundColor: "#004346",
                                  lineHeight: "13px",
                                }}
                              >
                                <span className="bg-[#033032]">
                                  {video.probeData?.streams[0]?.codec_name?.startsWith("a")
                                    ? "A"
                                    : "V"}
                                  {track.index}
                                </span>
                                <span className="bg-[#033032]">{video.name}</span>
                                <div className="w-full p-0 m-0 flex space-x-2 justify-end text-xs text-white">
                                  {video.probeData?.streams[0]?.codec_name?.startsWith("v") ? (
                                    <div className="flex flex-row video-metadata truncate text-xs text-white">
                                      <span>
                                        {video.probeData?.streams[0]?.codec_name?.toUpperCase()}
                                      </span>
                                      <span>
                                        {video.probeData?.streams[0]?.width}×
                                        {video.probeData?.streams[0]?.height}
                                      </span>
                                      <span>
                                        {video.probeData?.streams[0]?.display_aspect_ratio}
                                      </span>
                                      <span>
                                        {video.probeData?.streams[0]?.r_frame_rate?.split("/")[0]}{" "}
                                        fps
                                      </span>
                                      <span>
                                        {video.duration !== undefined
                                          ? formatDuration(video.duration, 3)
                                          : ""}
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="flex flex-row video-metadata truncate text-xs text-white">
                                      <span>{video.probeData?.streams[0]?.codec_name}</span>
                                      <span>каналов: {video.probeData?.streams[0]?.channels}</span>
                                      <span>
                                        {video.probeData?.streams[0]?.sample_rate &&
                                          `${Math.round(Number(video.probeData.streams[0].sample_rate) / 1000)}kHz`}
                                      </span>
                                      <span>
                                        {video.probeData?.streams[0]?.bit_rate &&
                                          `${formatBitrate(Number(video.probeData.streams[0].bit_rate))}`}
                                      </span>
                                      <span>
                                        {video.duration !== undefined
                                          ? formatDuration(video.duration, 3)
                                          : ""}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {isVisible && (
                                <div className="h-[40px] w-full relative pointer-events-none">
                                  <Waveform
                                    audioUrl={video.path}
                                    waveform={getWaveform(video.path)}
                                  />
                                </div>
                              )}
                              <video
                                ref={(el) => {
                                  if (el) {
                                    videoElementsRef.current[video.id] = el
                                    const trackVolume = trackVolumes[track.id] ?? 1
                                    el.volume = globalVolume * trackVolume
                                  }
                                }}
                                src={video.path}
                                preload="auto"
                                loop
                                style={{ display: "none" }}
                              />
                              <div
                                className="absolute bottom-0 left-0 text-xs text-gray-100 mb-[2px] ml-1 bg-[#033032] text-[11px] px-[3px]"
                                style={{
                                  display: width < 16 ? "none" : "block",
                                }}
                              >
                                {formatTimeWithMilliseconds(videoStart || 0, false, true, true)}
                              </div>
                              <div
                                className="absolute bottom-0 right-0 text-xs text-gray-100 mb-[2px] mr-1 bg-[#033032] text-[11px] px-[3px]"
                                style={{
                                  display: width < 16 ? "none" : "block",
                                }}
                              >
                                {formatTimeWithMilliseconds(
                                  (videoStart || 0) + (videoDuration || 0),
                                  false,
                                  true,
                                  true,
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      }
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
})

VideoTrack.displayName = "VideoTrack"

export { VideoTrack }
