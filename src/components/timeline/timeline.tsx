import { MediaFile } from "@/types/videos"
import React, { forwardRef, useEffect, useRef, useState } from "react"
import TimelineBar from "./timeline-bar"
import { nanoid } from "nanoid"
import { TimelineSlice } from "./timeline-slice"
import { SeekbarState, TimelineSliceType } from "@/types/timeline"
import TimeScale from "./timeline-scale"
import { MinusIcon, PlusIcon } from "lucide-react"
import { useTimeline } from "@/hooks/use-timeline"
import { formatTimeWithMilliseconds } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"
import { Label } from "../ui/label"
import GlobalTimelineBar from "./global-timeline-bar"

export interface TimelineProps {
  duration: number
  onTimeUpdate: (time: number) => void
  startTime: number
  videos: MediaFile[]
}

export function Timeline(
  { duration, onTimeUpdate, startTime, videos }: TimelineProps,
): JSX.Element {
  const { currentTime, timeToPercent } = useTimeline({
    startTime,
    duration,
    onChange: onTimeUpdate,
  })

  // Ссылка на DOM-элемент контейнера для определения его размеров
  const parentRef = useRef<HTMLDivElement>(null)

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
    const timelineWidth = parentRef.current?.offsetWidth || 0
    const percent = timeToPercent(currentTime)
    const newPosition = (percent / 100) * timelineWidth

    setSeekbar((prev) => ({
      ...prev,
      x: newPosition,
    }))
  }, [currentTime])

  /**
   * Компонент-обертка для слайсов
   * Содержит все слайсы и полосу прокрутки
   */
  const SliceWrap = forwardRef<HTMLDivElement, { children: React.ReactNode }>(
    (props, ref) => { // добавляем параметр ref
      return (
        <div className="slice--parent" ref={ref}>
          {props.children}
          {!useGlobalBar && (
            <TimelineBar
              width={seekbar.width}
              height={seekbar.height}
              y={seekbar.y}
              duration={duration}
              startTime={startTime}
              visible={true}
            />
          )}
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

  // В компоненте TimeLineEditor добавляем обработчик выбора
  const handleSliceSelect = (id: string) => {
    setSelectedSliceId((prev) => prev === id ? null : id) // Переключаем выбор при повторном клике
  }

  // Добавляем в начало компонента новый state
  const [useGlobalBar, setUseGlobalBar] = useState(true)

  return (
    <div className="timeline">
      <div className="flex">
        <div className="w-[52px] mr-4" />
        <div className="flex-1">
          <TimeScale
            duration={duration}
            startTime={startTime}
          />
        </div>
      </div>
      <div className="flex">
        {/* Кнопки слева */}
        <div className="flex flex-col gap-2 mr-4 ">
          <button
            onClick={addNewSlice}
            className="timeline-button timeline-button--add"
            aria-label="Добавить новый клип"
          >
            <PlusIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => {/*...*/}}
            className="timeline-button timeline-button--remove"
            aria-label="Удалить клип"
            disabled={slices.length === 0}
          >
            <MinusIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Видеодорожки */}
        <div className="flex-1 flex flex-col gap-2 relative">
          {videos.map((video) => {
            const videoStartTime =
              new Date(video.probeData.format.tags?.creation_time || 0).getTime() / 1000
            const videoDuration = video.probeData.format.duration || 0

            // Вычисляем позицию и ширину видео на шкале напрямую
            const startOffset = ((videoStartTime - startTime) / duration) * 100
            const width = (videoDuration / duration) * 100

            return (
              <div className="w-full" key={video.path}>
                <div style={{ marginLeft: `${startOffset}%`, width: `${width}%` }}>
                  <div key={video.path} className="drag--parent flex-1">
                    <SliceWrap ref={parentRef}>
                      <div className="absolute h-full w-full bg-secondary-foreground/20">
                        <div className="absolute w-full inset-0 flex left-0 px-2 justify-between text-xs text-foreground">
                          <div className="flex flex-col">
                            <span>{video.path.split("/").pop()}</span>
                            <span className="text-muted-foreground">
                              {video.probeData.format.format_name}
                            </span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span>{formatTimeWithMilliseconds(videoDuration)}</span>
                            <span className="text-muted-foreground">
                              {Math.round(video.probeData.format.size / 1024 / 1024)}MB
                            </span>
                          </div>
                        </div>
                      </div>
                      {/* Слайсы для этой видеодорожки */}
                      {slices
                        .filter((slice) => slice.videoPath === video.path)
                        .map((slice) => (
                          <TimelineSlice
                            key={slice.id}
                            updateSlice={updateSlice}
                            {...slice}
                            isSelected={selectedSliceId === slice.id}
                            onSelect={handleSliceSelect}
                          />
                        ))}
                    </SliceWrap>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <div className="flex items-center gap-2 mb-4">
        <Switch
          checked={useGlobalBar}
          onCheckedChange={setUseGlobalBar}
          id="timeline-mode"
        />
        <Label htmlFor="timeline-mode">
          Использовать общий таймлайн
        </Label>
      </div>
      {useGlobalBar && (
        <GlobalTimelineBar
          duration={duration}
          startTime={startTime}
          height={videos.length * 70} // Высота всех дорожек
        />
      )}
    </div>
  )
}
