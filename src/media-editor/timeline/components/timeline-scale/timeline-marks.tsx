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

  // Определяем шаги для разных уровней меток
  const level1Step = timeStep // Основной шаг (крупные метки с подписями)
  const level2Step = subStep // Средний шаг (средние метки)
  const level3Step = subStep / 5 // Малый шаг (мелкие метки)

  // Вычисляем видимую длительность в пикселях
  const visibleWidthPx = (endTime - startTime) * 2 * zoomLevel

  // Вычисляем первую метку, которая попадает в видимую область
  // Округляем до ближайшего меньшего значения, кратного самому маленькому шагу
  // Для абсолютного времени нам нужно учитывать, что время может быть очень большим числом
  const firstMark = Math.floor(startTime / level3Step) * level3Step

  // Вспомогательная функция для проверки, является ли число кратным заданному шагу
  function isMultipleOf(value: number, step: number): boolean {
    // Учитываем погрешность округления для дробных чисел
    const epsilon = 0.0001
    const remainder = value % step
    return remainder < epsilon || Math.abs(remainder - step) < epsilon
  }

  // Рассчитываем, сколько пикселей приходится на одну секунду
  const pixelsPerSecond = 2 * zoomLevel

  // Определяем, какие метки нужно показывать в зависимости от плотности
  // Если метки слишком плотные, показываем только каждую N-ую
  const level1PixelDistance = level1Step * pixelsPerSecond
  const level2PixelDistance = level2Step * pixelsPerSecond
  const level3PixelDistance = level3Step * pixelsPerSecond

  // Минимальное расстояние между метками в пикселях для хорошей читаемости
  const minLevel1Distance = 80 // Для основных меток с подписями
  const minLevel2Distance = 20 // Для средних меток
  const minLevel3Distance = 5 // Для малых меток

  // Определяем, нужно ли прореживать метки
  const skipLevel1 =
    level1PixelDistance < minLevel1Distance ? Math.ceil(minLevel1Distance / level1PixelDistance) : 1
  const skipLevel2 =
    level2PixelDistance < minLevel2Distance ? Math.ceil(minLevel2Distance / level2PixelDistance) : 1
  const skipLevel3 =
    level3PixelDistance < minLevel3Distance ? Math.ceil(minLevel3Distance / level3PixelDistance) : 1

  // Счетчики для прореживания меток
  let level1Counter = 0
  let level2Counter = 0
  let level3Counter = 0

  // Создаем метки с шагом level3Step (самый маленький шаг)
  for (
    let timestamp = firstMark;
    timestamp <= endTime + 0.0001;
    timestamp = parseFloat((timestamp + level3Step).toFixed(10))
  ) {
    // Рассчитываем позицию метки в пикселях
    const position = (timestamp - startTime) * pixelsPerSecond

    // Пропускаем метки, которые находятся за пределами видимой области
    if (position < 0 || position > visibleWidthPx) continue

    let markType: "large" | "medium" | "small" | "smallest" = "smallest"
    let showValue = false

    // Определяем тип метки в зависимости от её кратности разным шагам
    const isLevel1 = isMultipleOf(timestamp, level1Step)
    const isLevel2 = !isLevel1 && isMultipleOf(timestamp, level2Step)
    const isLevel3 = !isLevel1 && !isLevel2 && isMultipleOf(timestamp, level3Step)

    // Применяем прореживание меток
    if (isLevel1) {
      level1Counter = (level1Counter + 1) % skipLevel1
      if (level1Counter !== 0) continue

      markType = "large"
      showValue = true
    } else if (isLevel2) {
      level2Counter = (level2Counter + 1) % skipLevel2
      if (level2Counter !== 0) continue

      markType = "medium"
      // Показываем значения для средних меток только при небольшом шаге
      showValue = timeStep <= 10
    } else if (isLevel3) {
      level3Counter = (level3Counter + 1) % skipLevel3
      if (level3Counter !== 0) continue

      markType = "small"
    } else {
      // Пропускаем самые маленькие метки, они не нужны
      continue
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
  const maxMarks = 200 // Увеличиваем максимальное количество меток, так как наш алгоритм уже прореживает их

  // Более эффективный способ фильтрации меток, если их все еще слишком много
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
