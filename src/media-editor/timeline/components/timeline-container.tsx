import { memo, useMemo } from "react"

import { useTimeline } from "@/media-editor/timeline/services"
import { Track } from "@/types/media"

import { TimelineScale } from "./timeline-scale/timeline-scale"
import { VideoTrack } from "./track/video-track"

interface TimelineContainerProps {
  startTime: number
  endTime: number
  duration: number
  children: React.ReactNode
}

interface TrackCoordinates {
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

export const TimelineContainer = memo(function TimelineContainer({
  startTime,
  endTime,
  duration,
}: TimelineContainerProps) {
  const { tracks } = useTimeline()

  // Рассчитываем координаты для всех треков и видео
  const trackCoordinates = useMemo(() => {
    return tracks.reduce(
      (acc: Record<string, TrackCoordinates>, track: Track) => {
        if (!track.videos || track.videos.length === 0) {
          return acc
        }

        const firstVideo = track.videos[0]
        const lastVideo = track.videos[track.videos.length - 1]

        if (!firstVideo || !lastVideo) {
          return acc
        }

        const trackStartTime = firstVideo.startTime ?? 0
        const trackEndTime = (lastVideo.startTime ?? 0) + (lastVideo.duration ?? 0)

        const left = ((trackStartTime - startTime) / duration) * 100
        const width = ((trackEndTime - trackStartTime) / duration) * 100

        // Рассчитываем координаты для каждого видео в треке
        const videoCoordinates = track.videos.reduce(
          (videoAcc, video) => {
            const videoStart = video.startTime || 0
            const videoDuration = video.duration || 0
            const videoEnd = videoStart + videoDuration

            const videoLeft = ((videoStart - startTime) / duration) * 100
            const videoWidth = ((videoEnd - videoStart) / duration) * 100

            videoAcc[video.id] = {
              left: Math.max(0, Math.min(100, videoLeft)),
              width: Math.max(0, Math.min(100, videoWidth)),
            }
            return videoAcc
          },
          {} as Record<string, { left: number; width: number }>,
        )

        acc[track.id] = {
          left: Math.max(0, Math.min(100, left)),
          width: Math.max(0, Math.min(100, width)),
          videos: videoCoordinates,
        }
        return acc
      },
      {} as Record<string, TrackCoordinates>,
    )
  }, [tracks, startTime, duration])

  return (
    <div className="flex h-full w-full flex-col">
      <TimelineScale startTime={startTime} endTime={endTime} duration={duration} />
      <div className="relative w-full">
        {tracks.map((track, index) => (
          <VideoTrack
            key={track.id}
            track={track}
            index={index}
            sectionStartTime={startTime}
            sectionDuration={duration}
            coordinates={trackCoordinates[track.id]}
          />
        ))}
      </div>
    </div>
  )
})
