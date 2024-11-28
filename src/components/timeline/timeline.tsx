import React, { forwardRef, useCallback, useEffect, useRef, useState } from "react"
import TimelineBar from "./timeline-bar"
import { nanoid } from "nanoid"
import { TimelineSlice } from "./timeline-slice"
import { SeekbarState, TimelineSliceType } from "@/types/timeline"
import TimeScale from "./timeline-scale"
import { formatBitrate, formatDuration } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"
import { Label } from "../ui/label"
import GlobalTimelineBar from "./global-timeline-bar"
import { useMedia } from "@/hooks/use-media"
import { useAudioStore } from '@/stores/audioStore'

export function Timeline(): JSX.Element {
  const { videos, timeRanges, maxDuration, currentTime, timeToPercent } = useMedia()

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
  const [useGlobalBar, setUseGlobalBar] = useState(true)

  const { analyzeAudio } = useAudioStore()

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
              duration={maxDuration}
              startTime={Math.min(...timeRanges.map((x) => x.min))}
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
  const addNewSlice = useCallback((videoPath: string) => {
    const newSlices = [
      ...slices,
      {
        id: nanoid(10),
        x: 0,
        y: 0,
        width: "5%",
        height: 50,
        videoPath,
      },
    ]
    setSlices(newSlices)
    // Save to localStorage
    localStorage.setItem("timelineSlices", JSON.stringify(newSlices))
  }, [slices])

  /**
   * Обновляет данные существующего слайса
   * Используется при перетаскивании или изменении размера слайса
   */
  const updateSlice = useCallback((data: Partial<TimelineSliceType> & { id: string }) => {
    const _current = [...slices]
    const idx = _current.findIndex((slice) => slice.id === data.id)

    if (idx !== -1) {
      _current[idx] = { ..._current[idx], ...data }
      setSlices(_current)
    }
  }, [])

  // В компоненте TimeLineEditor добавляем обработчик выбора
  const handleSliceSelect = useCallback((id: string) => {
    setSelectedSliceId((prev) => prev === id ? null : id) // Переключаем выбор при повторном клике
  }, [])

  useEffect(() => {
    const savedSlices = localStorage.getItem("timelineSlices")
    if (savedSlices) {
      try {
        setSlices(JSON.parse(savedSlices))
      } catch (e) {
        console.error("Failed to parse saved slices:", e)
      }
    }
  }, [])

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


  return (
    <div className="timeline">
      <TimeScale />
      <div className="flex">
        {/* Видеодорожки */}
        <div className="flex-1 flex flex-col gap-2 relative">
          {videos.map((video) => {
            const videoStartTime =
              new Date(video.probeData.format.tags?.creation_time || 0).getTime() / 1000
            const videoDuration = video.probeData.format.duration || 0

            // Вычисляем позицию и ширину видео на шкале напрямую
            const startOffset = ((videoStartTime - Math.min(...timeRanges.map((x) =>
              x.min
            ))) / maxDuration) * 100
            const width = (videoDuration / maxDuration) * 100

            return (
              <div className="flex" key={video.id}>
                <div className="w-full" key={video.id}>
                  {(() => {
                    const videoStream = video.probeData.streams.find((s) =>
                      s.codec_type === "video"
                    )
                    return (
                      <div style={{ marginLeft: `${startOffset}%`, width: `${width}%` }}>
                        <div key={video.path} className="drag--parent flex-1">
                          <SliceWrap ref={parentRef}>
                            <div className="absolute h-full w-full timline-border">
                              <div className="absolute w-full inset-0 flex left-0 px-2 justify-between text-xs text-gray-900 dark:text-gray-100">
                                <div className="flex flex-row video-metadata truncate mr-2">
                                  <span>{video.path.split("/").pop()}</span>
                                  <span>{videoStream?.codec_name?.toUpperCase()}</span>
                                  <span>{videoStream?.width}×{videoStream?.height}</span>
                                  <span>{videoStream?.display_aspect_ratio}</span>
                                  <span>{formatBitrate(video.probeData.format.bit_rate || 0)}</span>
                                </div>
                                <div className="flex flex-col items-end">
                                  <span>
                                    {formatDuration(video.probeData.format.duration || 0, 2)}
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
                    )
                  })()}
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
          duration={maxDuration}
          startTime={Math.min(...timeRanges.map((x) => x.min))}
          height={videos.length * 70} // Высота всех дорожек
        />
      )}
    </div>
  )
}
