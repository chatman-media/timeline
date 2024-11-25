import { SeekbarState } from "@/types/timeline"
import { useRef, useState } from "react"
import { Rnd } from "react-rnd"
import { formatTimeWithMilliseconds } from "@/lib/utils"

/**
 * Пропсы компонента TimelineBar
 */
interface TimelineBarProps {
  t: number // Текущая позиция по времени
  width: number // Ширина полосы
  height: number // Высота полосы
  y: number // Начальная позиция по вертикали
  duration: number // Длительность видео
  startTime: number // Начальное время
  updateSeekbar: (data: Partial<SeekbarState> & { timestamp?: number }) => void // Функция обновления состояния полосы
}

/**
 * Компонент вертикальной полосы прокрутки для временной шкалы
 * Позволяет визуализировать и управлять текущей позицией воспроизведения
 */
const TimelineBar = (
  { t, width, height, y, duration, startTime, updateSeekbar }: TimelineBarProps,
): JSX.Element => {
  // Локальное состояние полосы с значениями по умолчанию
  const [bar] = useState({
    width: width || 2, // Ширина по умолчанию 5px
    height: height || 70, // Высота по умолчанию 70px
    x: t, // Горизонтальная позиция соответствует времени
    y: y || -10, // Вертикальное смещение по умолчанию -10px
  })

  const [displayTime, setDisplayTime] = useState(startTime)

  // Ссылка на DOM-элемент полосы
  const barRef = useRef<Rnd>(null)

  return (
    <div className="relative">
      <Rnd
        ref={barRef}
        className="drag--bar"
        // Размеры полосы
        size={{ width: bar.width, height: bar.height }}
        // Позиция полосы
        position={{ x: bar.x, y: bar.y }}
        // Ограничиваем движение границами родительского элемента
        bounds="parent"
        // Разрешаем перетаскивание только по горизонтали
        dragAxis={"x"}
        // Отключаем изменение размеров полосы
        enableResizing={{
          top: false,
          left: false,
          right: false,
          bottom: false,
        }}
        // Обработчик окончания перетаскивания
        onDrag={(_, dragData) => {
          const parentWidth =
            barRef.current?.resizableElement?.current?.parentElement?.offsetWidth || 1
          const percentage = dragData.x / parentWidth
          const time = startTime + (percentage * duration)
          setDisplayTime(time)
        }}
        onDragStop={(_, dragData) => {
          const parentWidth =
            barRef.current?.resizableElement?.current?.parentElement?.offsetWidth || 1
          const clampedX = Math.max(0, Math.min(dragData.x, parentWidth))

          updateSeekbar({
            x: clampedX,
            y: dragData.y,
          })
        }}
      />
      <div
        className="absolute bottom-[-20px] left-0 text-xs text-muted-foreground whitespace-nowrap"
        style={{ transform: `translateX(${bar.x}px)` }}
      >
        {formatTimeWithMilliseconds(displayTime)}
      </div>
    </div>
  )
}

export default TimelineBar
