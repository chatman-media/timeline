import { useTimeline } from "@/media-editor/timeline/services"

import { TimelineMarks } from "."

interface TimelineScaleProps {
  startTime: number
  endTime: number
  duration: number
}

export function TimelineScale({ startTime, endTime, duration }: TimelineScaleProps) {
  const { zoomLevel = 1 } = useTimeline() || {}

  // Определяем шаг в зависимости от масштаба и длительности
  let timeStep = 1
  const totalDuration = endTime - startTime

  // Адаптивный шаг в зависимости от длительности
  // Сначала определяем базовый шаг на основе общей длительности
  if (totalDuration > 86400) {
    // Более 24 часов
    timeStep = 3600 // 1 час
  } else if (totalDuration > 43200) {
    // Более 12 часов
    timeStep = 1800 // 30 минут
  } else if (totalDuration > 14400) {
    // Более 4 часов
    timeStep = 900 // 15 минут
  } else if (totalDuration > 7200) {
    // Более 2 часов
    timeStep = 600 // 10 минут
  } else if (totalDuration > 3600) {
    // Более часа
    timeStep = 300 // 5 минут
  } else if (totalDuration > 1800) {
    // Более 30 минут
    timeStep = 120 // 2 минуты
  } else if (totalDuration > 600) {
    // Более 10 минут
    timeStep = 60 // 1 минута
  } else if (totalDuration > 300) {
    // Более 5 минут
    timeStep = 30 // 30 секунд
  } else if (totalDuration > 60) {
    // Более 1 минуты
    timeStep = 10 // 10 секунд
  } else if (totalDuration > 20) {
    // Более 20 секунд
    timeStep = 5 // 5 секунд
  } else if (totalDuration > 10) {
    // Более 10 секунд
    timeStep = 2 // 2 секунды
  } else if (totalDuration > 2) {
    // Более 2 секунд
    timeStep = 1 // 1 секунда
  } else {
    // 2 секунды или меньше
    timeStep = 0.5 // 500 миллисекунд
  }

  // Затем корректируем шаг в зависимости от масштаба
  if (zoomLevel > 1) {
    // При увеличении масштаба уменьшаем шаг
    timeStep = Math.max(0.1, timeStep / Math.sqrt(zoomLevel))
  } else if (zoomLevel < 1) {
    // При уменьшении масштаба увеличиваем шаг
    timeStep = timeStep / zoomLevel
  }

  // Округляем timeStep до "красивых" значений
  const niceTimeSteps = [
    0.1, 0.2, 0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600, 7200, 14400,
  ]
  let niceTimeStep = niceTimeSteps[0]

  for (let i = 1; i < niceTimeSteps.length; i++) {
    if (timeStep <= niceTimeSteps[i]) {
      // Выбираем ближайшее "красивое" значение
      niceTimeStep =
        Math.abs(timeStep - niceTimeSteps[i - 1]) < Math.abs(timeStep - niceTimeSteps[i])
          ? niceTimeSteps[i - 1]
          : niceTimeSteps[i]
      break
    }
    if (i === niceTimeSteps.length - 1) {
      niceTimeStep = niceTimeSteps[i]
    }
  }

  timeStep = niceTimeStep

  // Определяем шаги для разных уровней засечек
  // subStep - шаг для средних засечек
  // Для разных масштабов используем разное соотношение между основным шагом и промежуточными
  const subStep = timeStep <= 1 ? timeStep / 5 : timeStep / 4

  return (
    <div className="relative mb-[13px] flex w-full flex-col">
      <div className="h-0.5 w-full" style={{ background: "rgb(47, 61, 62)", height: "1px" }} />
      <TimelineMarks
        startTime={startTime}
        endTime={endTime}
        duration={duration}
        timeStep={timeStep}
        subStep={subStep}
        isActive={true}
        zoomLevel={zoomLevel}
      />
    </div>
  )
}
