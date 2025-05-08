import React, { useCallback, useEffect, useMemo, useState } from "react"

import { usePlayerContext } from "@/media-editor/media-player"
import { MediaFile, Track } from "@/types/media"

import { useTimeline } from "../services"
import { TimelineSection } from "./timeline-section"

// Расширяем интерфейс Window для добавления timelineUtils
declare global {
  interface Window {
    timelineUtils?: {
      timeToPercent: (time: number) => number
      percentToTime: (percent: number) => number
    }
  }
}

export function TimelinePanel() {
  const { tracks, sectors, seek: updateTime, activeTrackId } = useTimeline()
  const { video } = usePlayerContext()
  const [activeDate, setActiveDate] = useState<string | null>(null)

  // Функции для работы с временем
  const timeToPercent = useCallback(
    (time: number) => {
      const track = tracks.find((t) => t.id === activeTrackId)
      return (time / (track?.combinedDuration || 0)) * 100
    },
    [tracks, activeTrackId],
  )

  const percentToTime = useCallback(
    (percent: number) => {
      const track = tracks.find((t) => t.id === activeTrackId)
      return (percent / 100) * (track?.combinedDuration || 0)
    },
    [tracks, activeTrackId],
  )

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
      track.videos?.forEach((video) => {
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
          videos: track.videos?.filter((video) => {
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
        if (firstTrack.videos?.length > 0) {
          const firstVideo = firstTrack.videos[0]
          const videoStartTime = firstVideo.startTime || 0
          updateTime(videoStartTime)
        }
      }
    }
  }, [sections])

  // Update active section when active video changes
  React.useEffect(() => {
    if (video) {
      const videoStartTime = video.startTime || 0
      const videoDate = new Date(videoStartTime * 1000).toDateString()
      setActiveDate(videoDate)
    }
  }, [video])

  // Экспортируем функции для использования в других компонентах
  React.useEffect(() => {
    // Добавляем функции в глобальный объект window для доступа из других компонентов
    window.timelineUtils = {
      timeToPercent,
      percentToTime,
    }

    return () => {
      // Очищаем при размонтировании
      delete window.timelineUtils
    }
  }, [timeToPercent, percentToTime])

  // Обработчик события изменения масштаба сектора
  React.useEffect(() => {
    const handleSectorZoomChange = (event: CustomEvent) => {
      const { sectorDate, zoomLevel, prevZoomLevel } = event.detail

      // Здесь можно добавить дополнительную логику для обработки изменения масштаба
      console.log(`Масштаб сектора ${sectorDate} изменен с ${prevZoomLevel} на ${zoomLevel}`)
    }

    // Добавляем слушатель события
    window.addEventListener("sector-zoom-change", handleSectorZoomChange as EventListener)

    return () => {
      // Удаляем слушатель при размонтировании
      window.removeEventListener("sector-zoom-change", handleSectorZoomChange as EventListener)
    }
  }, [])

  return (
    <div className="bg-muted/50 relative h-[calc(50vh-4px)] min-h-[calc(50vh-4px)] w-full overflow-x-auto overflow-y-auto dark:bg-[#1a1a1a]">
      <div className="relative min-h-full w-full pt-4" style={{ minWidth: "100%" }}>
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
