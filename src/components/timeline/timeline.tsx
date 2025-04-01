import React, { useMemo, useState } from "react"

import { useVideoStore } from "@/hooks/useVideoStore"
import { MediaFile, Track } from "@/types/videos"

import { TimelineSection } from "./timeline/timeline-section"

export function Timeline() {
  const { tracks, activeVideo, setCurrentTime: updateTime } = useVideoStore()
  const [activeDate, setActiveDate] = useState<string | null>(null)

  const sections = useMemo(() => {
    if (!tracks || tracks.length === 0) return []

    // Создаем мапу для группировки видео по дням
    const videosByDay = new Map<
      string,
      {
        videos: MediaFile[]
        tracks: Track[]
        startTime: number
        endTime: number
      }
    >()

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

  // Set initial active section when sections change
  React.useEffect(() => {
    if (sections.length > 0 && !activeDate) {
      const latestSection = sections[sections.length - 1]
      setActiveDate(latestSection.date)

      // Устанавливаем время на первый кадр первой дорожки
      if (latestSection.tracks.length > 0) {
        const firstTrack = latestSection.tracks[0]
        if (firstTrack.videos.length > 0) {
          const firstVideo = firstTrack.videos[0]
          const videoStartTime = firstVideo.startTime || 0
          updateTime(videoStartTime)
        }
      }
    }
  }, [sections])

  // Update active section when active video changes
  React.useEffect(() => {
    if (activeVideo) {
      const videoStartTime = activeVideo.startTime || 0
      const videoDate = new Date(videoStartTime * 1000).toDateString()
      setActiveDate(videoDate)
    }
  }, [activeVideo])

  return (
    <div className="relative w-full h-[calc(50vh-4px)] min-h-[calc(50vh-4px)] overflow-x-auto overflow-y-auto bg-muted/50 dark:bg-[#1a1a1a]">
      <div className="relative w-full min-h-full pt-4" style={{ minWidth: "100%" }}>
        {[...sections].reverse().map((section) => (
          <TimelineSection
            key={section.date}
            date={section.date}
            tracks={section.tracks}
            startTime={section.startTime}
            endTime={section.endTime}
            duration={section.duration}
            isActive={section.date === activeDate}
          />
        ))}
      </div>
    </div>
  )
}
