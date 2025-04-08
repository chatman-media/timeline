import React, { useMemo, useState } from "react"
import { Trash2 } from "lucide-react"

import { useRootStore } from "@/hooks/use-root-store"
import { MediaFile, Track } from "@/types/videos"
import { TimelineScale } from "./timeline/timeline-scale"
import { VideoTrack } from "./track/video-track"
import { TimelineBar } from "./timeline/timeline-bar"
import { TimelineControls } from "./timeline/timeline-controls"

export function Timeline() {
  const { tracks, activeVideo, setCurrentTime: updateTime, currentTime, scale, setScale, setTracks } = useRootStore()
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
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
        <button
          onClick={() => setTracks([])}
          className="flex items-center gap-2 px-3 py-1 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
        >
          <Trash2 size={16} />
          Очистить
        </button>
        <TimelineControls scale={scale} setScale={setScale} />
      </div>
      <div className="relative w-full min-h-full pt-[2px]" style={{ minWidth: "100%" }}>
        {[...sections].reverse().map((section) => (
          <div
            key={section.date}
            className={`relative mb-4 ${section.date === activeDate ? "" : "opacity-50"}`}
          >
            <div className="relative">
              <TimelineScale
                startTime={section.startTime}
                endTime={section.endTime}
                duration={section.duration}
                scale={scale}
              />
              <div className="relative border-t border-gray-700/50">
                {section.tracks.map((track, index) => (
                  <div
                    key={track.id}
                    className="relative border-b border-gray-700/50"
                    style={{
                      marginTop: index === 0 ? 0 : "1px",
                      paddingBottom: "1px",
                    }}
                  >
                    <VideoTrack
                      track={track}
                      index={index}
                      sectionStartTime={section.startTime}
                      sectionDuration={section.duration}
                    />
                  </div>
                ))}
              </div>
              <TimelineBar
                startTime={section.startTime}
                endTime={section.endTime}
                height={section.tracks.length * 62}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
