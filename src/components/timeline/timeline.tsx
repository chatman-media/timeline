import React, { forwardRef, memo, useCallback, useEffect, useRef, useState } from "react"
import TimelineBar from "./timeline-bar"
import { nanoid } from "nanoid"
import { SeekbarState, TimelineSliceType } from "@/types/timeline"
import TimeScale from "./timeline-scale"
import GlobalTimelineBar from "./global-timeline-bar"
import { useMedia } from "@/hooks/use-media"
import { AssembledTrack } from "@/types/videos"
import { usePreloadVideos } from "@/hooks/use-preload-videos"
import { isVideoAvailable } from "@/lib/utils"
import { TrackMetadata } from "./track-metadata"
import { TrackSeparators } from "./track-separators"
import { TrackTimestamps } from "./track-timestamps"

export function Timeline(): JSX.Element {
  usePreloadVideos()

  const {
    videos,
    timeRanges,
    maxDuration,
    currentTime,
    timeToPercent,
    updateTime,
    assembledTracks,
    activeCamera,
    setActiveCamera,
  } = useMedia()

  useEffect(() => {
    console.log("Media hook state:", {
      videosLength: videos.length,
      timeRangesLength: timeRanges.length,
      maxDuration,
      assembledTracks,
    })
  }, [videos, timeRanges, maxDuration, assembledTracks])

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
  const [useGlobalBar] = useState(true)

  /**
   * Компонент-обертка для слайсов
   * Содержит все слайсы и полосу прокрутки
   */
  const SliceWrap = memo(forwardRef<HTMLDivElement, { children: React.ReactNode }>(
    (props, ref) => {
      return (
        <div className="slice--parent bg-[#014a4f]" ref={ref}>
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
  ))

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

  useEffect(() => {
    const timelineWidth = parentRef.current?.offsetWidth || 0
    const percent = timeToPercent(currentTime)
    const newPosition = (percent / 100) * timelineWidth

    setSeekbar((prev) => ({
      ...prev,
      x: newPosition,
    }))
  }, [currentTime])

  useEffect(() => {
    if (videos && videos.length > 0) {
      // Выбираем первое видео при монтировании компонента
      setActiveCamera(videos[0].id)
      updateTime(currentTime) // Устанавливаем время в начало
    }
  }, [videos]) // Зависимость от массива videos

  // Изменяем обработчик клика на дорожке
  const handleTrackClick = (e: React.MouseEvent, track: AssembledTrack) => {
    e.stopPropagation()

    // Находим видео в треке, которое содержит текущее время
    const availableVideo = track.allVideos.find((video) => isVideoAvailable(video, currentTime))

    if (availableVideo) {
      // Если нашли подходящее видео, просто переключаем камеру
      setActiveCamera(availableVideo.id)
    }
  }

  const renderTrack = useCallback((track: AssembledTrack, index: number) => {
    const firstVideo = track.allVideos[0]
    const lastVideo = track.allVideos[track.allVideos.length - 1]

    const trackStartTime =
      new Date(firstVideo.probeData.format.tags?.creation_time || 0).getTime() / 1000
    const trackEndTime =
      new Date(lastVideo.probeData.format.tags?.creation_time || 0).getTime() / 1000 +
      (lastVideo.probeData.format.duration || 0)

    const startOffset = ((trackStartTime - Math.min(...timeRanges.map((x) =>
      x.min
    ))) / maxDuration) * 100
    const width = ((trackEndTime - trackStartTime) / maxDuration) * 100

    const videoStream = firstVideo.probeData.streams.find((s) => s.codec_type === "video")
    const trackKey = `track-${track.cameraKey || index}-${index}`

    return (
      <div className="flex" key={trackKey}>
        <div className="w-full">
          <div style={{ marginLeft: `${startOffset}%`, width: `${width}%` }}>
            <div
              className={`drag--parent flex-1 ${
                track.index === parseInt(activeCamera?.replace("V", "") || "0")
                  ? "drag--parent--bordered"
                  : ""
              }`}
              onClick={(e) => handleTrackClick(e, track)}
              style={{ cursor: "pointer" }}
            >
              <SliceWrap ref={parentRef}>
                <div className="absolute h-full w-full timline-border">
                  <div className="flex h-full w-full flex-col justify-between">
                    <TrackSeparators
                      videos={track.allVideos}
                      trackStartTime={trackStartTime}
                      trackEndTime={trackEndTime}
                    />
                    <TrackMetadata
                      track={track}
                      videoStream={videoStream}
                    />
                    <TrackTimestamps
                      trackStartTime={trackStartTime}
                      trackEndTime={trackEndTime}
                    />
                  </div>
                </div>
              </SliceWrap>
            </div>
          </div>
        </div>
      </div>
    )
  }, [activeCamera, handleTrackClick, maxDuration, parentRef, timeRanges])

  return (
    <div className="timeline">
      <TimeScale />
      <div className="relative" style={{ paddingBottom: `37px` }}>
        <div className="flex">
          <div className="flex-1 flex flex-col gap-2 relative">
            {assembledTracks.map(renderTrack)}
          </div>
          {useGlobalBar && (
            <GlobalTimelineBar
              duration={maxDuration}
              currentTime={currentTime}
              startTime={Math.min(...timeRanges.map((range) => range.min))}
              height={assembledTracks.length * 70}
              onTimeChange={updateTime}
            />
          )}
        </div>
      </div>
    </div>
  )
}
