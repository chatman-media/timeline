import { memo, useCallback, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"

import { formatBitrate, formatDuration, formatTimeWithMilliseconds } from "@/lib/utils"
import { usePlayerContext } from "@/media-editor/media-player"
import { useDisplayTime } from "@/media-editor/media-player/contexts"
import { useTimeline } from "@/media-editor/timeline/services"
import { MediaFile, Track, VideoSegment } from "@/types/media"

import { YoloDataVisualization } from "./yolo-data-visualization"

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
  zoomLevel, // Используется в закомментированном логировании
}: VideoItemProps) {
  // Подавляем предупреждение о неиспользуемом параметре
  void zoomLevel
  const { t } = useTranslation()
  const {
    activeTrackId,
    setActiveTrack,
    setVideoRef,
    seek,
    tracks,
    setSectorTime,
    setActiveSector,
  } = useTimeline()
  const {
    video: activeVideo,
    setVideo: setActiveVideo,
    setVideoLoading,
    setVideoReady,
    setParallelVideos,
    setActiveVideoId,
    // parallelVideos, // Не используется в этом компоненте
    setPreferredSource,
    currentTime,
    // appliedTemplate, // Не используется в этом компоненте
    // setAppliedTemplate, // Не используется в этом компоненте
    lastAppliedTemplate,
    switchVideoSource,
  } = usePlayerContext()

  // Получаем displayTime и setDisplayTime из контекста displayTime
  const displayTimeContext = useDisplayTime()
  const { displayTime, setDisplayTime } = displayTimeContext

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

  // Получаем состояние блокировки дорожки из свойства трека
  const isTrackLocked = track.isLocked === true // По умолчанию разблокированный

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()

      // Если дорожка заблокирована, не обрабатываем клик
      if (isTrackLocked) {
        console.log(
          `[VideoItem] Дорожка ${track.id} заблокирована, клик по видео ${video.id} игнорируется`,
        )
        return
      }

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

        // Дополнительно устанавливаем preferredSource через глобальный объект
        // для гарантии обновления
        if (typeof window !== "undefined" && window.playerContext) {
          console.log(
            `[VideoItem] Дополнительно устанавливаем preferredSource через глобальный объект`,
          )
          window.playerContext.setPreferredSource("timeline")
        }

        // Проверяем, есть ли примененный шаблон или последний примененный шаблон
        if (lastAppliedTemplate) {
          console.log(
            `[VideoItem] Найден последний примененный шаблон, применяем его с видео из таймлайна`,
          )

          // Вызываем switchVideoSource для обновления видео в шаблоне
          // Это обновит шаблон с видео из таймлайна
          switchVideoSource(
            tracks,
            track.id,
            allParallelVideos.length > 1 ? allParallelVideos : [minimalVideo],
          )
        }

        // Устанавливаем активное видео (минимальную версию) для обратной совместимости
        console.log(
          `[VideoItem] Устанавливаем активное видео: ${minimalVideo.id} (${minimalVideo.name})`,
        )
        setActiveVideo(minimalVideo)

        // Проверяем, находится ли текущее время воспроизведения в пределах выбранного видео
        const videoStartTime = video.startTime || 0
        const videoEndTime = videoStartTime + (video.duration || 0)

        // Получаем относительное время для сравнения с границами видео
        // Для Unix timestamp (большие числа) используем displayTime
        let effectiveCurrentTime = currentTime
        if (currentTime > 365 * 24 * 60 * 60) {
          effectiveCurrentTime = displayTime
          console.log(
            `[VideoItem] Используем displayTime (${displayTime.toFixed(2)}) вместо currentTime (${currentTime.toFixed(2)}) для сравнения`,
          )
        }

        // Проверяем, находится ли относительное время в пределах видео
        // Для видео из таймлайна нужно сравнивать с абсолютным временем
        const isTimeInVideoRange =
          currentTime > 365 * 24 * 60 * 60
            ? displayTime >= 0 && displayTime <= (video.duration || 0)
            : currentTime >= videoStartTime && currentTime <= videoEndTime

        // Проверяем, есть ли параллельные видео с тем же startTime
        const hasParallelVideos = allParallelVideos.length > 1

        // Если время в пределах видео или есть параллельные видео, сохраняем текущее время
        if (isTimeInVideoRange || hasParallelVideos) {
          console.log(
            `[VideoItem] Сохраняем текущее время воспроизведения: ${effectiveCurrentTime.toFixed(2)} (в пределах видео ${videoStartTime.toFixed(2)}-${videoEndTime.toFixed(2)}, параллельные видео: ${hasParallelVideos})`,
          )

          // Если есть параллельные видео, но время не в пределах видео, устанавливаем время на начало видео
          if (hasParallelVideos && !isTimeInVideoRange) {
            console.log(
              `[VideoItem] Устанавливаем время на начало видео для параллельного видео: ${videoStartTime.toFixed(2)}`,
            )
            seek(videoStartTime)

            // ВАЖНО: Сначала отправляем событие SET_SECTOR_TIME с абсолютным временем,
            // затем устанавливаем displayTime в 0 и отправляем событие display-time-change
            // Это обеспечит, что бар будет установлен в начало видео

            // Получаем дату сектора из startTime видео
            const videoSectorDate = video.startTime
              ? new Date(video.startTime * 1000).toISOString().split("T")[0]
              : null

            // Рассчитываем относительное время для этого видео (0 - начало видео)
            const relativeTime = 0 // Всегда устанавливаем в начало видео при клике

            // 1. Сначала отправляем событие SET_SECTOR_TIME для установки времени сектора
            // Используем абсолютное время начала видео для правильного отображения на баре
            if (videoSectorDate) {
              setSectorTime(videoSectorDate, videoStartTime, true)
              console.log(
                `[VideoItem] Отправлено событие SET_SECTOR_TIME для сектора ${videoSectorDate} с абсолютным временем ${videoStartTime.toFixed(2)} (параллельное видео)`,
              )

              // Небольшая задержка перед установкой displayTime
              setTimeout(() => {
                // 2. Затем устанавливаем displayTime в 0
                // Обновляем displayTime для этого сектора через контекст
                if (displayTimeContext && displayTimeContext.setDisplayTime) {
                  // Передаем sectorId при вызове setDisplayTime
                  displayTimeContext.setDisplayTime(relativeTime, true, videoSectorDate)
                  console.log(
                    `[VideoItem] Обновлено displayTime для сектора ${videoSectorDate} через контекст (relativeTime=${relativeTime}, isActiveOnly=true, sectorId=${videoSectorDate})`,
                  )
                }

                // Также обновляем displayTime для синхронизации
                // Устанавливаем displayTime в 0, так как это относительное время от начала видео
                if (setDisplayTime) {
                  // Устанавливаем isActiveOnly=true и передаем sectorId, чтобы обновлять только этот сектор
                  setDisplayTime(relativeTime, true, videoSectorDate)
                  console.log(
                    `[VideoItem] Устанавливаем displayTime в ${relativeTime} для сектора ${videoSectorDate} (относительное время от начала параллельного видео, isActiveOnly=true)`,
                  )
                }

                // 3. Наконец, отправляем событие для обновления позиции бара
                if (typeof window !== "undefined" && window.dispatchEvent) {
                  window.dispatchEvent(
                    new CustomEvent("display-time-change", {
                      detail: {
                        time: relativeTime,
                        isActiveOnly: true,
                        sectorId: videoSectorDate,
                      },
                    }),
                  )
                  console.log(
                    `[VideoItem] Отправлено событие display-time-change с временем ${relativeTime} для сектора ${videoSectorDate} (параллельное видео)`,
                  )
                }
              }, 50) // Небольшая задержка для гарантии правильного порядка выполнения
            }

            // Отправляем событие для синхронизации воспроизведения всех параллельных видео
            if (window.dispatchEvent && typeof window.CustomEvent === "function") {
              window.dispatchEvent(
                new CustomEvent("sync-parallel-videos-playback", {
                  detail: { activeVideoId: video.id },
                }),
              )
              console.log(
                `[VideoItem] Отправлено событие sync-parallel-videos-playback для видео ${video.id}`,
              )
            }
          }
          // Иначе не меняем текущее время, так как оно уже находится в пределах видео
          else if (isTimeInVideoRange) {
            // Отправляем событие для синхронизации воспроизведения всех параллельных видео
            if (window.dispatchEvent && typeof window.CustomEvent === "function") {
              window.dispatchEvent(
                new CustomEvent("sync-parallel-videos-playback", {
                  detail: { activeVideoId: video.id },
                }),
              )
              console.log(
                `[VideoItem] Отправлено событие sync-parallel-videos-playback для видео ${video.id} (время в пределах видео)`,
              )
            }
          }
        } else {
          console.log(
            `[VideoItem] Устанавливаем время на начало видео: ${videoStartTime.toFixed(2)} (текущее время ${effectiveCurrentTime.toFixed(2)} вне пределов видео ${videoStartTime.toFixed(2)}-${videoEndTime.toFixed(2)})`,
          )
          // Устанавливаем время на начало видео
          seek(videoStartTime)

          // ВАЖНО: Сначала отправляем событие SET_SECTOR_TIME с абсолютным временем,
          // затем устанавливаем displayTime в 0 и отправляем событие display-time-change
          // Это обеспечит, что бар будет установлен в начало видео

          // Получаем дату сектора из startTime видео
          const videoSectorDate = video.startTime
            ? new Date(video.startTime * 1000).toISOString().split("T")[0]
            : null

          // Рассчитываем относительное время для этого видео (0 - начало видео)
          const relativeTime = 0 // Всегда устанавливаем в начало видео при клике

          // 1. Сначала отправляем событие SET_SECTOR_TIME для установки времени сектора
          // Используем абсолютное время начала видео для правильного отображения на баре
          if (videoSectorDate) {
            setSectorTime(videoSectorDate, videoStartTime, true)
            console.log(
              `[VideoItem] Отправлено событие SET_SECTOR_TIME для сектора ${videoSectorDate} с абсолютным временем ${videoStartTime.toFixed(2)}`,
            )

            // Небольшая задержка перед установкой displayTime
            setTimeout(() => {
              // 2. Затем устанавливаем displayTime в 0
              // Обновляем displayTime для этого сектора через контекст
              if (displayTimeContext && displayTimeContext.setDisplayTime) {
                // Передаем sectorId при вызове setDisplayTime
                displayTimeContext.setDisplayTime(relativeTime, true, videoSectorDate)
                console.log(
                  `[VideoItem] Обновлено displayTime для сектора ${videoSectorDate} через контекст (relativeTime=${relativeTime}, isActiveOnly=true, sectorId=${videoSectorDate})`,
                )
              }

              // Также обновляем displayTime для синхронизации
              // Устанавливаем displayTime в 0, так как это относительное время от начала видео
              if (setDisplayTime) {
                // Устанавливаем isActiveOnly=true и передаем sectorId, чтобы обновлять только этот сектор
                setDisplayTime(relativeTime, true, videoSectorDate)
                console.log(
                  `[VideoItem] Устанавливаем displayTime в ${relativeTime} для сектора ${videoSectorDate} (относительное время от начала видео, isActiveOnly=true)`,
                )
              }

              // 3. Наконец, отправляем событие для обновления позиции бара
              if (typeof window !== "undefined" && window.dispatchEvent) {
                window.dispatchEvent(
                  new CustomEvent("display-time-change", {
                    detail: {
                      time: relativeTime,
                      isActiveOnly: true,
                      sectorId: videoSectorDate,
                    },
                  }),
                )
                console.log(
                  `[VideoItem] Отправлено событие display-time-change с временем ${relativeTime} для сектора ${videoSectorDate}`,
                )
              }
            }, 50) // Небольшая задержка для гарантии правильного порядка выполнения
          }

          // Отправляем событие для синхронизации воспроизведения всех параллельных видео
          if (window.dispatchEvent && typeof window.CustomEvent === "function") {
            window.dispatchEvent(
              new CustomEvent("sync-parallel-videos-playback", {
                detail: { activeVideoId: video.id },
              }),
            )
            console.log(
              `[VideoItem] Отправлено событие sync-parallel-videos-playback для видео ${video.id}`,
            )
          }
        }

        // Обновляем позицию бара для текущего сектора
        // Получаем дату сектора из startTime видео
        const sectorDate = video.startTime
          ? new Date(video.startTime * 1000).toISOString().split("T")[0]
          : null

        // Если есть дата сектора, обновляем время сектора через машину состояний
        if (sectorDate) {
          // Используем абсолютное время начала видео для бара
          // Это обеспечит, что при клике на видео бар всегда будет показывать
          // абсолютное время начала этого видео (например, 12:43:23)
          const absoluteTime = videoStartTime

          // Рассчитываем относительное время для этого видео (0 - начало видео)
          const relativeTime = 0 // Всегда устанавливаем в начало видео при клике

          console.log(
            `[VideoItem] Устанавливаем время бара на абсолютное время начала видео: ${absoluteTime.toFixed(2)}`,
          )

          // Устанавливаем активный сектор
          console.log(`[VideoItem] Устанавливаем активный сектор: ${sectorDate}`)
          setActiveSector(sectorDate)

          // ВАЖНО: Сначала отправляем событие SET_SECTOR_TIME с абсолютным временем,
          // затем устанавливаем displayTime в 0 и отправляем событие display-time-change
          // Это обеспечит, что бар будет установлен в начало видео

          // 1. Сначала отправляем событие SET_SECTOR_TIME в машину состояний таймлайна
          // Используем абсолютное время для правильного отображения на баре
          setSectorTime(sectorDate, absoluteTime, true) // Изменяем false на true, чтобы обновить только активный сектор

          // Небольшая задержка перед установкой displayTime
          setTimeout(() => {
            // 2. Затем устанавливаем displayTime в 0
            // Обновляем displayTime для этого сектора через контекст
            if (displayTimeContext && displayTimeContext.setDisplayTime) {
              // Передаем sectorId при вызове setDisplayTime
              displayTimeContext.setDisplayTime(relativeTime, true, sectorDate)
              console.log(
                `[VideoItem] Обновлено displayTime для сектора ${sectorDate} через контекст (relativeTime=${relativeTime}, isActiveOnly=true, sectorId=${sectorDate})`,
              )
            }

            // Устанавливаем displayTime в 0, чтобы компонент useSectionTime мог установить бар в начало видео
            if (setDisplayTime) {
              // Получаем дату сектора из startTime видео
              const videoSectorDate = video.startTime
                ? new Date(video.startTime * 1000).toISOString().split("T")[0]
                : undefined

              // Устанавливаем isActiveOnly=true и передаем sectorId, чтобы обновлять только этот сектор
              setDisplayTime(relativeTime, true, videoSectorDate)
              console.log(
                `[VideoItem] Установлен displayTime в ${relativeTime} для видео ${video.id} в секторе ${videoSectorDate} (isActiveOnly=true)`,
              )
            }

            // 3. Наконец, отправляем событие для обновления позиции бара
            if (typeof window !== "undefined" && window.dispatchEvent) {
              window.dispatchEvent(
                new CustomEvent("display-time-change", {
                  detail: {
                    time: relativeTime,
                    isActiveOnly: true,
                    sectorId: sectorDate,
                  },
                }),
              )
              console.log(
                `[VideoItem] Отправлено событие display-time-change с временем ${relativeTime} для сектора ${sectorDate}`,
              )
            }
          }, 50) // Небольшая задержка для гарантии правильного порядка выполнения

          console.log(
            `[VideoItem] Отправлено событие SET_SECTOR_TIME для сектора ${sectorDate} с абсолютным временем ${absoluteTime.toFixed(2)}`,
          )
        }

        // Проверяем, загружено ли видео уже в кэше
        // Используем sessionStorage для кэширования загруженных видео
        const videoId = video.id || video.path
        const isVideoCached = sessionStorage.getItem(`video_cache_${videoId}`) === "true"

        if (isVideoCached) {
          console.log(`[VideoItem] Видео ${videoId} уже загружено в кэше, используем его`)
          setVideoReady(true)
          setVideoLoading(false)
        } else {
          // Создаем временный элемент для проверки готовности видео
          console.log(
            `[VideoItem] Создаем временный элемент для проверки готовности видео: ${video.path}`,
          )
          const tempVideo = document.createElement("video")
          tempVideo.src = video.path
          tempVideo.preload = "metadata"

          // Добавляем обработчик для отслеживания состояния загрузки
          tempVideo.onloadeddata = () => {
            console.log(`[VideoItem] Видео ${videoId} загружено успешно (loadeddata)`)
            // Сохраняем видео в кэше
            sessionStorage.setItem(`video_cache_${videoId}`, "true")
            setVideoReady(true)
            setVideoLoading(false)
          }

          tempVideo.onerror = (e) => {
            console.error(`[VideoItem] Ошибка загрузки видео ${videoId}:`, e)
            setVideoLoading(false)
          }

          // Если метаданные уже загружены, сразу вызываем обработчик
          if (tempVideo.readyState >= 1) {
            console.log(
              `[VideoItem] Метаданные видео ${videoId} уже загружены, readyState=${tempVideo.readyState}`,
            )
            // Сохраняем видео в кэше
            sessionStorage.setItem(`video_cache_${videoId}`, "true")
            setVideoReady(true)
            setVideoLoading(false)
          }

          // Устанавливаем флаг готовности видео через небольшую задержку
          // Это нужно для случаев, когда события загрузки не срабатывают корректно
          setTimeout(() => {
            setVideoReady(true)
            setVideoLoading(false)
          }, 500)
        }
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
      currentTime,
      displayTime,
      setDisplayTime, // Добавляем setDisplayTime в зависимости
      lastAppliedTemplate, // Добавляем lastAppliedTemplate в зависимости
      switchVideoSource, // Добавляем switchVideoSource в зависимости
      tracks, // Добавляем tracks в зависимости
      isTrackLocked, // Добавляем isTrackLocked в зависимость
      setActiveSector, // Добавляем setActiveSector в зависимость
      setSectorTime, // Добавляем setSectorTime в зависимость
      displayTimeContext, // Добавляем displayTimeContext в зависимость
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
    const parallelVideos: MediaFile[] = []

    // Создаем Set для отслеживания уже добавленных ID видео
    const addedVideoIds = new Set<string>()

    // Сначала добавляем текущее видео в список параллельных
    if (currentVideo.id) {
      parallelVideos.push(currentVideo)
      addedVideoIds.add(currentVideo.id)
    }

    // Ищем видео с тем же startTime на всех треках
    for (const t of allTracks) {
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

  // Всегда используем sectionStart как точку отсчета для всех дорожек
  // Это обеспечит выравнивание видео по времени на разных дорожках
  const referenceStart = sectionStart

  // Рассчитываем длительность секции
  // Используем длительность секции для расчета, чтобы видео соответствовало шкале времени
  const sectionDuration = track.sectionDuration || videoDuration

  // Логирование отключено для повышения производительности
  // console.log(`[VideoItem] ${video.name}: videoStart=${videoStart}, sectionStart=${sectionStart}, sectionDuration=${sectionDuration}`)

  // Рассчитываем позицию в процентах от ширины секции
  // Ограничиваем значения, чтобы видео всегда было видимым
  const leftPercent = Math.max(
    0,
    Math.min(100, ((videoStart - referenceStart) / sectionDuration) * 100),
  )

  // Рассчитываем ширину в процентах от ширины секции
  // Минимальная ширина 0.5% для видимости очень коротких видео
  const widthPercent = Math.max(0.5, Math.min(100, (videoDuration / sectionDuration) * 100))

  // Отключаем избыточное логирование для повышения производительности
  // Игнорируем неиспользуемый параметр zoomLevel

  // Логирование отключено для повышения производительности
  // console.log(
  //   `[VideoItem] ${video.name}: start=${videoStart}, duration=${videoDuration}, left=${leftPercent}%, width=${widthPercent}%`,
  // )
  // console.log(
  //   `[VideoItem] Параметры расчета: referenceStart=${referenceStart}, sectionDuration=${sectionDuration}`,
  // )

  // Используем ref для отслеживания последнего сохраненного времени
  const lastSavedTimeRef = useRef<number>(0)
  const lastSavedSectorRef = useRef<string | null>(null)
  const lastSaveAttemptTimeRef = useRef<number>(0)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isSavingRef = useRef<boolean>(false)

  // Функция для сохранения времени сектора с дебаунсингом
  const saveSectorTime = useCallback(
    (sectorDate: string, time: number) => {
      // Если уже идет сохранение, выходим
      if (isSavingRef.current) return

      // Устанавливаем флаг, что идет сохранение
      isSavingRef.current = true

      // Проверяем, изменилось ли время существенно (более 0.5 секунды)
      // или изменился сектор с момента последнего сохранения
      const timeDiff = Math.abs(time - lastSavedTimeRef.current)
      const isSectorChanged = lastSavedSectorRef.current !== sectorDate

      if (timeDiff > 0.5 || isSectorChanged) {
        // Обновляем последнее сохраненное время и сектор
        lastSavedTimeRef.current = time
        lastSavedSectorRef.current = sectorDate

        // Отправляем событие SET_SECTOR_TIME в машину состояний таймлайна
        // Устанавливаем isActiveOnly=true, чтобы обновлять только активный сектор
        setSectorTime(sectorDate, time, true)

        // Логируем только в режиме разработки и только при значительных изменениях
        if (process.env.NODE_ENV === "development") {
          console.log(
            `[VideoItem] Сохранено время ${time.toFixed(2)} для сектора ${sectorDate} при изменении displayTime (разница: ${timeDiff.toFixed(2)})`,
          )
        }
      }

      // Сбрасываем флаг сохранения после увеличенной задержки
      setTimeout(() => {
        isSavingRef.current = false
      }, 500) // Увеличиваем задержку до 500 мс
    },
    [setSectorTime],
  )

  // Добавляем эффект для обработки изменения времени при переключении видео
  useEffect(() => {
    // Если видео активно и есть displayTime, сохраняем его
    if (isActive && displayTime !== undefined && displayTime > 0) {
      // Получаем дату сектора из startTime видео
      const sectorDate = video.startTime
        ? new Date(video.startTime * 1000).toISOString().split("T")[0]
        : undefined

      // Если есть дата сектора, планируем сохранение времени для этого сектора
      if (sectorDate) {
        // Проверяем, прошло ли достаточно времени с последней попытки сохранения
        const now = Date.now()
        const timeSinceLastSaveAttempt = now - lastSaveAttemptTimeRef.current

        // Увеличиваем интервал между сохранениями до 500 мс
        if (timeSinceLastSaveAttempt < 500) return

        // Проверяем, изменилось ли время значительно
        const lastSavedTime = lastSavedTimeRef.current || 0
        const timeDiff = Math.abs(displayTime - lastSavedTime)

        // Сохраняем только если время изменилось значительно (более 0.5 секунды)
        if (timeDiff < 0.5) return

        // Обновляем время последней попытки сохранения
        lastSaveAttemptTimeRef.current = now

        // Очищаем предыдущий таймаут, если он был
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current)
          saveTimeoutRef.current = null
        }

        // Планируем сохранение с увеличенной задержкой
        saveTimeoutRef.current = setTimeout(() => {
          saveSectorTime(sectorDate, displayTime)
          saveTimeoutRef.current = null
        }, 300) // Увеличиваем задержку до 300 мс
      }
    }

    // Очищаем таймаут при размонтировании компонента
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = null
      }
    }
  }, [video.id, video.startTime, isActive, displayTime, saveSectorTime])

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
          {/* Добавляем компонент визуализации данных YOLO */}
          <YoloDataVisualization
            video={video}
            width={(widthPercent * window.innerWidth) / 100}
            height={50}
            className="opacity-70"
          />
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
