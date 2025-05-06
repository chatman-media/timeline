import { memo, useCallback, useEffect, useRef } from "react"

import { formatBitrate, formatDuration, formatTimeWithMilliseconds } from "@/lib/utils"
import { usePlayerContext } from "@/media-editor/media-player"
import { useTimeline } from "@/media-editor/timeline/services"
import { MediaFile, Track, VideoSegment } from "@/types/media"

/**
 * Получает название камеры для отображения
 * @param track - Трек, к которому принадлежит видео
 * @returns Строка с названием камеры
 */
function getCameraDisplayName(track: Track): string {
  // Если у трека есть пользовательское название камеры, используем его
  if (track.cameraName) {
    return track.cameraName
  }

  // Извлекаем номер из имени трека (например, "Камера 1" -> "1")
  const match = track.name?.match(/Камера\s+(\d+)/i)
  if (match && match[1]) {
    return `Камера ${match[1]}`
  }

  // Если не удалось извлечь номер, используем имя трека или "Камера"
  return track.name || "Камера"
}

interface VideoItemProps {
  video: MediaFile
  segment?: VideoSegment
  track: Track
  sectionStart: number
  zoomLevel: number
}

export const VideoItem = memo(function VideoItem({
  video,
  track,
  sectionStart,
  zoomLevel,
}: VideoItemProps) {
  const { activeTrackId, setActiveTrack, setVideoRef, seek } = useTimeline()
  const {
    video: activeVideo,
    setVideo: setActiveVideo,
    setVideoLoading,
    setVideoReady,
  } = usePlayerContext()

  // Создаем реф для видео элемента
  const videoElementRef = useRef<HTMLVideoElement | null>(null)

  // Определяем, активно ли текущее видео
  const isActive = track.id === activeTrackId && activeVideo?.id === video.id

  // Регистрируем видео элемент в контексте таймлайна только когда видео активно
  useEffect(() => {
    // Регистрируем только если видео активно и элемент существует
    if (isActive && videoElementRef.current) {
      setVideoRef(video.id, videoElementRef.current)
    }

    return () => {
      // Очищаем ссылку при размонтировании или деактивации
      if (isActive) {
        setVideoRef(video.id, null)
      }
    }
  }, [video.id, setVideoRef, isActive])

  // Создаем минимальную версию видео для передачи в плеер
  const minimalVideo = {
    id: video.id,
    name: video.name,
    path: video.path,
    duration: video.duration,
    startTime: video.startTime || 0,
    isVideo: true,
    isAudio: false,
    isImage: false,
  }

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()

      try {
        // Проверяем, не является ли видео уже активным, чтобы избежать лишних обновлений
        if (track.id === activeTrackId && activeVideo?.id === video.id) {
          return // Видео уже активно, не нужно ничего делать
        }

        // Устанавливаем активную дорожку
        setActiveTrack(track.id)

        // Устанавливаем состояние загрузки
        setVideoLoading(true)

        // Устанавливаем активное видео (минимальную версию)
        setActiveVideo(minimalVideo)

        // Всегда устанавливаем текущее время на начало видео
        const videoStartTime = video.startTime || 0
        console.log(`[VideoItem] Устанавливаем время на начало видео: ${videoStartTime}`)
        seek(videoStartTime)

        // Создаем временный элемент для проверки готовности видео
        const tempVideo = document.createElement("video")
        tempVideo.src = video.path
        tempVideo.preload = "metadata"

        tempVideo.onloadeddata = () => {
          setVideoReady(true)
          setVideoLoading(false)
        }

        tempVideo.onerror = () => {
          setVideoLoading(false)
        }

        // Если метаданные уже загружены, сразу вызываем обработчик
        if (tempVideo.readyState >= 1) {
          setVideoReady(true)
          setVideoLoading(false)
        }
      } catch (error) {
        setVideoLoading(false)
      }
    },
    [
      setActiveTrack,
      setActiveVideo,
      setVideoLoading,
      setVideoReady,
      track.id,
      activeTrackId,
      activeVideo?.id,
      seek,
      minimalVideo,
    ],
  )

  // Рассчитываем позицию и ширину видео
  const videoStart = video.startTime || 0
  const videoDuration = video.duration || 0
  const left = (videoStart - sectionStart) * 2 * zoomLevel
  const width = videoDuration * 2 * zoomLevel

  // Отключаем эффект для логирования активного состояния для повышения производительности
  // useEffect(() => {
  //   if (isActive) {
  //     console.log(`Video ${video.id} (${video.name}) is active`);
  //   }
  // }, [isActive, video.id, video.name]);

  return (
    <div
      key={video.id}
      className={`absolute ${isActive ? "border-2 border-white shadow-lg" : ""}`}
      style={{
        left: `${left}px`,
        width: `${width}px`,
        height: "70px",
        top: "0px",
        overflow: "hidden",
        cursor: "pointer",
        zIndex: isActive ? 10 : 1,
        opacity: 1, // Полная непрозрачность для видеосегмента
      }}
      onClick={handleClick}
    >
      <div className="relative h-full w-full border-r border-gray-600 last:border-r-0">
        <div
          className="video-metadata m-0 flex h-full w-full flex-row items-start justify-between truncate rounded border border-gray-800 p-1 py-[3px] text-xs text-white shadow-md hover:border-gray-100 dark:border-gray-800 dark:hover:border-gray-100"
          style={{
            backgroundColor: isActive ? "#0a6066" : "#005a5e",
            lineHeight: "13px",
            boxShadow: isActive
              ? "0 0 10px rgba(255, 255, 255, 0.5)"
              : "0 2px 4px rgba(0, 0, 0, 0.3)",
          }}
        >
          <span className="mr-1 rounded px-1 text-xs whitespace-nowrap dark:bg-[#033032]">
            {video.probeData?.streams[0]?.codec_type === "audio" ? "Аудио" : "Видео"} {track.index}
          </span>
          <span className="mr-1 max-w-[120px] truncate rounded bg-[#033032] px-1 whitespace-nowrap">
            {getCameraDisplayName(track)}
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

                    if (!isNaN(width) && !isNaN(height) && width > 0 && height > 0) {
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
                  (video.probeData?.streams[0]?.width && video.probeData?.streams[0]?.height)) && (
                  <span className="mr-1">
                    {(() => {
                      // Форматируем соотношение сторон в более понятную форму
                      let aspectRatio = video.probeData.streams[0].display_aspect_ratio

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
                        const [numerator, denominator] = fpsRaw.split("/").map(Number)
                        if (denominator && numerator) {
                          // Округляем до 2 знаков после запятой
                          const fps = Math.round((numerator / denominator) * 100) / 100
                          return `${fps} fps`
                        }
                      }
                      // Если формат не распознан, просто показываем как есть
                      return `${fpsRaw} fps`
                    })()}
                  </span>
                )}
                {video.duration !== undefined && (
                  <span>{video.duration > 0 ? formatDuration(video.duration, 3) : ""}</span>
                )}
              </div>
            ) : (
              <div className="video-metadata flex flex-row truncate bg-[#033032] px-1 text-xs text-white">
                {video.probeData?.streams[0]?.codec_name && (
                  <span className="mr-1 font-medium">{video.probeData.streams[0].codec_name}</span>
                )}
                {video.probeData?.streams[0]?.channels && (
                  <span className="mr-1">каналов: {video.probeData.streams[0].channels}</span>
                )}
                {video.probeData?.streams[0]?.sample_rate && (
                  <span className="mr-1">
                    {Math.round(Number(video.probeData.streams[0].sample_rate) / 1000)}
                    kHz
                  </span>
                )}
                {video.probeData?.streams[0]?.bit_rate && (
                  <span className="mr-1">
                    {formatBitrate(Number(video.probeData.streams[0].bit_rate))}
                  </span>
                )}
                {video.duration !== undefined && (
                  <span>{video.duration > 0 ? formatDuration(video.duration, 3) : ""}</span>
                )}
              </div>
            )}
          </div>
        </div>
        <div
          className="absolute bottom-0 left-0 mb-[2px] ml-1 bg-[#033032] px-[3px] text-xs text-[11px] text-gray-100"
          style={{
            display: width < 16 ? "none" : "block",
          }}
        >
          {formatTimeWithMilliseconds(video.startTime || 0, false, true, true)}
        </div>
        <div
          className="absolute right-0 bottom-0 mr-1 mb-[2px] bg-[#033032] px-[3px] text-xs text-[11px] text-gray-100"
          style={{
            display: width < 16 ? "none" : "block",
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

      {/* Скрытый видео элемент для регистрации в контексте - загружаем только при активации */}
      {isActive && (
        <video
          ref={videoElementRef}
          src={video.path}
          style={{ display: "none" }}
          preload="metadata"
          onLoadedMetadata={() => {
            // Убираем лишние логи для повышения производительности
            // console.log(`Video ${video.id} metadata loaded`);
          }}
        />
      )}
    </div>
  )
})

VideoItem.displayName = "VideoItem"
