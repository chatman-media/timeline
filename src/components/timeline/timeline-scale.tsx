import { useMedia } from "@/hooks/use-media"
import { useTimelineScale } from "@/hooks/use-timeline-scale"
import { formatTimeWithMilliseconds } from "@/lib/utils"

/**
 * Компонент временной шкалы
 * Отображает метки времени с равными интервалами
 */
const TimelineScale = (): JSX.Element => {
  const { scale } = useTimelineScale()
  const { timeRanges } = useMedia()

  // Находим максимальную длительность как разницу между максимальным и минимальным временем
  const maxDuration = Object.keys(timeRanges).flat().length > 0
    ? Math.max(...Object.values(timeRanges).flat().map((range) => range.start + range.duration)) -
      Math.min(...Object.values(timeRanges).flat().map((range) => range.start))
    : 0
  const marks = []

  // Адаптируем количество делений под масштаб
  const baseMainMarks = 10 // Базовое количество основных делений
  const numMainMarks = Math.ceil(baseMainMarks * scale) // Увеличиваем количество делений при увеличении масштаба
  const numSubMarks = 5 // Количество мелких делений между основными

  // Определяем масштаб округления в зависимости от длительности и текущего масштаба
  const getTimeScale = (duration: number, currentScale: number) => {
    const scaledDuration = duration / currentScale
    if (scaledDuration >= 3600) return 3600 // Часы
    if (scaledDuration >= 300) return 60 // Минуты
    if (scaledDuration >= 60) return 30 // Полминуты
    if (scaledDuration >= 10) return 5 // 5 секунд
    return 1 // Секунды
  }

  const timeScale = getTimeScale(maxDuration, scale)

  // Находим минимальное время начала среди всех промежутков
  const minStartTime = Object.keys(timeRanges).flat().length > 0
    ? Math.min(...Object.values(timeRanges).flat().map((range) => range.start))
    : 0

  // Округляем начальное и конечное время
  const roundedStartTime = Math.floor(minStartTime / timeScale) * timeScale
  const endTime = roundedStartTime + maxDuration
  const roundedEndTime = Math.ceil(endTime / timeScale) * timeScale

  // Вычисляем шаг с учетом масштаба
  const timeStep = Math.ceil((roundedEndTime - roundedStartTime) / numMainMarks) * timeScale
  const subStep = timeStep / numSubMarks

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
        {Object.values(timeRanges).flat().map((range, index) => {
          const rangeWidth = ((range.duration) / maxDuration) * 100
          const rangePosition = ((range.start - minStartTime) / maxDuration) * 100

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
