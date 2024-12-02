import { useMedia } from "@/hooks/use-media"
import { formatTimeWithMilliseconds } from "@/lib/utils"

/**
 * Компонент временной шкалы
 * Отображает метки времени с равными интервалами
 */
const TimeScale = (): JSX.Element => {
  const { timeRanges, maxDuration } = useMedia()
  const marks = []
  const numMainMarks = 10 // Основные деления
  const numSubMarks = 5 // Количество мелких делений между основными

  // Определяем масштаб округления в зависимости от длительности
  const getTimeScale = (duration: number) => {
    if (duration >= 3600) return 3600 // Часы для записей от 1 часа
    if (duration >= 300) return 60 // Минуты для записей от 5 минут
    if (duration >= 60) return 30 // Полминуты для записей от 1 минуты
    return 1 // Секунды для коротких записей
  }

  const timeScale = getTimeScale(maxDuration)

  // Находим минимальное время начала среди всех промежутков
  const minStartTime = timeRanges.length > 0 ? Math.min(...timeRanges.map((range) => range.min)) : 0

  // Округляем начальное время согласно масштабу
  const roundedStartTime = Math.floor(minStartTime / timeScale) * timeScale
  // Округляем конечное время
  const endTime = roundedStartTime + maxDuration
  const roundedEndTime = Math.ceil(endTime / timeScale) * timeScale
  // Вычисляем шаг для круглых значений
  const timeStep = Math.ceil((roundedEndTime - roundedStartTime) / numMainMarks / timeScale) *
    timeScale
  // Шаг для мелких делений
  const subStep = timeStep / numSubMarks

  // Добавляем основные и промежуточные деления
  for (let timestamp = roundedStartTime; timestamp <= roundedEndTime; timestamp += subStep) {
    const position = ((timestamp - minStartTime) / maxDuration) * 100
    const isMainMark = Math.abs(timestamp % timeStep) < 0.001

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
        {timeRanges.map((range, index) => {
          const rangeWidth = ((range.max - range.min) / maxDuration) * 100
          const rangePosition = ((range.min - minStartTime) / maxDuration) * 100

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

export default TimeScale
