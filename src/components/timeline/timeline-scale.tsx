import { formatTimeWithMilliseconds } from "@/lib/utils"

interface TimeScaleProps {
  duration: number
  startTime: number
}

/**
 * Компонент временной шкалы
 * Отображает метки времени с равными интервалами
 */
const TimeScale = ({ duration, startTime }: TimeScaleProps): JSX.Element => {
  const marks = []
  const numMarks = 10

  // Определяем масштаб округления в зависимости от длительности
  const getTimeScale = (duration: number) => {
    if (duration >= 3600) return 3600 // Часы для записей от 1 часа
    if (duration >= 300) return 60 // Минуты для записей от 5 минут
    if (duration >= 60) return 30 // Полминуты для записей от 1 минуты
    return 1 // Секунды для коротких записей
  }

  const timeScale = getTimeScale(duration)
  // Округляем начальное время согласно масштабу
  const roundedStartTime = Math.floor(startTime / timeScale) * timeScale
  // Округляем конечное время
  const endTime = roundedStartTime + duration
  const roundedEndTime = Math.ceil(endTime / timeScale) * timeScale
  // Вычисляем шаг для круглых значений
  const timeStep = Math.ceil((roundedEndTime - roundedStartTime) / numMarks / timeScale) * timeScale

  for (let timestamp = roundedStartTime; timestamp <= roundedEndTime; timestamp += timeStep) {
    const isFirstMark = timestamp === roundedStartTime
    const position = ((timestamp - startTime) / duration) * 100

    marks.push(
      <div
        key={timestamp}
        className="absolute flex flex-col items-center"
        style={{ left: `${position}%` }}
      >
        <div className="h-2 w-0.5 bg-gray-400" />
        <span className="text-xs text-gray-500 mt-1">
          {formatTimeWithMilliseconds(timestamp, isFirstMark, false)}
        </span>
      </div>,
    )
  }

  return (
    <div className="relative w-full h-8 mb-2">
      {marks}
    </div>
  )
}

export default TimeScale
