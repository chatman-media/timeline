import { Rnd } from "react-rnd"
import { useState } from "react"
import { nanoid } from "nanoid"
import { TimelineSliceType } from "@/types/timeline"

interface TimelineSliceProps extends Partial<TimelineSliceType> {
  updateSlice: (data: Partial<TimelineSliceType> & { id: string }) => void
  isSelected?: boolean // Добавляем флаг выбранного состояния
  onSelect?: (id: string) => void // Добавляем обработчик выбора
  onDelete?: (id: string) => void // Добавляем обработчик удаления
}

/**
 * Компонент отдельного слайса на временной шкале
 * Представляет собой перетаскиваемый и изменяемый по размеру элемент
 */
const TimelineSlice = ({
  width = "100%",
  height = 50,
  x = 0,
  y = 0,
  id = nanoid(10),
  updateSlice,
  isSelected = false, // Добавляем новый проп
  onSelect, // Добавляем новый проп
}: TimelineSliceProps): JSX.Element => {
  // Локальное состояние слайса
  const [slice, setSlice] = useState<TimelineSliceType>({
    width,
    height,
    x,
    y,
    id,
  })

  return (
    <Rnd
      className={`drag--child ${isSelected ? "drag--child--selected" : ""}`} // Добавляем класс для выбранного состояния
      // Размеры элемента
      size={{
        width: slice.width,
        height: slice.height,
      }}
      // Минимальные размеры элемента
      minWidth={5} // Минимальная ширина в пикселях
      minHeight={50} // Минимальная высота в пикселях
      // Позиция элемента
      position={{
        x: slice.x,
        y: slice.y,
      }}
      // Ограничиваем перемещение границами родителя
      bounds="parent"
      // Разрешаем изменение размера только по горизонтали
      enableResizing={{
        left: true,
        right: true,
      }}
      // CSS классы для маркеров изменения размера
      resizeHandleClasses={{
        right: "drag--handle--right",
        left: "drag--handle--left",
      }}
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation() // Предотвращаем всплытие события
        onSelect?.(id) // Вызываем обработчик выбора при клике
      }}
      // Обработчик окончания перетаскивания
      onDragStop={(_, dragData) => {
        const updatedSlice: Partial<TimelineSliceType> = {
          x: dragData.x,
          y: dragData.y,
        }
        setSlice((prev) => ({ ...prev, ...updatedSlice }))
        updateSlice({ ...slice, ...updatedSlice })
      }}
      // Обработчик окончания изменения размера
      onResizeStop={(_, __, ref, ___, position) => {
        const updatedSlice: Partial<TimelineSliceType> = {
          width: ref.style.width,
          // Убеждаемся, что высота не меньше минимальной
          height: Math.max(+ref.style.height, 50),
          ...position,
        }
        setSlice((prev) => ({ ...prev, ...updatedSlice }))
        updateSlice({ ...slice, ...updatedSlice })
      }}
    />
  )
}

export { TimelineSlice }
