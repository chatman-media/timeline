import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"

import { useRootStore } from "@/hooks/use-root-store"
import { formatBitrate, formatDuration, formatTimeWithMilliseconds } from "@/lib/utils"
import { TimelineTrack } from "@/types/timeline"

interface VideoTrackProps {
  track: TimelineTrack
  index: number
  sectionStartTime: number
  sectionDuration: number
}

const VideoTrack = memo(function VideoTrack({
  track,
  index,
  sectionStartTime,
  sectionDuration,
}: VideoTrackProps) {
  const {
    setCurrentTime,
    setActiveVideo,
    activeTrackId,
    setActiveTrack,
    volume: globalVolume,
    trackVolumes,
    setIsPlaying,
  } = useRootStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const [visibleVideos, setVisibleVideos] = useState<string[]>([])
  const videoElementsRef = useRef<Record<string, HTMLVideoElement>>({})

  useEffect(() => {
    // Обновляем громкость для всех видео в треке
    Object.values(videoElementsRef.current).forEach((videoElement) => {
      if (videoElement) {
        const trackVolume = trackVolumes[track.id] ?? 1
        videoElement.volume = globalVolume * trackVolume
      }
    })
  }, [globalVolume, trackVolumes, track.id])

  if (!track.videos || track.videos.length === 0) {
    return null
  }

  const firstVideo = track.videos[0]
  const lastVideo = track.videos[track.videos.length - 1]

  if (!firstVideo || !lastVideo) {
    return null
  }

  const timeToPercent = useCallback(
    (time: number) => {
      if (!sectionStartTime || !sectionDuration || sectionDuration === 0) return 0
      const percent = ((time - sectionStartTime) / sectionDuration) * 100
      return Math.max(0, Math.min(100, percent))
    },
    [sectionStartTime, sectionDuration],
  )

  const trackStartTime = firstVideo.startTime ?? 0
  const trackEndTime = (lastVideo.startTime ?? 0) + (lastVideo.duration ?? 0)
  const startOffset = timeToPercent(trackStartTime)
  const width = timeToPercent(trackEndTime) - startOffset

  const isActive = track.id === activeTrackId

  const handleClick = useCallback(
    (_e: React.MouseEvent, track: TimelineTrack, videoId?: string) => {
      // Предотвращаем всплытие события, чтобы не было двойной обработки
      _e.stopPropagation()

      // Проверяем, является ли переключение треков
      const isTrackChange = track.id !== activeTrackId

      // Если переключаем трек, отмечаем это сразу
      if (isTrackChange) {
        console.log(`[VideoTrack] Переключение с трека ${activeTrackId} на трек ${track.id}`)

        // Устанавливаем активный трек (это включит флаг isChangingCamera)
        setActiveTrack(track.id)

        // Если есть videoId, устанавливаем активное видео
        if (videoId) {
          // Установка активного видео, но без изменения текущего времени
          console.log(`[VideoTrack] Устанавливаем активное видео ${videoId}`)
          setActiveVideo(videoId)
        }
      } else {
        // Трек уже выбран, значит это навигация внутри трека
        if (videoId) {
          console.log(`[VideoTrack] Навигация внутри трека ${track.id} к видео ${videoId}`)
          setActiveVideo(videoId)

          // Находим видео и устанавливаем время начала только для внутритрековой навигации
          const video = track.videos.find((v) => v.id === videoId)
          if (video) {
            const videoStartTime = video.startTime ?? 0
            console.log(`[VideoTrack] Устанавливаем время ${videoStartTime}`)
            setCurrentTime(videoStartTime)
            // Останавливаем воспроизведение при перемещении внутри трека
            setIsPlaying(false)
          }
        }
      }
    },
    [setActiveTrack, setActiveVideo, setCurrentTime, setIsPlaying, activeTrackId],
  )

  // Определяем видимые видео
  useEffect(() => {
    if (!containerRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleIds = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => entry.target.getAttribute("data-video-id") || "")
          .filter(Boolean)

        setVisibleVideos((prev: string[]) => {
          const newSet = new Set([...prev, ...visibleIds])
          return Array.from(newSet)
        })
      },
      { threshold: 0.1 },
    )

    containerRef.current.querySelectorAll("[data-video-id]").forEach((el) => {
      observer.observe(el)
    })

    return () => observer.disconnect()
  }, [track.videos])

  return (
    <div className="flex" ref={containerRef}>
      <div className="w-full">
        <div
          className="absolute h-full"
          style={{
            left: `${startOffset}%`,
            width: `${width}%`,
          }}
        >
          <div
            className={`drag--parent flex-1 ${isActive ? "drag--parent--bordered" : ""}`}
            style={{ cursor: "pointer" }}
            onClick={(e) => {
              if (track.videos.length > 0) {
                handleClick(e, track, track.videos[0].id)
              }
            }}
          >
            <div className="slice--parent bg-[#014a4f]">
              <div className="absolute h-full w-full timline-border">
                <div className="flex h-full w-full flex-col justify-start">
                  <div className="flex relative">
                    {track.videos.map((video) => {
                      const videoStart = video.startTime || 0
                      const videoDuration = video.duration || 0
                      const isVisible = visibleVideos.includes(video.id)

                      if (track.videos.length === 1) {
                        return (
                          <div
                            key={video.id}
                            data-video-id={video.id}
                            className="absolute h-full w-full"
                            style={{
                              left: "0%",
                              width: "100%",
                              height: "70px",
                            }}
                            onClick={(e) => handleClick(e, track, video.id)}
                          >
                            <div className="relative h-full w-full border-r border-gray-600 last:border-r-0">
                              <div
                                className="h-full w-full video-metadata flex flex-row justify-between items-start text-xs text-white truncate p-1 py-[3px] rounded border border-gray-800 hover:border-gray-100 dark:hover:border-gray-100 dark:border-gray-800 m-0 pointer-events-none"
                                style={{
                                  backgroundColor: "#004346",
                                  lineHeight: "13px",
                                }}
                              >
                                <span className="dark:bg-[#033032] px-1 rounded mr-1 text-xs whitespace-nowrap">
                                  {video.probeData?.streams[0]?.codec_name?.startsWith("a")
                                    ? "Аудио"
                                    : "Видео"}{" "}
                                  {track.index}
                                </span>
                                <span className="bg-[#033032] px-1 rounded mr-1 whitespace-nowrap truncate max-w-[120px]">
                                  {video.name}
                                </span>
                                <div className="w-full p-0 m-0 flex space-x-2 justify-end text-xs text-white overflow-hidden">
                                  {video.probeData?.streams?.[0]?.codec_type === "video" ? (
                                    <div className="flex flex-row video-metadata truncate text-xs text-white px-1 rounded">
                                      {video.probeData?.streams[0]?.codec_name && (
                                        <span className="mr-1 font-medium">
                                          {video.probeData.streams[0].codec_name.toUpperCase()}
                                        </span>
                                      )}
                                      {(() => {
                                        const stream = video.probeData?.streams[0]
                                        if (stream?.width && stream?.height) {
                                          // Проверяем, что это действительно числа
                                          const width = Number(stream.width)
                                          const height = Number(stream.height)

                                          if (
                                            !isNaN(width) &&
                                            !isNaN(height) &&
                                            width > 0 &&
                                            height > 0
                                          ) {
                                            return (
                                              <span className="mr-1">
                                                {width}×{height}
                                              </span>
                                            )
                                          }
                                        }
                                        return null
                                      })()}
                                      {(video.probeData?.streams[0]?.display_aspect_ratio ||
                                        (video.probeData?.streams[0]?.width &&
                                          video.probeData?.streams[0]?.height)) && (
                                        <span className="mr-1">
                                          {(() => {
                                            // Форматируем соотношение сторон в более понятную форму
                                            let aspectRatio =
                                              video.probeData.streams[0].display_aspect_ratio

                                            // Если соотношение не указано, но есть ширина и высота - рассчитываем
                                            if (
                                              !aspectRatio &&
                                              video.probeData.streams[0].width &&
                                              video.probeData.streams[0].height
                                            ) {
                                              const width = video.probeData.streams[0].width
                                              const height = video.probeData.streams[0].height

                                              // Находим НОД для сокращения дроби
                                              const gcd = (a: number, b: number): number => {
                                                return b === 0 ? a : gcd(b, a % b)
                                              }

                                              const divisor = gcd(width, height)
                                              const simplifiedWidth = width / divisor
                                              const simplifiedHeight = height / divisor

                                              // Если после сокращения получаются слишком большие числа,
                                              // используем приблизительные стандартные соотношения
                                              if (simplifiedWidth <= 50 && simplifiedHeight <= 50) {
                                                aspectRatio = `${simplifiedWidth}:${simplifiedHeight}`
                                              } else {
                                                // Находим приблизительное соотношение
                                                const ratio = width / height

                                                if (Math.abs(ratio - 16 / 9) < 0.1) return "16:9"
                                                if (Math.abs(ratio - 4 / 3) < 0.1) return "4:3"
                                                if (Math.abs(ratio - 21 / 9) < 0.1) return "21:9"
                                                if (Math.abs(ratio - 1) < 0.1) return "1:1"

                                                // Если не подходит под стандартные, округляем до 2 знаков
                                                return `${ratio.toFixed(2)}:1`
                                              }
                                            }

                                            // Если N/A или неизвестное значение, пропускаем
                                            if (!aspectRatio || aspectRatio === "N/A") {
                                              return ""
                                            }

                                            // Далее прежняя логика обработки
                                            if (aspectRatio.includes(":")) {
                                              // Переворачиваем соотношение, если оно вертикальное
                                              if (aspectRatio.startsWith("9:16")) {
                                                return "16:9"
                                              }
                                              return aspectRatio
                                            }

                                            // Если это десятичное число, преобразуем в соотношение
                                            if (!isNaN(parseFloat(aspectRatio))) {
                                              const ratio = parseFloat(aspectRatio)
                                              // Проверяем стандартные соотношения
                                              if (Math.abs(ratio - 1.78) < 0.1) return "16:9"
                                              if (Math.abs(ratio - 1.33) < 0.1) return "4:3"
                                              if (Math.abs(ratio - 2.35) < 0.1) return "21:9"
                                            }

                                            return aspectRatio
                                          })()}
                                        </span>
                                      )}
                                      {video.probeData?.streams[0]?.r_frame_rate && (
                                        <span className="mr-1">
                                          {(() => {
                                            // Правильно обрабатываем значение fps из r_frame_rate
                                            const fpsRaw = video.probeData.streams[0].r_frame_rate
                                            if (fpsRaw.includes("/")) {
                                              const [numerator, denominator] = fpsRaw
                                                .split("/")
                                                .map(Number)
                                              if (denominator && numerator) {
                                                // Округляем до 2 знаков после запятой
                                                const fps =
                                                  Math.round((numerator / denominator) * 100) / 100
                                                return `${fps} fps`
                                              }
                                            }
                                            // Если формат не распознан, просто показываем как есть
                                            return `${fpsRaw} fps`
                                          })()}
                                        </span>
                                      )}
                                      {video.duration !== undefined && (
                                        <span>
                                          {video.duration > 0
                                            ? formatDuration(video.duration, 3)
                                            : ""}
                                        </span>
                                      )}
                                    </div>
                                  ) : video.probeData?.streams?.[0]?.codec_type === "audio" ? (
                                    <div className="flex flex-row video-metadata truncate text-xs text-white bg-[#033032] px-1">
                                      {video.probeData?.streams[0]?.codec_name && (
                                        <span className="mr-1 font-medium">
                                          {video.probeData.streams[0].codec_name}
                                        </span>
                                      )}
                                      {video.probeData?.streams[0]?.channels && (
                                        <span className="mr-1">
                                          каналов: {video.probeData.streams[0].channels}
                                        </span>
                                      )}
                                      {video.probeData?.streams[0]?.sample_rate && (
                                        <span className="mr-1">
                                          {Math.round(
                                            Number(video.probeData.streams[0].sample_rate) / 1000,
                                          )}
                                          kHz
                                        </span>
                                      )}
                                      {video.probeData?.streams[0]?.bit_rate && (
                                        <span className="mr-1">
                                          {formatBitrate(
                                            Number(video.probeData.streams[0].bit_rate),
                                          )}
                                        </span>
                                      )}
                                      {video.duration !== undefined && (
                                        <span>
                                          {video.duration > 0
                                            ? formatDuration(video.duration, 3)
                                            : ""}
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="flex flex-row video-metadata truncate text-xs text-white bg-[#033032] px-1 rounded">
                                      <span>Нет данных</span>
                                      {video.duration !== undefined && (
                                        <span className="ml-1">
                                          {video.duration > 0
                                            ? formatDuration(video.duration, 3)
                                            : ""}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                              {/* <div
                                className="w-full absolute bottom-0 left-0"
                                style={{
                                  height: "40px",
                                  minHeight: "40px",
                                  // backgroundColor: "transparent",
                                }}
                              >
                                <Waveform audioUrl={video.path} />
                              </div> */}
                              <div
                                className="absolute bottom-0 left-0 text-xs text-gray-100 mb-[2px] ml-1 bg-[#033032] text-[11px] px-[3px]"
                                style={{
                                  display: width < 16 ? "none" : "block",
                                }}
                              >
                                {formatTimeWithMilliseconds(videoStart || 0, false, true, true)}
                              </div>
                              <div
                                className="absolute bottom-0 right-0 text-xs text-gray-100 mb-[2px] mr-1 bg-[#033032] text-[11px] px-[3px]"
                                style={{
                                  display: width < 16 ? "none" : "block",
                                }}
                              >
                                {formatTimeWithMilliseconds(
                                  (videoStart || 0) + (videoDuration || 0),
                                  false,
                                  true,
                                  true,
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      }
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

VideoTrack.displayName = "VideoTrack"

export { VideoTrack }
