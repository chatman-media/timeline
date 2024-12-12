import React, { useMemo, useRef, useState } from "react"
import { useMedia } from "@/hooks/use-media"
import { VideoTrack } from "../track"
import { TrackSliceWrap } from "../track/track-slice-wrap"
import { TimelineScale } from "./timeline-scale"
import { MediaFile, Track } from "@/types/videos"
import { formatTimeWithMilliseconds } from "@/lib/utils"

export function Timeline() {
  const { tracks } = useMedia()
  const parentRef = useRef<HTMLDivElement>(null)
  const [adjustedRange, setAdjustedRange] = useState({
    startTime: 0,
    endTime: 0,
    duration: 0,
  })

  // Группируем видео по дням
  const sections = useMemo(() => {
    if (!tracks || tracks.length === 0) return []

    // Создаем мапу для группировки видео по дням
    const videosByDay = new Map<string, {
      videos: MediaFile[]
      tracks: Track[]
      startTime: number
      endTime: number
    }>()

    tracks.forEach((track) => {
      track.videos.forEach((video) => {
        const videoStart = video.startTime || 0
        const videoEnd = videoStart + (video.duration || 0)
        const date = new Date(videoStart * 1000).toDateString()

        if (!videosByDay.has(date)) {
          videosByDay.set(date, {
            videos: [],
            tracks: [],
            startTime: videoStart,
            endTime: videoEnd,
          })
        }

        const dayData = videosByDay.get(date)!
        dayData.videos.push(video)
        if (!dayData.tracks.includes(track)) {
          dayData.tracks.push(track)
        }
        dayData.startTime = Math.min(dayData.startTime, videoStart)
        dayData.endTime = Math.max(dayData.endTime, videoEnd)
      })
    })

    // Преобразуем мапу в массив секций
    return Array.from(videosByDay.entries())
      .map(([date, data]) => ({
        date,
        startTime: data.startTime,
        endTime: data.endTime,
        duration: data.endTime - data.startTime,
        tracks: data.tracks.map((track) => ({
          ...track,
          videos: track.videos.filter((video) => {
            const videoStart = video.startTime || 0
            return new Date(videoStart * 1000).toDateString() === date
          }),
        })),
      }))
      .sort((a, b) => a.startTime - b.startTime)
  }, [tracks])

  return (
    <div className="timeline w-full min-h-[calc(50vh-70px)]">
      {sections.map((section) => (
        <div key={section.date} className="timeline-section mb-4">
          <div className="w-full flex flex-col gap-2">
            <TimelineScale
              tracks={section.tracks}
              startTime={section.startTime}
              endTime={section.endTime}
              duration={section.duration}
              onTimeRangeAdjust={setAdjustedRange}
            />

            {section.tracks.map((track, index) => (
              <div
                key={`${track.id}-${section.date}`}
                className="relative"
                style={{ height: 80 }}
              >
                <VideoTrack
                  track={track}
                  index={index}
                  parentRef={parentRef}
                  TrackSliceWrap={TrackSliceWrap}
                  sectionStartTime={adjustedRange.startTime}
                  sectionDuration={adjustedRange.duration}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
