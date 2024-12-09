import { useMedia } from "@/hooks/use-media"
import { useTimelineScale } from "@/hooks/use-timeline-scale"
import { formatTimeWithMilliseconds } from "@/lib/utils"
import { Track } from "@/types/videos"

/**
 * Компонент временной шкалы
 * Отображает метки времени с равными интервалами
 */
const TimelineScale = (): JSX.Element => {
  const { tracks } = useMedia()
  const {
    maxDuration,
    minStartTime,
    roundedStartTime,
    roundedEndTime,
    timeStep,
    subStep,
  } = useTimelineScale()

  const marks = []

  // Добавляем основные и промежуточные деления
  for (let timestamp = roundedStartTime; timestamp <= roundedEndTime; timestamp += subStep) {
    const position = ((timestamp - minStartTime) / maxDuration) * 100
    const isMainMark = Math.abs(timestamp % timeStep) < 0.001

    // Пропускаем метки, которые выходят за пределы видимой области
    if (position < 0 || position > 100) continue

    marks.push(
      <div
        key={timestamp}
        className="absolute flex flex-col"
        style={{ left: `${position}%` }}
      >
        <div
          className={`${isMainMark ? "h-3" : "h-1.5"} w-0.5 bg-gray-600`}
        />
        {isMainMark && (
          <span
            className="text-xs text-gray-100 drag--parent flex-1"
            style={{ marginLeft: "5px", marginTop: "-5px", border: "none" }}
          >
            {formatTimeWithMilliseconds(timestamp, false, false, false)}
          </span>
        )}
      </div>,
    )
  }

  return (
    <div className="relative w-full flex flex-col" style={{ marginBottom: "12px" }}>
      {/* Индикатор доступных промежутков видео */}
      <div className="h-0.5 w-full">
        {tracks.map((track: Track, index: number) => {
          const rangeWidth = ((track.combinedDuration) / maxDuration) * 100
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
export { TimelineScale }
