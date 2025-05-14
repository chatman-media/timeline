import { memo, useRef } from "react"

import { useTimeline } from "@/media-editor/timeline/services"
import { Track } from "@/types/media"

import { VideoItem } from "./video-item"

interface TimelineTrackProps {
  track: Track
  index: number
  sectionStartTime: number
  sectionDuration: number
  coordinates: {
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
  sectorZoomLevel?: number
}

const TimelineTrack = memo(function TimelineTrack({
  track,
  sectionStartTime,
  sectionDuration,
  sectorZoomLevel,
}: TimelineTrackProps) {
  const { zoomLevel: globalZoomLevel } = useTimeline()
  // Используем масштаб сектора, если он задан, иначе используем общий масштаб
  const zoomLevel = sectorZoomLevel || globalZoomLevel
  const containerRef = useRef<HTMLDivElement>(null)

  if (!track.videos || track.videos.length === 0) {
    return null
  }

  // Находим минимальное время начала видео в треке
  const trackMinStartTime = Math.min(...track.videos.map((v) => v.startTime || 0))

  // Находим максимальное время окончания видео в треке
  const trackMaxEndTime = Math.max(
    ...track.videos.map((v) => (v.startTime || 0) + (v.duration || 0)),
  )

  // Логируем информацию о треке для отладки
  console.log(
    `[VideoTrack] Рендеринг трека ${track.id} (${track.name}), zoomLevel=${zoomLevel}, videos=${track.videos?.length || 0}`,
  )
  console.log(
    `[VideoTrack] Параметры трека: sectionStartTime=${sectionStartTime}, sectionDuration=${sectionDuration}`,
  )
  console.log(
    `[VideoTrack] Границы трека: trackMinStartTime=${trackMinStartTime}, trackMaxEndTime=${trackMaxEndTime}`,
  )

  return (
    <div className="flex w-full" ref={containerRef}>
      <div className="h-full w-full">
        <div className="relative h-full w-full">
          <div
            className="drag--parent w-full flex-1"
            style={{
              cursor: "pointer",
              zIndex: 1,
              position: "relative",
            }}
          >
            <div className="slice--parent" style={{ backgroundColor: "rgba(1, 74, 79, 0.25)" }}>
              <div className="timline-border absolute h-full w-full">
                <div className="flex h-full w-full flex-col justify-start">
                  <div className="relative flex" style={{ height: "70px" }}>
                    {/* Используем компонент VideoItem для отображения каждого видео */}
                    {track.videos?.map((video) => (
                      <VideoItem
                        key={video.id}
                        video={video}
                        track={{
                          ...track,
                          sectionDuration: sectionDuration, // Добавляем длительность секции для расчета позиции
                        }}
                        sectionStart={sectionStartTime}
                        zoomLevel={zoomLevel}
                      />
                    ))}
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

TimelineTrack.displayName = "VideoTrack"

export { TimelineTrack as VideoTrack }
