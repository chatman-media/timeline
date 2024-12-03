import { Dispatch, SetStateAction } from "react"

import { TimelineSliceType } from "@/types/timeline"

interface TimelineHelpers {
  removeSlice: (id?: string) => void // id теперь опциональный параметр
}

/**
 * Хук для работы со слайсами временной шкалы
 * Предоставляет вспомогательные функции для управления слайсами
 */
const useTimelineSliceHelpers = (
  slices: TimelineSliceType[],
  setSlices: Dispatch<SetStateAction<TimelineSliceType[]>>,
): TimelineHelpers => {
  // Обновляем функцию removeSlice
  const removeSlice = (id?: string) => {
    if (id) {
      // Если указан id, удаляем конкретный слайс
      setSlices((prev) => prev.filter((slice) => slice.id !== id))
    } else {
      // Если id не указан, удаляем последний слайс
      const _r = [...slices]
      _r.pop()
      setSlices(_r)
    }
  }

  return { removeSlice }
}

export { useTimelineSliceHelpers }
