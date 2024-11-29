import React, { forwardRef, memo, useCallback, useEffect, useRef, useState } from "react"
import TimelineBar from "./timeline-bar"
import { nanoid } from "nanoid"
import { TimelineSlice } from "./timeline-slice"
import { SeekbarState, TimelineSliceType } from "@/types/timeline"
import TimeScale from "./timeline-scale"
import { formatBitrate, formatDuration, formatTime, formatTimeWithMilliseconds } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"
import { Label } from "../ui/label"
import GlobalTimelineBar from "./global-timeline-bar"
import { useMedia } from "@/hooks/use-media"
import { useAudioStore } from "@/stores/audioStore"
import { Badge } from "../ui/badge"

export function Timeline(): JSX.Element {
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
  const [useGlobalBar, setUseGlobalBar] = useState(true)

  const { analyzeAudio } = useAudioStore()

  /**
   * Компонент-обертка для слайсов
   * Содержит все слайсы и полосу прокрутки
   */
  const SliceWrap = memo(forwardRef<HTMLDivElement, { children: React.ReactNode }>(
    (props, ref) => {
      return (
        <div className="slice--parent bg-[#014d52]/80" ref={ref}>
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

  return (
    <div className="timeline">
      <TimeScale />
      <div className="relative" style={{ paddingBottom: `37px` }}>
        <div className="flex">
          {/* Видеодорожки */}
          <div className="flex-1 flex flex-col gap-2 relative">
            {assembledTracks.map((track, index) => {
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

              const isActive = track.allVideos.some((v) => v.id === activeCamera)

              // Use a combination of index and cameraKey to ensure uniqueness
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
                        onClick={(e) => {
                          e.stopPropagation()
                          // Проверяем, попадает ли текущее время в диапазон этого видео
                          const videoStartTime =
                            new Date(track.video.probeData.format.tags?.creation_time || 0)
                              .getTime() / 1000
                          const videoEndTime = videoStartTime +
                            (track.video.probeData.format.duration || 0)

                          if (currentTime >= videoStartTime && currentTime <= videoEndTime) {
                            // Если текущее время в диапазоне видео, просто переключаем камеру
                            setActiveCamera(track.video.id)
                          } else {
                            // Если текущее время вне диапазона, находим ближайшую точку в видео
                            const newTime = Math.min(
                              Math.max(currentTime, videoStartTime),
                              videoEndTime,
                            )
                            updateTime(newTime)
                            setActiveCamera(track.video.id)
                          }
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        <SliceWrap ref={parentRef}>
                          <div className="absolute h-full w-full timline-border">
                            <div className="flex h-full w-full flex-col justify-between">
                              {track.allVideos.map((video, videoIndex) => {
                                if (videoIndex === 0) return null

                                const prevVideo = track.allVideos[videoIndex - 1]
                                const prevEndTime =
                                  new Date(prevVideo.probeData.format.tags?.creation_time || 0)
                                      .getTime() / 1000 +
                                  (prevVideo.probeData.format.duration || 0)
                                const currentStartTime =
                                  new Date(video.probeData.format.tags?.creation_time || 0)
                                    .getTime() / 1000

                                const separatorPosition = ((prevEndTime - trackStartTime) /
                                  (trackEndTime - trackStartTime)) * 100

                                return (
                                  <div
                                    key={`separator-${video.id}`}
                                    className="absolute h-full w-[1px] bg-white"
                                    style={{
                                      left: `${separatorPosition}%`,
                                      top: 0,
                                    }}
                                  />
                                )
                              })}

                              <div className="w-full inset-0 flex left-0 px-2 justify-between text-xs text-gray-900 dark:text-gray-100">
                                <div className="flex flex-row video-metadata truncate mr-2">
                                  <span>{track.index}</span>
                                  {track.allVideos.map((v) => (
                                    <span key={v.id}>{v.path.split("/").pop()}</span>
                                  ))}
                                  <span>{videoStream?.codec_name?.toUpperCase()}</span>
                                  <span>{videoStream?.width}×{videoStream?.height}</span>
                                  <span>{videoStream?.display_aspect_ratio}</span>
                                  <span>
                                    {formatBitrate(
                                      Math.round(
                                        track.allVideos.reduce(
                                          (sum, video) =>
                                            sum + (video.probeData.format.bit_rate || 0),
                                          0,
                                        ) /
                                          track.allVideos.length,
                                      ),
                                    )}
                                  </span>
                                </div>
                                <div className="flex flex-col items-end time">
                                  <div>{formatDuration(track.combinedDuration, 2)}</div>
                                </div>
                              </div>
                              <div className="w-full inset-0 flex left-0 px-2 justify-between text-xs text-gray-900 dark:text-gray-100">
                                <div className="time">
                                  {formatTimeWithMilliseconds(trackStartTime, false, true, true)}
                                </div>
                                <div className="time">
                                  {formatTimeWithMilliseconds(trackEndTime, false, true, true)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </SliceWrap>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
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
