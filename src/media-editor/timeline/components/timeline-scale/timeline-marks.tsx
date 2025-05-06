import { TimelineMark } from "."

interface TimelineMarksProps {
  startTime: number
  endTime: number
  duration: number
  timeStep: number
  subStep: number
  isActive: boolean
  zoomLevel?: number
}

export function TimelineMarks({
  startTime,
  endTime,
  // duration больше не используется, так как мы используем пиксели вместо процентов
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  duration,
  timeStep,
  subStep,
  isActive,
  zoomLevel = 1,
}: TimelineMarksProps) {
  // Параметры для отображения временных меток

  const marks = []
  const level1Step = timeStep
  const level2Step = subStep
  const level3Step = subStep / 5
  const level4Step = subStep / 10

  // Шаги для разных уровней меток

  // Вычисляем первую метку, которая попадает в видимую область
  // Округляем до ближайшего меньшего значения, кратного самому маленькому шагу
  const firstMark = Math.floor(startTime / level4Step) * level4Step

  // Вспомогательная функция для проверки, является ли число кратным заданному шагу
  function isMultipleOf(value: number, step: number): boolean {
    // Учитываем погрешность округления для дробных чисел
    const epsilon = 0.0001
    const remainder = value % step
    return remainder < epsilon || Math.abs(remainder - step) < epsilon
  }

  // Создаем метки с шагом level4Step (самый маленький шаг)
  for (
    let timestamp = firstMark;
    timestamp <= endTime + 0.0001;
    timestamp = parseFloat((timestamp + level4Step).toFixed(10))
  ) {
    // Рассчитываем позицию метки в пикселях
    // Базовый масштаб: 2px за секунду, умноженный на zoomLevel
    const position = (timestamp - startTime) * 2 * zoomLevel

    // Пропускаем метки, которые находятся за пределами видимой области
    if (position < 0 || position > (endTime - startTime) * 2 * zoomLevel) continue

    let markType: "large" | "medium" | "small" | "smallest"
    let showValue = false

    // Определяем тип метки в зависимости от её кратности разным шагам
    const isLevel1 = isMultipleOf(timestamp, level1Step)
    const isLevel2 = isMultipleOf(timestamp, level2Step)
    const isLevel3 = isMultipleOf(timestamp, level3Step)

    if (isLevel1) {
      // Основные метки (самые крупные)
      markType = "large"
      // Всегда показываем значения для основных меток
      showValue = true
    } else if (isLevel2) {
      // Средние метки
      markType = "medium"
      // Показываем значения для средних меток только при небольшом шаге
      showValue = timeStep <= 10
    } else if (isLevel3) {
      // Малые метки
      markType = "small"
    } else {
      // Самые маленькие метки
      markType = "smallest"
    }

    marks.push(
      <TimelineMark
        key={timestamp}
        timestamp={timestamp}
        position={position}
        markType={markType}
        showValue={showValue}
      />,
    )
  }

  // Ограничиваем количество меток для производительности
  const maxMarks = 100 // Еще сильнее уменьшаем максимальное количество меток для лучшей производительности

  // Более эффективный способ фильтрации меток
  let finalMarks = marks
  if (marks.length > maxMarks) {
    const step = Math.ceil(marks.length / maxMarks)
    finalMarks = []
    for (let i = 0; i < marks.length; i += step) {
      finalMarks.push(marks[i])
    }
  }

  return <div className={`relative h-8 w-full ${isActive ? "" : "bg-muted/50"}`}>{finalMarks}</div>
}
