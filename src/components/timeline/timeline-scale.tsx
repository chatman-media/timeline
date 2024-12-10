import { useTimelineScale } from "@/hooks/use-timeline-scale"
import { Track } from "@/types/videos"
import { TimelineMark } from "./timeline-mark"

/**
 * Компонент временной шкалы
 * Отображает метки времени с равными интервалами
 */
export function TimelineScale({ tracks }: { tracks: Track[] }): JSX.Element {
  const {
    maxDuration,
    minStartTime,
    roundedStartTime,
    roundedEndTime,
    timeStep,
    subStep,
  } = useTimelineScale()

  const marks = []

  // Защита от некорректных значений
  if (!maxDuration || !timeStep || !subStep) {
    console.warn("Missing required values for timeline scale")
    return <div className="relative w-full flex flex-col" />
  }

  // Добавляем основные и промежуточные деления
  for (let timestamp = roundedStartTime; timestamp <= roundedEndTime; timestamp += subStep) {
    const position = ((timestamp - minStartTime) / maxDuration) * 100
    const isMainMark = Math.abs(timestamp % timeStep) < 0.001

    // Пропускаем метки, которые выходят за пределы видимой области
    if (position < 0 || position > 100) {
      console.log("Skipping mark at position:", position)
      continue
    }

    marks.push(
      <TimelineMark
        key={timestamp}
        timestamp={timestamp}
        position={position}
        isMainMark={isMainMark}
      />,
    )
  }

  return (
    <div className="relative w-full flex flex-col" style={{ marginBottom: "12px" }}>
      {/* Индикатор доступных промежутков видео */}
      <div className="h-0.5 w-full">
        {tracks.map((track: Track, index: number) => {
          if (!track.combinedDuration) return null

          const rangeWidth = (track.combinedDuration / maxDuration) * 100
          const rangePosition = ((track.startTime - minStartTime) / maxDuration) * 100

          return (
            <div
              key={index}
              className="h-0.5 absolute"
              style={{
                width: `${rangeWidth}%`,
                left: `${rangePosition}%`,
                background: "rgb(25, 102, 107)",
              }}
            />
          )
        })}
      </div>
      {/* Шкала с делениями */}
      <div className="relative w-full h-8">
        {marks}
      </div>
    </div>
  )
}
