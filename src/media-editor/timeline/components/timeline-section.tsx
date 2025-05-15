import { useEffect, useRef, useState } from "react"

import { Slider } from "@/components/ui/slider"
import { Track } from "@/types/media"

import { TimelineScale, VideoTrack } from ".."
import { useTimeline } from "../services"
import { TimelineBar } from "./layout"
import { useTimelineScale } from "./use-timeline-scale"

interface TimelineSectionProps {
  date: string
  tracks: Track[]
  startTime: number
  endTime: number
  duration: number
  isActive?: boolean
}

export function TimelineSection({
  date,
  tracks,
  startTime,
  endTime,
  duration,
  isActive = false,
}: TimelineSectionProps) {
  const { zoomLevel } = useTimeline()
  const [scale, setScale] = useState(zoomLevel || 1)
  const { timeStep, subStep, adjustedRange, timeToPosition } = useTimelineScale(
    duration,
    startTime,
    endTime,
    scale,
  )

  // Синхронизируем локальный масштаб с глобальным при изменении
  useEffect(() => {
    setScale(zoomLevel || 1)
  }, [zoomLevel])

  // Устанавливаем preferredSource в "timeline" при активации сектора
  useEffect(() => {
    if (isActive && typeof window !== "undefined" && window.playerContext) {
      console.log(
        `[TimelineSection] Устанавливаем preferredSource в "timeline" для активного сектора ${date}`,
      )
      window.playerContext.setPreferredSource("timeline")
    }
  }, [isActive, date])

  // Сохраняем предыдущий масштаб для расчета смещения
  const prevScaleRef = useRef(scale)

  const handleScaleChange = (value: number[]) => {
    const newScale = value[0]

    // Сохраняем текущий масштаб для следующего изменения
    prevScaleRef.current = scale

    // Устанавливаем новый масштаб
    setScale(newScale)

    // Отправляем событие для обновления масштаба сектора
    window.dispatchEvent(
      new CustomEvent("sector-zoom-change", {
        detail: {
          sectorDate: date,
          zoomLevel: newScale,
          // Добавляем информацию о предыдущем масштабе для расчета смещения
          prevZoomLevel: prevScaleRef.current,
        },
      }),
    )
  }

  return (
    <div className={`timeline-section ${isActive ? "" : "bg-muted/50"}`}>
      <div className="relative">
        <div className="absolute top-[22px] right-4 z-10 flex w-[130px] items-center gap-2">
          <Slider
            defaultValue={[1]}
            min={0.2}
            max={10}
            step={0.2}
            value={[scale]}
            onValueChange={handleScaleChange}
            className="w-full"
          />
        </div>

        <div className="flex w-full flex-col gap-2">
          <TimelineScale
            timeStep={timeStep}
            subStep={subStep}
            adjustedRange={adjustedRange}
            isActive={isActive}
            timeToPosition={timeToPosition}
          />

          <TimelineBar
            startTime={startTime}
            endTime={endTime}
            sectionStartTime={adjustedRange.startTime}
            sectionDuration={adjustedRange.duration}
            height={tracks.length * 72 + 66}
            isActive={isActive} // Передаем флаг активного сектора
          />

          {tracks.map((track, index) => (
            <div key={`${track.id}-${date}`} className="relative last:mb-6" style={{ height: 80 }}>
              <VideoTrack
                track={track}
                index={index}
                sectionStartTime={adjustedRange.startTime}
                sectionDuration={adjustedRange.duration}
                coordinates={{
                  left: 0,
                  width: 100,
                  videos: {},
                }}
                sectorZoomLevel={scale}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
