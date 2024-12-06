import { nanoid } from "nanoid"
import React, { useCallback, useEffect, useRef, useState } from "react"

import { useMedia } from "@/hooks/use-media"
import { usePreloadVideos } from "@/hooks/use-preload-videos"
import { SeekbarState, TrackSliceData } from "@/types/timeline"

import { Track } from "../track"
import { GlobalTimelineBar } from "./global-timeline-bar"
import TimeScale from "./timeline-scale"

export function Timeline({ scale = 1 }: { scale?: number }): JSX.Element {
  usePreloadVideos()

  const {
    videos,
    timeRanges,
  } = useMedia()

  // Ссылка на DOM-элемент контейнера для определения его размеров
  const parentRef = useRef<HTMLDivElement>(null)

  // Массив всех слайсов (клипов) на временной шкале
  const [slices, setSlices] = useState<TrackSliceData[]>([])

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
    setSlices(newSlices as TrackSliceData[])
    // Save to localStorage
    localStorage.setItem("timelineSlices", JSON.stringify(newSlices))
  }, [slices])

  /**
   * Обвляет данные существующего слайса
   * Используется при перетаскивании или изменении размера слайса
   */
  const updateSlice = useCallback((data: Partial<TrackSliceData> & { id: string }) => {
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

  const synchronizeTracks = useCallback(() => {
    const { tracks, currentTime } = useMedia()

    tracks.forEach((track) => {
      const videoElement = track.videoRefs?.[track.activeVideo?.id || ""]
      if (videoElement) {
        const videoStartTime =
          new Date(track.activeVideo?.probeData?.format.tags?.creation_time || 0).getTime() / 1000
        const relativeTime = currentTime - videoStartTime

        // Synchronize with tolerance
        const tolerance = 0.1
        if (Math.abs(videoElement.currentTime - relativeTime) > tolerance) {
          videoElement.currentTime = relativeTime
        }
      }
    })
  }, [currentTime])

  useEffect(() => {
    synchronizeTracks()
  }, [currentTime, synchronizeTracks])

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
                currentTime={currentTime}
                TrackSliceWrap={({ children }) => (
                  <div className="relative h-full">
                    {children}
                  </div>
                )}
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
