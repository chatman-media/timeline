import { memo, useCallback, useRef } from "react"

import { formatBitrate, formatDuration, formatTimeWithMilliseconds } from "@/lib/utils"
import { usePlayerContext } from "@/media-player"
import { useTimelineContext } from "@/timeline/services/timeline-provider"
import { Track } from "@/types/media"

interface TimelineTrackProps {
  track: Track
  index: number
  sectionStartTime: number
  sectionDuration: number
  coordinates: {
    left: number
    width: number
    videos: Record<
      string,
      {
        left: number
        width: number
      }
    >
  }
}

const TimelineTrack = memo(function TimelineTrack({
  track,
  index,
  coordinates,
}: TimelineTrackProps) {
  const { activeTrackId, setActiveTrack } = useTimelineContext()
  const { setVideo: setActiveVideo, setVideoLoading, setVideoReady } = usePlayerContext()
  const containerRef = useRef<HTMLDivElement>(null)

  if (!track.videos || track.videos.length === 0) {
    return null
  }

  const firstVideo = track.videos[0]
  const lastVideo = track.videos[track.videos.length - 1]

  if (!firstVideo || !lastVideo) {
    return null
  }

  const isActive = track.id === activeTrackId

  const handleClick = useCallback(
    (_e: React.MouseEvent, track: Track, videoId: string) => {
      _e.stopPropagation()
      const video = track.videos?.find((v) => v.id === videoId)
      if (!video) return

      console.log(`[VideoTrack] Клик по видео ${videoId}`)
      setActiveTrack(track.id)
      setVideoLoading(true)
      setActiveVideo(video)

      // Создаем временный элемент для проверки готовности видео
      const tempVideo = document.createElement("video")
      tempVideo.src = video.path

      tempVideo.onloadeddata = () => {
        setVideoReady(true)
        setVideoLoading(false)
      }

      tempVideo.onerror = () => {
        setVideoLoading(false)
        console.error("Failed to load video:", video.path)
      }
    },
    [setActiveTrack, setActiveVideo, setVideoLoading, setVideoReady],
  )

  return (
    <div className="flex" ref={containerRef}>
      <div className="h-full w-full">
        <div
          className="relative h-full"
          style={{
            left: `${coordinates.left}%`,
            width: `${coordinates.width}%`,
          }}
        >
          <div
            className={`drag--parent flex-1 ${isActive ? "drag--parent--bordered" : ""}`}
            style={{
              cursor: "pointer",
              zIndex: 1,
              position: "relative",
            }}
            onClick={(e) => {
              if (track.videos?.length) {
                handleClick(e, track, track.videos[0].id)
              }
            }}
          >
            <div className="slice--parent bg-[#014a4f]">
              <div className="timline-border absolute h-full w-full">
                <div className="flex h-full w-full flex-col justify-start">
                  <div className="relative flex">
                    {track.videos?.map((video) => {
                      const coords = coordinates.videos[video.id]
                      if (!coords) return null

                      if (track.videos?.length) {
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
                                className="video-metadata m-0 flex h-full w-full flex-row items-start justify-between truncate rounded border border-gray-800 p-1 py-[3px] text-xs text-white hover:border-gray-100 dark:border-gray-800 dark:hover:border-gray-100"
                                style={{
                                  backgroundColor: "#004346",
                                  lineHeight: "13px",
                                }}
                              >
                                <span className="mr-1 rounded px-1 text-xs whitespace-nowrap dark:bg-[#033032]">
                                  {video.probeData?.streams[0]?.codec_name?.startsWith("a")
                                    ? "Аудио"
                                    : "Видео"}{" "}
                                  {track.index}
                                </span>
                                <span className="mr-1 max-w-[120px] truncate rounded bg-[#033032] px-1 whitespace-nowrap">
                                  {video.name}
                                </span>
                                <div className="m-0 flex w-full justify-end space-x-2 overflow-hidden p-0 text-xs text-white">
                                  {video.probeData?.streams?.[0]?.codec_type === "video" ? (
                                    <div className="video-metadata flex flex-row truncate rounded px-1 text-xs text-white">
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
                                  ) : (
                                    <div className="video-metadata flex flex-row truncate bg-[#033032] px-1 text-xs text-white">
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
                                  )}
                                </div>
                              </div>
                              <div
                                className="absolute bottom-0 left-0 mb-[2px] ml-1 bg-[#033032] px-[3px] text-xs text-[11px] text-gray-100"
                                style={{
                                  display: coords.width < 16 ? "none" : "block",
                                }}
                              >
                                {formatTimeWithMilliseconds(
                                  video.startTime || 0,
                                  false,
                                  true,
                                  true,
                                )}
                              </div>
                              <div
                                className="absolute right-0 bottom-0 mr-1 mb-[2px] bg-[#033032] px-[3px] text-xs text-[11px] text-gray-100"
                                style={{
                                  display: coords.width < 16 ? "none" : "block",
                                }}
                              >
                                {formatTimeWithMilliseconds(
                                  (video.startTime || 0) + (video.duration || 0),
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

TimelineTrack.displayName = "VideoTrack"

export { TimelineTrack as VideoTrack }
