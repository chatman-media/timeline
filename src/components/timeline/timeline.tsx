import React, { useEffect, useRef, useState } from "react"

import { useMedia } from "@/hooks/use-media"
import { useTimelineScale } from "@/hooks/use-timeline-scale"
import { SeekbarState } from "@/types/timeline"

import { VideoTrack } from "../track"
import { TrackSliceWrap } from "../track/track-slice-wrap"
import { TimelineScale } from "./timeline-scale"

export function Timeline() {
  const { tracks, activeVideo, currentTime, timeToPercent } = useMedia()
  const { scale } = useTimelineScale()
  const maxDuration = Math.max(...tracks.map((track) => track.combinedDuration))

  // Ссылка на DOM-элемент контейнера для определения его размеров
  const parentRef = useRef<HTMLDivElement>(null)

  // Настройки полосы прокрутки (вертикальная линия, показывающая текущее время)
  const [seekbar, setSeekbar] = useState<SeekbarState>({
    width: 3, // Ширина полосы в пикселях
    height: 70, // Высота полосы в пикселях
    y: -10, // Смещение полосы вверх для перекрытия клипов
    x: 0, // Горизонтальное положение полосы
  })

  useEffect(() => {
    const timelineWidth = parentRef.current?.offsetWidth || 0
    const percent = timeToPercent(currentTime)
    const newPosition = (percent / 100) * timelineWidth

    setSeekbar((prev) => ({
      ...prev,
      x: newPosition,
    }))
  }, [currentTime])

  return (
    <div className="timeline w-full min-h-[calc(50vh-70px)]">
      {/* <TimelineScale /> */}
      <div className="relative" style={{ paddingBottom: `37px` }}>
        <div className="flex">
          <div className="flex-1 flex flex-col gap-2 relative">
            {tracks.map((track, index) => (
              <VideoTrack
                key={`track-${track.id}`}
                style={{
                  position: "absolute",
                  left: `${(track.startTime / maxDuration) * 100}%`,
                  width: `${(track.endTime / maxDuration) * 100}%`,
                }}
                track={track}
                index={index}
                timeRanges={track.timeRanges}
                maxDuration={maxDuration}
                activeVideo={activeVideo?.id}
                parentRef={parentRef}
                currentTime={currentTime}
                TrackSliceWrap={TrackSliceWrap}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
