import { memo, useCallback, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"

import { formatBitrate, formatDuration, formatTimeWithMilliseconds } from "@/lib/utils"
import { usePlayerContext } from "@/media-editor/media-player"
import { useTimeline } from "@/media-editor/timeline/services"
import { MediaFile, Track, VideoSegment } from "@/types/media"

interface VideoItemProps {
  video: MediaFile
  segment?: VideoSegment
  track: Track
  sectionStart: number
  zoomLevel: number
  trackStartTime?: number
  trackEndTime?: number
}

export const VideoItem = memo(function VideoItem({
  video,
  track,
  sectionStart,
  zoomLevel,
  trackStartTime,
  trackEndTime,
}: VideoItemProps) {
  const { t } = useTranslation()
  const { activeTrackId, setActiveTrack, setVideoRef, seek, tracks } = useTimeline()
  const {
    video: activeVideo,
    setVideo: setActiveVideo,
    setVideoLoading,
    setVideoReady,
    setParallelVideos,
    setActiveVideoId,
    parallelVideos,
    setPreferredSource,
  } = usePlayerContext()

  // Функция для установки источника видео
  const setVideoSource = (videoId: string, source: "media" | "timeline"): void => {
    // Устанавливаем предпочтительный источник
    setPreferredSource(source)
    console.log(`[VideoItem] Установлен источник для видео ${videoId}: ${source}`)
  }

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
    source: "timeline", // Всегда устанавливаем источник как timeline для видео из таймлайна
  }

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      console.log(`[VideoItem] Клик по видео ${video.id} (${video.name})`)

      try {
        // Проверяем, не является ли видео уже активным, чтобы избежать лишних обновлений
        if (track.id === activeTrackId && activeVideo?.id === video.id) {
          console.log(`[VideoItem] Видео ${video.id} уже активно, пропускаем обработку клика`)
          return // Видео уже активно, не нужно ничего делать
        }

        // Устанавливаем активную дорожку
        console.log(`[VideoItem] Устанавливаем активную дорожку: ${track.id}`)
        setActiveTrack(track.id)

        // Устанавливаем состояние загрузки
        console.log(`[VideoItem] Устанавливаем состояние загрузки видео`)
        setVideoLoading(true)

        // Находим все параллельные видео (видео с того же времени, но с разных камер)
        // Для этого нам нужно найти все видео, которые имеют тот же startTime
        const allParallelVideos = findParallelVideos(video)

        // Если есть параллельные видео, устанавливаем их в контекст
        if (allParallelVideos.length > 1) {
          console.log(`[VideoItem] Найдено ${allParallelVideos.length} параллельных видео`)

          // Создаем минимальные версии всех параллельных видео
          const minimalParallelVideos = allParallelVideos.map((v) => ({
            id: v.id,
            name: v.name,
            path: v.path,
            duration: v.duration,
            startTime: v.startTime || 0,
            isVideo: true,
            isAudio: false,
            isImage: false,
            source: "timeline", // Всегда устанавливаем источник как timeline для видео из таймлайна
          }))

          // Удаляем дубликаты из массива параллельных видео
          const uniqueParallelVideos = minimalParallelVideos.filter(
            (video, index, self) => index === self.findIndex((v) => v.id === video.id),
          )

          if (uniqueParallelVideos.length !== minimalParallelVideos.length) {
            console.log(
              `[VideoItem] Удалены дубликаты из параллельных видео: ${minimalParallelVideos.length} -> ${uniqueParallelVideos.length}`,
            )
          }

          // Устанавливаем параллельные видео в контекст
          console.log(`[VideoItem] Устанавливаем параллельные видео в контекст`)
          setParallelVideos(uniqueParallelVideos)

          // Устанавливаем активное видео ID
          console.log(`[VideoItem] Устанавливаем активное видео ID: ${video.id}`)
          setActiveVideoId(video.id)

          // Устанавливаем источник для активного видео
          if (video.id && typeof setVideoSource === "function") {
            const source = "timeline" // Всегда устанавливаем источник как timeline для видео из таймлайна
            console.log(`[VideoItem] Устанавливаем источник для видео ${video.id}: ${source}`)
            setVideoSource(video.id, source)
          }

          console.log(
            `[VideoItem] Установлены параллельные видео:`,
            uniqueParallelVideos.map((v) => v.id).join(", "),
          )
        } else {
          // Если параллельных видео нет, используем стандартный подход
          console.log(`[VideoItem] Параллельных видео не найдено, используем стандартный подход`)
          setParallelVideos([minimalVideo])
          setActiveVideoId(video.id)
        }

        // Устанавливаем предпочтительный источник как timeline
        console.log(`[VideoItem] Устанавливаем предпочтительный источник: timeline`)
        setPreferredSource("timeline")

        // Устанавливаем активное видео (минимальную версию) для обратной совместимости
        console.log(
          `[VideoItem] Устанавливаем активное видео: ${minimalVideo.id} (${minimalVideo.name})`,
        )
        setActiveVideo(minimalVideo)

        // Всегда устанавливаем текущее время на начало видео
        const videoStartTime = video.startTime || 0
        console.log(`[VideoItem] Устанавливаем время на начало видео: ${videoStartTime}`)
        seek(videoStartTime)

        // Создаем временный элемент для проверки готовности видео
        console.log(
          `[VideoItem] Создаем временный элемент для проверки готовности видео: ${video.path}`,
        )
        const tempVideo = document.createElement("video")
        tempVideo.src = video.path
        tempVideo.preload = "metadata"

        // Добавляем обработчик для отслеживания состояния загрузки
        tempVideo.addEventListener("loadedmetadata", () => {
          console.log(`[VideoItem] Метаданные видео ${video.id} загружены`)
        })

        tempVideo.addEventListener("canplay", () => {
          console.log(`[VideoItem] Видео ${video.id} может воспроизводиться (canplay)`)
        })

        tempVideo.addEventListener("canplaythrough", () => {
          console.log(
            `[VideoItem] Видео ${video.id} может воспроизводиться без буферизации (canplaythrough)`,
          )
        })

        tempVideo.onloadeddata = () => {
          console.log(`[VideoItem] Видео ${video.id} загружено успешно (loadeddata)`)
          setVideoReady(true)
          setVideoLoading(false)
        }

        tempVideo.onerror = (e) => {
          console.error(`[VideoItem] Ошибка загрузки видео ${video.id}:`, e)
          setVideoLoading(false)
        }

        // Если метаданные уже загружены, сразу вызываем обработчик
        if (tempVideo.readyState >= 1) {
          console.log(
            `[VideoItem] Метаданные видео ${video.id} уже загружены, readyState=${tempVideo.readyState}`,
          )
          setVideoReady(true)
          setVideoLoading(false)
        }

        // Принудительно устанавливаем флаг готовности видео через небольшую задержку
        // Это нужно для случаев, когда события загрузки не срабатывают корректно
        setTimeout(() => {
          console.log(`[VideoItem] Принудительно устанавливаем флаг готовности видео ${video.id}`)
          setVideoReady(true)
          setVideoLoading(false)

          // Повторно проверяем через дополнительную задержку
          setTimeout(() => {
            console.log(`[VideoItem] Повторная проверка готовности видео ${video.id}`)
            setVideoReady(true)
            setVideoLoading(false)
          }, 1000)
        }, 500)
      } catch (error) {
        console.error("[VideoItem] Ошибка при обработке клика:", error)
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
      setParallelVideos,
      setActiveVideoId,
      setVideoSource,
      setPreferredSource,
      video.id,
      video.name,
    ],
  )

  // Функция для поиска параллельных видео (видео с того же времени, но с разных камер)
  const findParallelVideos = (currentVideo: MediaFile): MediaFile[] => {
    // Если нет startTime, возвращаем только текущее видео
    if (currentVideo.startTime === undefined) {
      return [currentVideo]
    }

    // Используем треки, которые уже получены на верхнем уровне компонента
    // Это избегает вызова хука внутри функции
    const allTracks = tracks

    // Массив для хранения параллельных видео
    const parallelVideos: MediaFile[] = [currentVideo]

    // Создаем Set для отслеживания уже добавленных ID видео
    const addedVideoIds = new Set<string>([currentVideo.id])

    // Ищем видео с тем же startTime на других треках
    for (const t of allTracks) {
      // Пропускаем текущий трек
      if (t.id === activeTrackId) continue

      // Ищем видео с тем же startTime на этом треке
      const matchingVideos =
        t.videos?.filter(
          (v: MediaFile) =>
            v.startTime !== undefined &&
            Math.abs(v.startTime - (currentVideo.startTime || 0)) < 1 && // Допускаем разницу в 1 секунду
            v.id &&
            !addedVideoIds.has(v.id), // Проверяем, что видео еще не добавлено
        ) || []

      // Добавляем найденные видео в массив и отмечаем их ID как добавленные
      for (const video of matchingVideos) {
        if (video.id) {
          // Помечаем видео как видео из таймлайна, так как оно имеет startTime
          if (video.startTime !== undefined) {
            // Здесь мы не можем напрямую вызвать setVideoSource, так как это не хук
            // Но мы можем пометить видео как из таймлайна через свойство
            // @ts-ignore - добавляем свойство source динамически
            video.source = "timeline"
          }

          addedVideoIds.add(video.id)
          parallelVideos.push(video)
        }
      }
    }

    console.log(
      `[findParallelVideos] Найдено ${parallelVideos.length} уникальных параллельных видео для ${currentVideo.id}`,
    )

    return parallelVideos
  }

  // Рассчитываем позицию и ширину видео
  const videoStart = video.startTime || 0
  const videoDuration = video.duration || 0

  // Если указаны границы трека, используем их для расчета позиции
  const referenceStart = trackStartTime !== undefined ? trackStartTime : sectionStart

  // Рассчитываем позицию в процентах относительно видимого диапазона
  // Используем длительность секции для расчета, чтобы видео соответствовало шкале времени
  const trackEndTimeValue = trackEndTime || 0
  const sectionDuration =
    trackEndTimeValue && trackStartTime ? trackEndTimeValue - trackStartTime : videoDuration

  // Рассчитываем позицию в процентах от ширины секции
  const leftPercent = ((videoStart - referenceStart) / sectionDuration) * 100

  // Рассчитываем ширину в процентах от ширины секции
  const widthPercent = (videoDuration / sectionDuration) * 100

  // Логируем расчеты для отладки
  console.log(
    `[VideoItem] ${video.name}: start=${videoStart}, duration=${videoDuration}, left=${leftPercent}%, width=${widthPercent}%, zoomLevel=${zoomLevel}`,
  )
  console.log(
    `[VideoItem] Параметры расчета: referenceStart=${referenceStart}, sectionDuration=${sectionDuration}`,
  )

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
        left: `${leftPercent}%`,
        width: `${widthPercent}%`,
        height: "70px",
        top: "0px",
        overflow: "hidden",
        cursor: "pointer",
        zIndex: isActive ? 10 : 1,
        opacity: 1, // Полная непрозрачность для видеосегмента
        pointerEvents: "auto", // Убедимся, что клики обрабатываются
      }}
      onClick={handleClick}
    >
      <div className="relative h-full w-full">
        <div
          className="video-metadata m-0 flex h-full w-full flex-row items-start justify-between truncate rounded border border-gray-800 py-[3px] text-xs text-white shadow-md hover:border-gray-100 dark:border-gray-800 dark:hover:border-gray-100"
          style={{
            backgroundColor: isActive ? "#0a6066" : "#005a5e",
            lineHeight: "13px",
            boxShadow: isActive
              ? "0 0 10px rgba(255, 255, 255, 0.5)"
              : "0 2px 4px rgba(0, 0, 0, 0.3)",
          }}
        >
          <span className="mr-1 rounded px-1 text-xs whitespace-nowrap dark:bg-[#033032]">
            {video.probeData?.streams[0]?.codec_type === "audio"
              ? t("timeline.tracks.audioWithNumber", {
                number: track.index,
                defaultValue: `Audio ${track.index}`,
              })
              : t("timeline.tracks.videoWithNumber", {
                number: track.index,
                defaultValue: `Video ${track.index}`,
              })}
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
            display: widthPercent < 5 ? "none" : "block",
          }}
        >
          {formatTimeWithMilliseconds(video.startTime || 0, false, true, true)}
        </div>
        <div
          className="absolute right-0 bottom-0 mr-1 mb-[2px] bg-[#033032] px-[3px] text-xs text-[11px] text-gray-100"
          style={{
            display: widthPercent < 5 ? "none" : "block",
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
