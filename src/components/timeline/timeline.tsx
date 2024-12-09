import React, { useEffect, useRef, useState } from "react"

import { useMedia } from "@/hooks/use-media"
import { useTimelineScale } from "@/hooks/use-timeline-scale"
import { SeekbarState } from "@/types/timeline"

import { VideoTrack } from "../track"
import { TrackSliceWrap } from "../track/track-slice-wrap"

export function Timeline() {
  const { tracks, activeVideo, currentTime, timeToPercent } = useMedia()
  const { scale } = useTimelineScale()
  const maxDuration = Math.max(...tracks.map((track) => track.combinedDuration))

  // Ссылка на DOM-элемент контейнера для определения его размеров
  const parentRef = useRef<HTMLDivElement>(null)

  // Настройки полосы прокрутки (вертикальная линия, показывающая текущее время)
  const [seekbar, setSeekbar] = useState<SeekbarState>({
    width: 3, // Ширина полосы в пикселях
    height: 70, // Высота полосы в пикселях
    y: -10, // Смещение полосы вверх для перекрытия клипов
    x: 0, // Горизонтальное положение полосы
  })

  useEffect(() => {
    const timelineWidth = parentRef.current?.offsetWidth || 0
    const percent = timeToPercent(currentTime)
    const newPosition = (percent / 100) * timelineWidth

    setSeekbar((prev) => ({
      ...prev,
      x: newPosition,
    }))
  }, [currentTime])

  // Изменяем обработчик клика на дорожке
  // const handleTrackClick = useCallback((e: React.MouseEvent, track: Track) => {
  //   e.stopPropagation()

  //   // Находим видео в треке, которое содержит текущее время
  //   const availableVideo = track.videos.find((video: MediaFile) => {
  //     const videoStartTime = new Date(video.probeData?.format.tags?.creation_time || 0).getTime() /
  //       1000
  //     const videoDuration = video.probeData?.format.duration || 0
  //     const videoEndTime = videoStartTime + videoDuration

  //     // Увеличиваем допуск для более плавного переключения
  //     const tolerance = 0.3
  //     return currentTime >= (videoStartTime - tolerance) &&
  //       currentTime <= (videoEndTime + tolerance)
  //   })

  //   if (availableVideo) {
  //     // Если нашли подходящее видео, переключаем камеру без изменения времени
  //     setActiveVideo(availableVideo.id || "")
  //   } else {
  //     // Если не нашли видео на текущем времени, ищем ближайшее
  //     let nearestVideo = track.videos[0]
  //     let minTimeDiff = Infinity

  //     track.videos.forEach((video: MediaFile) => {
  //       const videoStartTime =
  //         new Date(video.probeData?.format.tags?.creation_time || 0).getTime() /
  //         1000
  //       const videoEndTime = videoStartTime + (video.probeData?.format.duration || 0)

  //       // Находим ближайшую точку во времени для этого видео
  //       const nearestTime = videoStartTime > currentTime
  //         ? videoStartTime
  //         : videoEndTime < currentTime
  //         ? videoEndTime
  //         : currentTime

  //       const timeDiff = Math.abs(nearestTime - currentTime)
  //       if (timeDiff < minTimeDiff) {
  //         minTimeDiff = timeDiff
  //         nearestVideo = video
  //       }
  //     })

  //     // Переключаем на найденное видео и устанавливаем соответствующее время
  //     if (nearestVideo) {
  //       const videoStartTime =
  //         new Date(nearestVideo.probeData?.format.tags?.creation_time || 0).getTime() / 1000
  //       const videoDuration = nearestVideo.probeData?.format.duration || 0
  //       const videoEndTime = videoStartTime + videoDuration

  //       setActiveVideo(nearestVideo.id || "")

  //       // Если текущее время выходит за пределы видео, корректируем его
  //       if (currentTime < videoStartTime || currentTime > videoEndTime) {
  //         const newTime = Math.min(Math.max(currentTime, videoStartTime), videoEndTime)
  //         setCurrentTime(newTime)
  //       }
  //     }
  //   }
  // }, [currentTime, activeVideo])

  // const synchronizeTracks = useCallback(() => {
  //   const { tracks, currentTime } = media

  //   tracks.forEach((track) => {
  //     const videoElement = track.videoRefs?.[activeVideo?.id || ""]
  //     if (videoElement) {
  //       const videoStartTime =
  //         new Date(track.videos[0].probeData?.format.tags?.creation_time || 0).getTime() / 1000
  //       const relativeTime = currentTime - videoStartTime

  //       // Synchronize with tolerance
  //       const tolerance = 0.1
  //       if (Math.abs(videoElement.currentTime - relativeTime) > tolerance) {
  //         videoElement.currentTime = relativeTime
  //       }
  //     }
  //   })
  // }, [media])

  // useEffect(() => {
  //   synchronizeTracks()
  // }, [currentTime, synchronizeTracks])

  return (
    <div className="timeline w-full min-h-[calc(50vh-70px)]">
      {/* <TimeScale scale={scale} /> */}
      <div className="relative" style={{ paddingBottom: `37px` }}>
        <div className="flex">
          <div className="flex-1 flex flex-col gap-2 relative">
            {tracks.map((track, index) => (
              <VideoTrack
                key={`track-${track.id}`}
                track={track}
                index={index}
                timeRanges={track.timeRanges}
                maxDuration={maxDuration}
                activeVideo={activeVideo?.id}
                // handleTrackClick={(e) => handleTrackClick(e, track)}
                parentRef={parentRef}
                currentTime={currentTime}
                TrackSliceWrap={TrackSliceWrap}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
