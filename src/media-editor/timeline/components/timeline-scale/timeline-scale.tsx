import { MoveHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { useTimeline } from "@/media-editor/timeline/services"

import { TimelineControls } from "../layout/timeline-controls"
import { TimelineMarks } from "."

interface TimelineScaleProps {
  startTime: number
  endTime: number
  duration: number
  sectorDate?: string
  sectorZoomLevel?: number
}

export function TimelineScale({
  startTime,
  endTime,
  duration,
  sectorDate,
  sectorZoomLevel,
}: TimelineScaleProps) {
  const { zoomLevel = 1 } = useTimeline() || {}

  // Используем масштаб секции, если он задан, иначе используем общий масштаб
  const currentZoomLevel = sectorZoomLevel || zoomLevel

  // Определяем шаг в зависимости от масштаба и длительности
  let timeStep = 1
  const totalDuration = endTime - startTime

  // Рассчитываем оптимальный шаг для отображения 5-10 меток на видимой части шкалы
  // Предполагаем, что ширина видимой части шкалы составляет примерно 800px
  // При базовом масштабе 2px за секунду, видимая длительность составляет 400 секунд
  // Но с учетом масштаба, видимая длительность будет 400 / currentZoomLevel
  const visibleDuration = 400 / currentZoomLevel

  // Целевое количество основных меток на видимой части шкалы
  const targetMarksCount = 8

  // Рассчитываем примерный шаг для достижения целевого количества меток
  // Для абсолютного времени нам нужно учитывать, что время может быть очень большим числом
  // Поэтому мы сначала вычисляем относительную длительность
  const relativeDuration = endTime - startTime

  // Если длительность слишком маленькая, используем видимую длительность
  // Иначе используем относительную длительность
  const effectiveDuration = relativeDuration < visibleDuration ? visibleDuration : relativeDuration

  // Рассчитываем примерный шаг для достижения целевого количества меток
  const approximateStep = effectiveDuration / targetMarksCount

  // Округляем до "красивых" значений
  // Список "красивых" значений для шага (в секундах)
  // Для времени дня нам нужны шаги, соответствующие часам, минутам и секундам
  const niceTimeSteps = [
    // Секунды
    1, 5, 10, 15, 30,
    // Минуты (в секундах)
    60, 120, 300, 600, 900, 1800,
    // Часы (в секундах)
    3600, 7200, 10800, 14400, 21600, 43200,
    // Дни (в секундах)
    86400, 172800, 259200, 345600, 432000, 518400, 604800,
  ]

  // Находим ближайшее "красивое" значение
  let niceTimeStep = niceTimeSteps[0]
  for (let i = 0; i < niceTimeSteps.length; i++) {
    if (approximateStep <= niceTimeSteps[i]) {
      // Если это первый элемент или предыдущий ближе
      if (i === 0 || approximateStep - niceTimeSteps[i - 1] < niceTimeSteps[i] - approximateStep) {
        niceTimeStep = i === 0 ? niceTimeSteps[i] : niceTimeSteps[i - 1]
      } else {
        niceTimeStep = niceTimeSteps[i]
      }
      break
    }
    // Если дошли до конца списка, берем последнее значение
    if (i === niceTimeSteps.length - 1) {
      niceTimeStep = niceTimeSteps[i]
    }
  }

  timeStep = niceTimeStep

  // Определяем шаги для разных уровней засечек
  // Для разных масштабов используем разное соотношение между основным шагом и промежуточными
  let subStep

  // Определяем промежуточный шаг в зависимости от основного шага
  // Для времени дня нам нужны промежуточные шаги, соответствующие часам, минутам и секундам
  if (timeStep >= 86400) {
    // Для дней - промежуточный шаг 6 часов
    subStep = 21600
  } else if (timeStep >= 43200) {
    // Для 12+ часов - промежуточный шаг 3 часа
    subStep = 10800
  } else if (timeStep >= 14400) {
    // Для 4+ часов - промежуточный шаг 1 час
    subStep = 3600
  } else if (timeStep >= 3600) {
    // Для 1+ часа - промежуточный шаг 15 минут
    subStep = 900
  } else if (timeStep >= 900) {
    // Для 15+ минут - промежуточный шаг 5 минут
    subStep = 300
  } else if (timeStep >= 300) {
    // Для 5+ минут - промежуточный шаг 1 минута
    subStep = 60
  } else if (timeStep >= 60) {
    // Для 1+ минуты - промежуточный шаг 15 секунд
    subStep = 15
  } else if (timeStep >= 10) {
    // Для 10+ секунд - промежуточный шаг 2 секунды
    subStep = 2
  } else {
    // Для меньших значений - промежуточный шаг 1 секунда
    subStep = 1
  }

  // Обработчик для кнопки "Масштабировать под ширину экрана"
  const handleSectorFitToScreen = () => {
    if (!sectorDate) return

    // Отправляем событие для подгонки масштаба сектора
    window.dispatchEvent(
      new CustomEvent("sector-fit-to-screen", {
        detail: { sectorDate },
      }),
    )
  }

  return (
    <div className="relative mb-[13px] flex w-full flex-col">
      <div className="flex items-center justify-between">
        <div className="h-0.5 w-full" style={{ background: "rgb(47, 61, 62)", height: "1px" }} />

        {/* Элементы управления масштабом для сектора */}
        {sectorDate && (
          <div className="z-10 mr-2 ml-2 flex items-center gap-2">
            {/* Двунаправленная стрелка */}
            <button
              onClick={handleSectorFitToScreen}
              className={cn(
                "flex h-6 w-6 cursor-pointer items-center justify-center rounded-sm hover:bg-[#dddbdd] dark:hover:bg-[#45444b]",
              )}
              title="Масштабировать под ширину экрана"
            >
              <MoveHorizontal size={14} />
            </button>

            <TimelineControls minScale={0.005} maxScale={200} sectorDate={sectorDate} />
          </div>
        )}
      </div>

      <TimelineMarks
        startTime={startTime}
        endTime={endTime}
        duration={duration}
        timeStep={timeStep}
        subStep={subStep}
        isActive={true}
        zoomLevel={currentZoomLevel}
      />
    </div>
  )
}
