import React, { forwardRef, useEffect, useRef, useState } from "react"
import TimelineBar from "./timeline-bar"
import { nanoid } from "nanoid"

import { useTimelineSliceHelpers } from "./timeline-utils"
import { TimelineSlice } from "./timeline-slice"
import { SeekbarState, TimelineSliceType } from "@/types/timeline"
import TimeScale from "./timeline-scale"

interface TimelineEditorProps {
  t: number // Текущее время в процентах (0-100), определяет положение полосы прокрутки
  duration: number // Добавляем длительность видео
  onTimeUpdate: (time: number) => void // Добавляем колбэк для обновления времени
  startTime: number // Время начала шкалы
}

const TimeLineEditor = (
  { t, duration, onTimeUpdate, startTime }: TimelineEditorProps,
): JSX.Element => {
  // Ссылка на DOM-элемент контейнера для определения его размеров
  const parentRef = useRef<HTMLDivElement>(null)

  // Текущая позиция временной метки в пикселях
  const [timeStamp] = useState<number>(t)

  // Массив всех слайсов (клипов) на временной шкале
  const [slices, setSlices] = useState<TimelineSliceType[]>([])

  // Состояние для хранения ID выбранного слайса
  const [selectedSliceId, setSelectedSliceId] = useState<string | null>(null)

  // Настройки полосы прокрутки (вертикальная линия, показывающая текущее время)
  const [seekbar, setSeekbar] = useState<SeekbarState>({
    width: 3, // Ширина полосы в пикселях
    height: 70, // Высота полосы в пикселях
    y: -10, // Смещение полосы вверх для перекрытия клипов
    x: 0, // Горизонтальное положение полосы
  })

  // Обновляем позицию временной метки при изменении входного времени
  useEffect(() => {
    const percentage = Math.min(Math.max(t / 100, 0), 0.99)
    const timelineWidth = parentRef.current?.offsetWidth || 0
    const newPosition = percentage * timelineWidth

    // Обновляем позицию полосы прокрутки
    setSeekbar((prev) => ({
      ...prev,
      x: newPosition,
    }))
  }, [t])

  /**
   * Компонент-обертка для слайсов
   * Содержит все слайсы и полосу прокрутки
   */
  const SliceWrap = forwardRef<HTMLDivElement, { children: React.ReactNode }>(
    (props, ref) => { // добавляем параметр ref
      return (
        <div className="slice--parent" ref={ref}>
          {props.children}
          <TimelineBar
            t={seekbar.x}
            width={seekbar.width}
            height={seekbar.height}
            y={seekbar.y}
            duration={duration}
            startTime={startTime}
            updateSeekbar={updateSeekbar}
          />
        </div>
      )
    },
  )

  // Добавляем displayName для компонента (опционально, но рекомендуется)
  SliceWrap.displayName = "SliceWrap"

  /**
   * Добавляет новый слайс на временную шкалу
   * Создает слайс с полной шириной и стандартной высотой
   */
  const addNewSlice = () => {
    setSlices([
      ...slices,
      {
        id: nanoid(10),
        x: 0,
        y: 0,
        width: "5%",
        height: 50,
      },
    ])
  }

  /**
   * Обновляет данные существующего слайса
   * Используется при перетаскивании или изменении размера слайса
   */
  const updateSlice = (data: Partial<TimelineSliceType> & { id: string }) => {
    const _current = [...slices]
    const idx = _current.findIndex((slice) => slice.id === data.id)

    if (idx !== -1) {
      _current[idx] = { ..._current[idx], ...data }
      setSlices(_current)
    }
  }

  /**
   * Обновляет состояние полосы прокрутки
   */
  const updateSeekbar = (data: Partial<SeekbarState> & { timestamp?: number }) => {
    setSeekbar((prev) => ({ ...prev, ...data }))

    // Вызываем onTimeUpdate при изменении позиции
    if (data.timestamp !== undefined) {
      onTimeUpdate(data.timestamp)
    }
  }

  // Получаем вспомогательные функции для работы со слайсами (например, удаление)
  const sliceHelpers = useTimelineSliceHelpers(slices, setSlices)

  // В компоненте TimeLineEditor добавляем обработчик выбора
  const handleSliceSelect = (id: string) => {
    setSelectedSliceId((prev) => prev === id ? null : id) // Переключаем выбор при повторном клике
  }

  return (
    <div className="timeline-editor">
      <TimeScale duration={duration} startTime={startTime} />
      <div className="flex gap-2 mb-4">
        <button
          onClick={addNewSlice}
          className="timeline-button timeline-button--add"
          aria-label="Добавить новый клип"
        >
          Добавить
        </button>
        <button
          onClick={() => (selectedSliceId && sliceHelpers.removeSlice(selectedSliceId)) || sliceHelpers.removeSlice()}
          className="timeline-button timeline-button--remove"
          aria-label={selectedSliceId ? "Удалить выбранный клип" : "Удалить последний клип"}
          disabled={slices.length === 0}
        >
          {selectedSliceId ? "Удалить" : "Удалить последний"}
        </button>
      </div>
      <div className="drag--parent">
        <SliceWrap ref={parentRef}>
          {/* Добавляем ref здесь */}
          {slices.map((slice) => (
            <TimelineSlice
              updateSlice={updateSlice}
              key={slice.id}
              {...slice}
              isSelected={selectedSliceId === slice.id}
              onSelect={handleSliceSelect}
              onDelete={sliceHelpers.removeSlice}
            />
          ))}
        </SliceWrap>
      </div>
    </div>
  )
}

export default TimeLineEditor
