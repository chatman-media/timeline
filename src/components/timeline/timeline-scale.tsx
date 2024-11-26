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
  const numMainMarks = 10 // Основные деления
  const numSubMarks = 5 // Количество мелких делений между основными

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
  const timeStep = Math.ceil((roundedEndTime - roundedStartTime) / numMainMarks / timeScale) *
    timeScale
  // Шаг для мелких делений
  const subStep = timeStep / numSubMarks

  // Добавляем основные и промежуточные деления
  for (let timestamp = roundedStartTime; timestamp <= roundedEndTime; timestamp += subStep) {
    const position = ((timestamp - startTime) / duration) * 100
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
          <span className="text-xs text-gray-900 dark:text-gray-100 drag--parent flex-1">
            {formatTimeWithMilliseconds(timestamp, false, false)}
          </span>
        )}
      </div>,
    )
  }

  return (
    <div className="relative w-full flex flex-col">
      {/* Индикатор доступного видео */}
      <div className="h-1 w-full">
        <div
          className="h-full bg-primary/10"
          style={{
            width: "100%",
            position: "absolute",
            left: "0",
          }}
        />
      </div>
      {/* Шкала с делениями */}
      <div className="relative w-full h-8">
        {marks}
      </div>
    </div>
  )
}

export default TimeScale
