import { nanoid } from "nanoid"
import React, { forwardRef, memo, useCallback, useEffect, useRef, useState } from "react"

import { useMedia } from "@/hooks/use-media"
import { usePreloadVideos } from "@/hooks/use-preload-videos"
import { SeekbarState, TimelineSliceType } from "@/types/timeline"
import { AssembledTrack } from "@/types/videos"

import GlobalTimelineBar from "./global-timeline-bar"
import TimelineBar from "./timeline-bar"
import TimeScale from "./timeline-scale"
import { TrackMetadata } from "./track-metadata"
import { TrackThumbnails } from "./track-thumbnails"
import { TrackTimestamps } from "./track-timestamps"

export function Timeline({ scale = 1 }: { scale?: number }): JSX.Element {
  usePreloadVideos()

  const {
    videos,
    timeRanges,
    maxDuration,
    currentTime,
    updateTime,
    timeToPercent,
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
   * Обвляет данные существующего слайса
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
  const handleTrackClick = useCallback((e: React.MouseEvent, track: AssembledTrack) => {
    e.stopPropagation()

    // Находим видео в треке, которое содержит текущее время
    const availableVideo = track.allVideos.find((video) => {
      const videoStartTime = new Date(video.probeData.format.tags?.creation_time || 0).getTime() /
        1000
      const videoDuration = video.probeData.format.duration || 0
      const videoEndTime = videoStartTime + videoDuration

      // Увеличиваем допуск для более плавного переключения
      const tolerance = 0.3
      return currentTime >= (videoStartTime - tolerance) &&
        currentTime <= (videoEndTime + tolerance)
    })

    if (availableVideo) {
      // Если нашли подходящее видео, переключаем камеру без изменения времени
      setActiveCamera(availableVideo.id)
    } else {
      // Если не нашли видео на текущем времени, ищем ближайшее
      let nearestVideo = track.allVideos[0]
      let minTimeDiff = Infinity

      track.allVideos.forEach((video) => {
        const videoStartTime = new Date(video.probeData.format.tags?.creation_time || 0).getTime() /
          1000
        const videoEndTime = videoStartTime + (video.probeData.format.duration || 0)

        // Находим ближайшую точку во времени для этого видео
        const nearestTime = videoStartTime > currentTime
          ? videoStartTime
          : videoEndTime < currentTime
          ? videoEndTime
          : currentTime

        const timeDiff = Math.abs(nearestTime - currentTime)
        if (timeDiff < minTimeDiff) {
          minTimeDiff = timeDiff
          nearestVideo = video
        }
      })

      // Переключаем на найденное видео и устанавливаем соответствующее время
      if (nearestVideo) {
        const videoStartTime =
          new Date(nearestVideo.probeData.format.tags?.creation_time || 0).getTime() / 1000
        const videoDuration = nearestVideo.probeData.format.duration || 0
        const videoEndTime = videoStartTime + videoDuration

        setActiveCamera(nearestVideo.id)

        // Если текущее время выходит за пределы видео, корректируем его
        if (currentTime < videoStartTime || currentTime > videoEndTime) {
          const newTime = Math.min(Math.max(currentTime, videoStartTime), videoEndTime)
          updateTime(newTime)
        }
      }
    }
  }, [currentTime, activeCamera])

  // Новый компонент TrackWrapper
  const TrackWrapper = memo(({
    track,
    isActive,
    onClick,
    children,
  }: {
    track: AssembledTrack
    isActive: boolean
    onClick: (e: React.MouseEvent) => void
    children: React.ReactNode
  }) => {
    return (
      <div
        className={`drag--parent flex-1 ${isActive ? "drag--parent--bordered" : ""}`}
        onClick={onClick}
        style={{ cursor: "pointer" }}
      >
        {children}
      </div>
    )
  }, (prev, next) => {
    // More specific comparison
    return prev.isActive === next.isActive &&
      prev.track.index === next.track.index &&
      prev.track.cameraKey === next.track.cameraKey
  })

  TrackWrapper.displayName = "TrackWrapper"

  // Новый компонент Track
  const Track = ({
    track,
    index,
    scale,
    timeRanges,
    maxDuration,
    activeCamera,
    handleTrackClick,
    parentRef,
  }: {
    track: AssembledTrack
    index: number
    scale: number
    timeRanges: { min: number }[]
    maxDuration: number
    activeCamera: string | null
    handleTrackClick: (e: React.MouseEvent, track: AssembledTrack) => void
    parentRef: React.RefObject<HTMLDivElement>
  }) => {
    const firstVideo = track.allVideos[0]
    const lastVideo = track.allVideos[track.allVideos.length - 1]
    const trackStartTime =
      new Date(firstVideo.probeData.format.tags?.creation_time || 0).getTime() / 1000
    const trackEndTime =
      new Date(lastVideo.probeData.format.tags?.creation_time || 0).getTime() / 1000 +
      (lastVideo.probeData.format.duration || 0)

    const startOffset =
      ((trackStartTime - Math.min(...timeRanges.map((x) => x.min))) / maxDuration) * 100
    const width = ((trackEndTime - trackStartTime) / maxDuration) * 100

    const videoStream = firstVideo.probeData.streams.find((s) => s.codec_type === "video")
    const trackKey = `track-${track.cameraKey || index}-${index}`
    const isActive = track.index === parseInt(activeCamera?.replace("V", "") || "0")

    return (
      <div className="flex" key={trackKey}>
        <div className="w-full">
          <div style={{ marginLeft: `${startOffset}%`, width: `${width}%` }}>
            <TrackWrapper
              track={track}
              isActive={isActive}
              onClick={(e) => handleTrackClick(e, track)}
            >
              <SliceWrap ref={parentRef}>
                <div className="absolute h-full w-full timline-border">
                  <div className="flex h-full w-full flex-col justify-between">
                    <TrackMetadata
                      track={track}
                      videoStream={videoStream}
                    />
                    <TrackThumbnails
                      track={track}
                      trackStartTime={trackStartTime}
                      trackEndTime={trackEndTime}
                      scale={scale}
                    />
                    <TrackTimestamps
                      trackStartTime={trackStartTime}
                      trackEndTime={trackEndTime}
                    />
                  </div>
                </div>
              </SliceWrap>
            </TrackWrapper>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="timeline">
      <TimeScale scale={scale} />
      <div className="relative" style={{ paddingBottom: `37px` }}>
        <div className="flex">
          <div className="flex-1 flex flex-col gap-2 relative">
            {assembledTracks.map((track, index) => (
              <Track
                key={`track-${track.cameraKey || index}-${index}`}
                track={track}
                index={index}
                scale={scale}
                timeRanges={timeRanges}
                maxDuration={maxDuration}
                activeCamera={activeCamera}
                handleTrackClick={handleTrackClick}
                parentRef={parentRef}
              />
            ))}
          </div>
          {useGlobalBar && (
            <GlobalTimelineBar
              duration={maxDuration}
              currentTime={currentTime}
              startTime={Math.min(...timeRanges.map((range) => range.min))}
              height={assembledTracks.length * 110}
              onTimeChange={updateTime}
            />
          )}
        </div>
      </div>
    </div>
  )
}
