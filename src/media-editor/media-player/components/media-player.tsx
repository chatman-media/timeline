import React, { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { AspectRatio } from "@/components/ui/aspect-ratio"
import { usePlayerContext } from "@/media-editor/media-player"
import { PlayerControls } from "@/media-editor/media-player/components/player-controls"
import { ResizableTemplate } from "@/media-editor/media-player/components/resizable-template"
import { ResizableVideo } from "@/media-editor/media-player/components/resizable-video"
import { useDisplayTime } from "@/media-editor/media-player/contexts"
import {
  getVideoStyleForTemplate,
  VideoTemplateStyle,
} from "@/media-editor/media-player/services/template-service"
import { useProject } from "@/media-editor/project-settings/project-provider"
import { useTimeline } from "@/media-editor/timeline/services"
import { MediaFile } from "@/types/media"

export function MediaPlayer() {
  // Для локализации
  const { t, i18n } = useTranslation()

  // Используем состояние для хранения текста, чтобы избежать проблем с гидратацией
  const [noVideoText, setNoVideoText] = useState("")

  // Состояние для отслеживания готовности видео
  const [videoReadyState, setVideoReadyState] = useState<Record<string, number>>({})

  // Функция для проверки готовности видео
  const isVideoReady = (videoId: string): boolean => {
    return videoReadyState[videoId] >= 3 // HAVE_FUTURE_DATA или HAVE_ENOUGH_DATA
  }

  // Функция для определения источника видео из машины состояний
  const getVideoSource = (videoId: string): "media" | "timeline" | null => {
    // Используем videoSources из машины состояний
    return videoSources[videoId] || null
  }

  // Обновляем текст при изменении языка
  useEffect(() => {
    setNoVideoText(t("timeline.player.noVideoSelected"))
  }, [t, i18n.language])

  // Массив для хранения refs контейнеров видео
  const videoContainerRefs = useRef<Record<string, React.RefObject<HTMLDivElement | null>>>({})
  const {
    video,
    isPlaying,
    setIsPlaying,
    duration,
    isSeeking,
    setIsSeeking,
    setCurrentTime,
    currentTime,
    isChangingCamera,
    setIsChangingCamera,
    isRecording,
    setIsRecording,
    videoRefs,
    parallelVideos,
    setParallelVideos,
    appliedTemplate,
    volume,
    setVolume,
    preferredSource,
    setVideoReady, // Добавляем функцию setVideoReady
    setVideoLoading, // Добавляем функцию setVideoLoading
    videoSources, // Получаем videoSources из машины состояний
    updateVideoSources, // Получаем функцию для обновления источников видео
  } = usePlayerContext()

  // Получаем displayTime из контекста
  const { displayTime, setDisplayTime } = useDisplayTime()

  // Получаем настройки проекта
  const { settings } = useProject()

  // Получаем контекст таймлайна
  const timelineContext = useTimeline()

  // Создаем совместимость с глобальной переменной sectorTimes
  // Это временное решение, пока не обновим все места использования
  const sectorTimes: Record<string, number> = {}

  // Синхронизируем sectorTimes с timelineContext.sectorTimes
  useEffect(() => {
    if (timelineContext?.sectorTimes) {
      // Копируем значения из контекста таймлайна в глобальную переменную
      Object.keys(timelineContext.sectorTimes).forEach((key) => {
        sectorTimes[key] = timelineContext.sectorTimes[key]
      })

      console.log(
        `[MediaPlayer] Синхронизированы времена секторов из контекста таймлайна:`,
        Object.keys(timelineContext.sectorTimes)
          .map((key) => `${key}: ${timelineContext.sectorTimes[key].toFixed(2)}`)
          .join(", "),
      )
    }
  }, [timelineContext?.sectorTimes])

  // Вычисляем соотношение сторон из настроек проекта
  const [aspectRatio, setAspectRatio] = useState({
    width: settings.aspectRatio.value.width,
    height: settings.aspectRatio.value.height,
  })

  // Обновляем соотношение сторон при изменении настроек проекта
  useEffect(() => {
    setAspectRatio({
      width: settings.aspectRatio.value.width,
      height: settings.aspectRatio.value.height,
    })
  }, [settings.aspectRatio])

  // Используем ref для отслеживания последнего значения громкости
  const lastVolumeRef = useRef(volume)
  // Используем ref для отслеживания времени последнего обновления громкости
  const lastVolumeUpdateTimeRef = useRef(0)

  // Эффект для обработки изменения громкости
  useEffect(() => {
    // Если нет видео или рефов, выходим
    if (!videoRefs) return

    // Проверяем, изменилась ли громкость с последнего обновления
    if (Math.abs(lastVolumeRef.current - volume) < 0.01) {
      return // Пропускаем обновление при незначительных изменениях
    }

    // Проверяем, прошло ли достаточно времени с последнего обновления
    const now = performance.now()
    if (now - lastVolumeUpdateTimeRef.current < 100) {
      return // Ограничиваем частоту обновлений
    }

    // Обновляем время последнего обновления
    lastVolumeUpdateTimeRef.current = now
    // Сохраняем новое значение громкости
    lastVolumeRef.current = volume

    // Активное видео ID уже доступно через video?.id

    // Если используется шаблон с несколькими видео, применяем громкость ко всем видео
    if (appliedTemplate?.template && parallelVideos.length > 0) {
      // Создаем массив уникальных видео для обновления громкости
      const uniqueVideos = parallelVideos.filter(
        (v, i, arr) => arr.findIndex((item) => item.id === v.id) === i,
      )

      uniqueVideos.forEach((parallelVideo) => {
        if (parallelVideo.id && videoRefs[parallelVideo.id]) {
          const videoElement = videoRefs[parallelVideo.id]

          // Устанавливаем громкость для всех видео в шаблоне
          videoElement.volume = volume
          videoElement.muted = false
          // Уменьшаем количество логов
          if (Math.abs(videoElement.volume - volume) > 0.1) {
            console.log(
              `[Volume] Установлена громкость ${volume} для видео ${parallelVideo.id} в шаблоне`,
            )
          }
        }
      })
    }
    // Если нет шаблона, применяем громкость только к активному видео
    else if (video?.id && videoRefs[video.id]) {
      // Получаем элемент видео
      const videoElement = videoRefs[video.id]

      // Устанавливаем громкость только если она действительно изменилась
      if (Math.abs(videoElement.volume - volume) > 0.01) {
        videoElement.volume = volume

        // Логируем только значительные изменения громкости
        if (Math.abs(videoElement.volume - volume) > 0.1) {
          console.log(`[Volume] Установлена громкость ${volume} для видео ${video.id}`)
        }
      }
    }

    // Сохранение в localStorage перенесено в компонент player-controls.tsx
  }, [video, videoRefs, volume, appliedTemplate, parallelVideos])

  // Используем ref для хранения последнего времени обновления, чтобы избежать слишком частых обновлений
  const lastUpdateTimeRef = useRef(0)
  // Последнее отправленное время - для хранения относительного прогресса
  const lastSentTimeRef = useRef(0)
  // Определяем, короткое ли видео (меньше 10 секунд)
  const isShortVideo = useRef(false)
  const videoStartTime = useRef(0)
  // Сохраняем ID текущего видео для предотвращения цикличности
  const currentVideoIdRef = useRef<string | null>(null)
  // Базовая метка времени для нормализации Unix timestamp
  const baseTimestampRef = useRef<number | null>(null)
  // Флаг инициализации для предотвращения сброса времени
  const isInitializedRef = useRef(false)
  // Используем ref для отслеживания предыдущего значения isChangingCamera
  const prevIsChangingCameraRef = useRef(false)

  // Рефы для эффекта обработки изменения состояния воспроизведения
  const isHandlingPlayPauseEffectRef = useRef(false)
  const lastPlayPauseEffectTimeRef = useRef(0)

  // Используем ref для отслеживания последнего обработанного видео и его пути
  const lastProcessedVideoRef = useRef<{ id: string | null; path: string | null }>({
    id: null,
    path: null,
  })

  // Эффект для обработки изменения видео
  useEffect(() => {
    if (!video?.id || !video?.path) return

    // Проверяем, не обрабатывали ли мы уже это видео
    if (
      lastProcessedVideoRef.current.id === video.id &&
      lastProcessedVideoRef.current.path === video.path
    ) {
      return
    }

    // Обновляем информацию о последнем обработанном видео
    lastProcessedVideoRef.current = { id: video.id, path: video.path }

    // Проверяем, изменилось ли видео с прошлого рендера
    const isVideoChanged = currentVideoIdRef.current !== video.id

    if (isVideoChanged) {
      console.log(
        `[MediaPlayer] Видео изменилось: ${currentVideoIdRef.current || "none"} -> ${video.id}`,
      )
    }

    // Сохраняем ID текущего видео
    currentVideoIdRef.current = video.id

    // Получаем или создаем видео элемент
    let videoElement = videoRefs[video.id]

    // Если видео элемента нет или он был удален из DOM, создаем новый
    if (!videoElement || !document.body.contains(videoElement)) {
      console.log(
        `[MediaPlayer] Создаем новый видео элемент для ${video.id} в эффекте изменения видео`,
      )

      // Создаем видео элемент программно
      videoElement = document.createElement("video")
      videoElement.id = `video-${video.id}`
      videoElement.preload = "auto"
      videoElement.playsInline = true
      videoElement.controls = false
      videoElement.autoplay = false
      videoElement.loop = false
      videoElement.muted = false
      videoElement.volume = volume
      videoElement.src = video.path

      // Добавляем элемент в DOM (скрытый)
      videoElement.style.position = "absolute"
      videoElement.style.width = "1px"
      videoElement.style.height = "1px"
      videoElement.style.opacity = "0"
      videoElement.style.pointerEvents = "none"
      document.body.appendChild(videoElement)

      // Сохраняем ссылку на элемент
      videoRefs[video.id] = videoElement

      // Добавляем видео элемент в глобальный реестр для отслеживания
      allVideoElementsRef.current.add(videoElement)
      console.log(
        `[MediaPlayer] Добавлен видео элемент в глобальный реестр: ${video.id}, всего элементов: ${allVideoElementsRef.current.size}`,
      )

      // Определяем источник видео
      const source = video.startTime !== undefined ? "timeline" : "media"

      // Обновляем источники видео в машине состояний
      const newVideoSources: Record<string, "media" | "timeline"> = { ...videoSources }
      newVideoSources[video.id] = source
      updateVideoSources(newVideoSources)

      console.log(
        `[MediaPlayer] Установлен источник для нового видео ${video.id}: ${source}, startTime=${video.startTime}`,
      )
    } else {
      console.log(`[MediaPlayer] Используем существующий видео элемент для ${video.id}`)

      // Обновляем источник для существующего видео
      const source = video.startTime !== undefined ? "timeline" : "media"
      const currentSource = getVideoSource(video.id)

      // Если источник изменился, обновляем его
      if (currentSource !== source) {
        console.log(
          `[MediaPlayer] Обновляем источник для видео ${video.id}: ${currentSource} -> ${source}`,
        )

        // Обновляем источники видео в машине состояний
        const newVideoSources: Record<string, "media" | "timeline"> = { ...videoSources }
        newVideoSources[video.id] = source
        updateVideoSources(newVideoSources)
      }
    }

    // Проверяем, что src установлен правильно
    if (videoElement && video.path) {
      const currentSource = getVideoSource(video.id)
      const isTimelineVideo = currentSource === "timeline" || video.startTime !== undefined

      // Принудительно обновляем src для видео из таймлайна или если src не установлен
      if (isTimelineVideo || !videoElement.src || !videoElement.src.includes(video.id)) {
        console.log(`[MediaPlayer] Обновляем src для видео ${video.id}: ${video.path}`)
        console.log(
          `[MediaPlayer] Источник видео: ${currentSource || "не определен"}, startTime=${video.startTime}`,
        )

        // Сохраняем текущее время и состояние воспроизведения
        const currentTime = videoElement.currentTime
        const wasPlaying = !videoElement.paused

        // Обновляем src
        videoElement.src = video.path
        videoElement.load()

        // Восстанавливаем время и состояние воспроизведения
        if (currentTime > 0) {
          videoElement.currentTime = currentTime
        }

        if (wasPlaying) {
          videoElement
            .play()
            .catch((e) =>
              console.error(`[MediaPlayer] Ошибка воспроизведения видео ${video.id}:`, e),
            )
        }
      } else {
        console.log(`[MediaPlayer] Видео ${video.id} уже имеет правильный src: ${videoElement.src}`)
        console.log(
          `[MediaPlayer] Источник видео: ${currentSource || "не определен"}, startTime=${video.startTime}`,
        )
      }
    }

    // Добавляем обработчик события loadedmetadata
    if (videoElement) {
      const handleLoadedMetadata = () => {
        console.log(`[MediaPlayer] Загружены метаданные для видео ${video.id}`)

        // Устанавливаем время воспроизведения
        if (videoTimesRef.current[video.id] !== undefined) {
          // Используем сохраненное время для этого видео
          videoElement.currentTime = videoTimesRef.current[video.id]
          console.log(
            `[MediaPlayer] Устанавливаем сохраненное время для видео ${video.id}: ${videoTimesRef.current[video.id].toFixed(3)}`,
          )
        } else if (video.startTime) {
          // Для видео из таймлайна учитываем startTime
          videoElement.currentTime = Math.max(0, currentTime - (video.startTime || 0))
          console.log(
            `[MediaPlayer] Устанавливаем время с учетом startTime для видео ${video.id}: ${videoElement.currentTime.toFixed(3)}`,
          )
        } else {
          // Для видео из браузера используем текущее время
          videoElement.currentTime = currentTime
          console.log(
            `[MediaPlayer] Устанавливаем текущее время для видео ${video.id}: ${currentTime.toFixed(3)}`,
          )
        }

        // Устанавливаем громкость
        videoElement.volume = volume

        // Сбрасываем флаг isChangingCamera после загрузки метаданных
        if (isChangingCamera) {
          setIsChangingCamera(false)
        }

        // Если нужно воспроизвести видео и оно не воспроизводится
        if (isPlaying && !isChangingCamera && videoElement.paused) {
          console.log(`[MediaPlayer] Воспроизводим видео ${video.id} после загрузки метаданных`)
          videoElement.play().catch((err) => {
            if (err.name !== "AbortError") {
              console.error(
                `[MediaPlayer] Ошибка при воспроизведении видео ${video.id} после загрузки метаданных:`,
                err,
              )
            }
          })
        }
      }

      // Добавляем обработчик ошибок
      const handleError = () => {
        console.error(`[MediaPlayer] Ошибка загрузки видео ${video.id}`)

        // Сбрасываем флаги при ошибке
        if (isChangingCamera) {
          setIsChangingCamera(false)
        }
        if (isPlaying) {
          setIsPlaying(false)
        }
      }

      // Добавляем обработчик canplay для воспроизведения, если видео еще не готово
      const handleCanPlay = () => {
        console.log(`[MediaPlayer] Видео ${video.id} готово к воспроизведению (canplay)`)

        // Если нужно воспроизвести видео и оно не воспроизводится
        if (isPlaying && !isChangingCamera && videoElement.paused) {
          console.log(`[MediaPlayer] Воспроизводим видео ${video.id} после события canplay`)
          videoElement.play().catch((err) => {
            if (err.name !== "AbortError") {
              console.error(
                `[MediaPlayer] Ошибка при воспроизведении видео ${video.id} после canplay:`,
                err,
              )
            }
          })
        }

        // Удаляем обработчик после первого срабатывания
        videoElement.removeEventListener("canplay", handleCanPlay)
      }

      videoElement.addEventListener("loadedmetadata", handleLoadedMetadata)
      videoElement.addEventListener("error", handleError)
      videoElement.addEventListener("canplay", handleCanPlay)

      // Принудительно запускаем загрузку метаданных
      videoElement.load()

      return () => {
        videoElement.removeEventListener("loadedmetadata", handleLoadedMetadata)
        videoElement.removeEventListener("error", handleError)
        videoElement.removeEventListener("canplay", handleCanPlay)
      }
    }
  }, [video?.id, video?.path, currentTime, volume, isChangingCamera, isPlaying])

  // Используем ref для хранения времени для каждого видео
  const videoTimesRef = useRef<Record<string, number>>({})

  // Создаем глобальный реестр всех видео элементов для отслеживания
  // Это поможет остановить все экземпляры видео при паузе
  const allVideoElementsRef = useRef<Set<HTMLVideoElement>>(new Set())

  // Используем ref для отслеживания последнего синхронизированного времени
  const lastSyncedTimesRef = useRef<Record<string, number>>({})

  // Ref для отслеживания предыдущего активного сектора
  const prevActiveSectorRef = useRef<string | null>(null)

  // Ref для отслеживания обновления шаблона, чтобы избежать бесконечных циклов
  const isUpdatingTemplateRef = useRef(false)

  // Эффект для синхронизации времени сектора из контекста таймлайна
  // и обновления шаблона при изменении сектора
  useEffect(() => {
    // Получаем текущий сектор
    const currentSector = timelineContext?.activeSector
    if (!currentSector) return

    // Получаем сохраненное время для текущего сектора
    const sectorId = currentSector.id
    const sectorTime = timelineContext?.sectorTimes?.[sectorId]

    // Проверяем, изменился ли сектор
    const isSectorChanged = prevActiveSectorRef.current !== sectorId

    // Обновляем ref с текущим сектором
    prevActiveSectorRef.current = sectorId

    // Если сектор изменился и есть примененный шаблон, обновляем видео в шаблоне
    // Также проверяем, что мы не находимся в процессе обновления шаблона
    if (isSectorChanged && appliedTemplate?.template && preferredSource === "timeline" && !isUpdatingTemplateRef.current) {
      // Устанавливаем флаг, что мы обновляем шаблон
      isUpdatingTemplateRef.current = true;
      console.log(`[MediaPlayer] Сектор изменился, обновляем видео в шаблоне`)

      // Получаем все видео из текущего сектора
      const sectorVideos: MediaFile[] = []

      if (currentSector.tracks) {
        currentSector.tracks.forEach((track) => {
          if (track.videos && track.videos.length > 0) {
            console.log(`[MediaPlayer] Добавляем ${track.videos.length} видео из трека ${track.id}`)
            sectorVideos.push(...track.videos)
          }
        })
      }

      if (sectorVideos.length > 0) {
        console.log(`[MediaPlayer] Найдено ${sectorVideos.length} видео в секторе ${sectorId}`)

        // Проверяем, нужно ли обновлять шаблон
        // Если видео в шаблоне уже из этого сектора, не обновляем
        const currentTemplateVideoIds = appliedTemplate.videos?.map((v) => v.id) || []
        const screensCount = appliedTemplate.template?.screens || 1

        // Берем только первые N видео из сектора, где N - количество экранов в шаблоне
        const relevantSectorVideos = sectorVideos.slice(0, screensCount)
        const sectorVideoIds = relevantSectorVideos.map((v) => v.id)

        // Проверяем, совпадают ли видео в шаблоне с видео из сектора
        // Шаблон нужно обновить, если:
        // 1. Количество видео в шаблоне не соответствует количеству экранов или доступных видео
        // 2. Видео в шаблоне не соответствуют видео из сектора
        const countMismatch =
          currentTemplateVideoIds.length !== Math.min(screensCount, relevantSectorVideos.length)
        const contentMismatch = !sectorVideoIds.every(
          (id, index) => currentTemplateVideoIds[index] === id,
        )
        const needsUpdate = countMismatch || contentMismatch

        console.log(`[MediaPlayer] Текущие видео в шаблоне: ${currentTemplateVideoIds.join(", ")}`)
        console.log(`[MediaPlayer] Видео из сектора: ${sectorVideoIds.join(", ")}`)
        console.log(`[MediaPlayer] Количество экранов в шаблоне: ${screensCount}`)

        if (countMismatch) {
          console.log(
            `[MediaPlayer] Несоответствие количества видео: ${currentTemplateVideoIds.length} в шаблоне, требуется ${Math.min(screensCount, relevantSectorVideos.length)}`,
          )
        }

        if (contentMismatch) {
          console.log(`[MediaPlayer] Несоответствие содержимого видео в шаблоне и секторе`)
        }

        if (needsUpdate) {
          console.log(
            `[MediaPlayer] Требуется обновление шаблона, видео в шаблоне не соответствуют текущему сектору`,
          )

          // Создаем копию шаблона
          const templateCopy = { ...appliedTemplate }

          // Заполняем шаблон видео из сектора
          templateCopy.videos = relevantSectorVideos.map((video) => ({
            ...video,
            source: "timeline", // Явно устанавливаем источник как timeline
          }))

          console.log(
            `[MediaPlayer] Обновляем шаблон с ${templateCopy.videos.length} видео из сектора ${sectorId}`,
          )

          // Применяем обновленный шаблон с небольшой задержкой
          setTimeout(() => {
            setAppliedTemplate(templateCopy)

            // Если есть видео в шаблоне, устанавливаем первое как активное
            if (templateCopy.videos.length > 0 && templateCopy.videos[0].id) {
              setActiveVideoId(templateCopy.videos[0].id)
              setVideo(templateCopy.videos[0])
              console.log(`[MediaPlayer] Установлено активное видео: ${templateCopy.videos[0].id}`)
            }

            // Сбрасываем флаг обновления шаблона
            isUpdatingTemplateRef.current = false
          }, 300)
        } else {
          console.log(
            `[MediaPlayer] Шаблон уже содержит актуальные видео из текущего сектора, обновление не требуется`,
          )

          // Сбрасываем флаг обновления шаблона
          isUpdatingTemplateRef.current = false
        }
      } else {
        // Сбрасываем флаг обновления шаблона, если нет видео в секторе
        isUpdatingTemplateRef.current = false
      }
    }

    if (sectorId && sectorTime !== undefined) {
      // Проверяем, не синхронизировали ли мы уже это время
      if (lastSyncedTimesRef.current[sectorId] === sectorTime) {
        return
      }

      // Сохраняем время синхронизации
      lastSyncedTimesRef.current[sectorId] = sectorTime

      console.log(
        `[MediaPlayer] Получено время ${sectorTime.toFixed(2)} для сектора ${sectorId} из контекста таймлайна`,
      )

      // Если у нас есть активное видео, устанавливаем его время
      if (video?.id && videoRefs[video.id]) {
        const videoElement = videoRefs[video.id]

        // Сохраняем время для видео
        videoTimesRef.current[video.id] = sectorTime

        // Устанавливаем время для видео
        videoElement.currentTime = sectorTime

        // Обновляем displayTime для синхронизации с таймлайн баром
        if (setDisplayTime) {
          setDisplayTime(sectorTime)
        }

        console.log(
          `[MediaPlayer] Установлено время ${sectorTime.toFixed(2)} для видео ${video.id} из контекста таймлайна`,
        )
      }
    }
  }, [
    video,
    videoRefs,
    setDisplayTime,
    timelineContext?.activeSector,
    timelineContext?.sectorTimes,
    appliedTemplate,
    preferredSource,
  ])

  // Эффект для логирования всех времен секторов из контекста таймлайна
  useEffect(() => {
    if (!timelineContext?.sectorTimes) return

    // Логируем все времена секторов
    const sectorTimesLog = Object.entries(timelineContext.sectorTimes)
      .map(([sectorId, time]) => `${sectorId}: ${time.toFixed(2)}`)
      .join(", ")

    console.log(
      `[MediaPlayer] Синхронизированы времена секторов из контекста таймлайна: ${sectorTimesLog}`,
    )
  }, [timelineContext?.sectorTimes])

  // Функция для остановки всех видео элементов
  // Используем ref для отслеживания времени последней остановки
  const lastPauseTimeRef = useRef(0)

  // Оптимизированная функция для остановки всех видео с дебаунсингом
  const pauseAllVideos = useCallback(() => {
    // Используем дебаунсинг для предотвращения слишком частых вызовов
    const now = Date.now()
    const timeSinceLastPause = now - lastPauseTimeRef.current

    // Если прошло менее 200мс с последней остановки, пропускаем
    if (timeSinceLastPause < 200) {
      console.log(`[MediaPlayer] Пропускаем остановку всех видео (слишком частый вызов)`)
      return
    }

    // Обновляем время последней остановки
    lastPauseTimeRef.current = now

    console.log(
      `[MediaPlayer] Останавливаем все видео элементы (${allVideoElementsRef.current.size})`,
    )

    // Создаем Set для отслеживания уже остановленных видео
    const pausedVideos = new Set<string>()

    // Перебираем все видео элементы в реестре
    allVideoElementsRef.current.forEach((videoElement) => {
      try {
        // Проверяем, что элемент существует, находится в DOM и воспроизводится
        if (videoElement && document.body.contains(videoElement) && !videoElement.paused) {
          // Сохраняем текущее время видео перед паузой
          if (videoElement.id) {
            const videoId = videoElement.id.replace("video-", "")

            // Проверяем, не останавливали ли мы уже это видео
            if (pausedVideos.has(videoId)) {
              return
            }

            // Добавляем ID в Set остановленных видео
            pausedVideos.add(videoId)

            const currentVideoTime = videoElement.currentTime
            videoTimesRef.current[videoId] = currentVideoTime
            console.log(
              `[MediaPlayer] Сохраняем время для видео ${videoId} перед глобальной паузой: ${currentVideoTime.toFixed(3)}`,
            )
          }

          // Останавливаем видео
          videoElement.pause()
        }
      } catch (error) {
        console.error("[MediaPlayer] Ошибка при остановке видео:", error)
      }
    })

    // Дополнительно останавливаем все видео элементы на странице, но только если это необходимо
    // Это гарантирует, что даже если видео не было добавлено в реестр, оно будет остановлено
    try {
      const allVideoElements = document.querySelectorAll("video")

      // Проверяем, есть ли воспроизводящиеся видео
      let hasPlayingVideos = false
      allVideoElements.forEach((videoElement) => {
        if (videoElement && !videoElement.paused) {
          hasPlayingVideos = true
        }
      })

      // Если нет воспроизводящихся видео, пропускаем
      if (!hasPlayingVideos) {
        return
      }

      console.log(
        `[MediaPlayer] Дополнительно останавливаем все видео элементы на странице (${allVideoElements.length})`,
      )

      allVideoElements.forEach((videoElement) => {
        if (videoElement && document.body.contains(videoElement) && !videoElement.paused) {
          // Получаем ID видео
          const videoId = videoElement.id ? videoElement.id.replace("video-", "") : "unknown"

          // Проверяем, не останавливали ли мы уже это видео
          if (pausedVideos.has(videoId)) {
            return
          }

          // Добавляем ID в Set остановленных видео
          pausedVideos.add(videoId)

          console.log(`[MediaPlayer] Останавливаем видео элемент: ${videoId}`)

          // Останавливаем видео
          videoElement.pause()
        }
      })
    } catch (error) {
      console.error("[MediaPlayer] Ошибка при остановке всех видео на странице:", error)
    }
  }, [])

  useEffect(() => {
    if (!video?.id) return

    const videoElement = videoRefs[video.id]
    if (!videoElement) return

    // Проверяем, изменилось ли видео
    const isVideoChanged = currentVideoIdRef.current !== video.id
    if (isVideoChanged) {
      console.log(`[MediaPlayer] Видео изменилось: ${currentVideoIdRef.current} -> ${video.id}`)

      // Если у нас было предыдущее видео, сохраняем его время
      if (currentVideoIdRef.current) {
        const prevVideoElement = videoRefs[currentVideoIdRef.current]
        if (prevVideoElement) {
          // Сохраняем текущее время предыдущего видео
          const currentVideoTime = prevVideoElement.currentTime
          videoTimesRef.current[currentVideoIdRef.current] = currentVideoTime
          console.log(
            `[MediaPlayer] Сохраняем время для видео ${currentVideoIdRef.current}: ${currentVideoTime.toFixed(3)}`,
          )

          // Также сохраняем время для текущего сектора, если он есть
          if (currentSectorRef.current) {
            sectorTimes[currentSectorRef.current] = currentVideoTime

            // Обновляем время в контексте таймлайна
            if (timelineContext) {
              timelineContext.seek(currentVideoTime)
            }

            console.log(
              `[MediaPlayer] Сохраняем время для сектора ${currentSectorRef.current}: ${currentVideoTime.toFixed(3)}`,
            )
          }

          // Обновляем displayTime для синхронизации с таймлайн баром
          if (setDisplayTime && currentVideoTime > 0) {
            setDisplayTime(currentVideoTime)
            console.log(
              `[MediaPlayer] Обновляем displayTime при смене видео: ${currentVideoTime.toFixed(3)}`,
            )
          }
        }
      }

      // Сохраняем ID текущего видео
      currentVideoIdRef.current = video.id

      // Сбрасываем флаг инициализации при смене видео
      isInitializedRef.current = false

      // Проверяем, есть ли сохраненное время для нового видео
      if (videoTimesRef.current[video.id] !== undefined) {
        // Используем сохраненное время для этого видео
        lastSentTimeRef.current = videoTimesRef.current[video.id]
        console.log(
          `[MediaPlayer] Восстанавливаем сохраненное время для видео ${video.id}: ${lastSentTimeRef.current.toFixed(3)}`,
        )

        // Обновляем displayTime для синхронизации с таймлайн баром
        if (setDisplayTime && lastSentTimeRef.current > 0) {
          setDisplayTime(lastSentTimeRef.current)
          console.log(
            `[MediaPlayer] Обновляем displayTime при восстановлении времени видео: ${lastSentTimeRef.current.toFixed(3)}`,
          )
        }
      }
      // Если нет сохраненного времени для видео, проверяем сохраненное время для сектора
      else if (currentSectorRef.current && sectorTimes[currentSectorRef.current] !== undefined) {
        // Используем сохраненное время для текущего сектора
        lastSentTimeRef.current = sectorTimes[currentSectorRef.current]
        console.log(
          `[MediaPlayer] Восстанавливаем сохраненное время для сектора ${currentSectorRef.current}: ${lastSentTimeRef.current.toFixed(3)}`,
        )

        // Сохраняем это время для текущего видео
        videoTimesRef.current[video.id] = lastSentTimeRef.current

        // Обновляем displayTime для синхронизации с таймлайн баром
        if (setDisplayTime && lastSentTimeRef.current > 0) {
          setDisplayTime(lastSentTimeRef.current)
          console.log(
            `[MediaPlayer] Обновляем displayTime при восстановлении времени сектора: ${lastSentTimeRef.current.toFixed(3)}`,
          )
        }
      }
      // Проверяем, есть ли параллельные видео
      else if (parallelVideos && parallelVideos.length > 1) {
        // Если есть параллельные видео, сохраняем текущее время
        console.log(
          `[MediaPlayer] Найдены параллельные видео (${parallelVideos.length}), сохраняем текущее время: ${lastSentTimeRef.current.toFixed(3)}`,
        )

        // Сохраняем текущее время для нового видео
        videoTimesRef.current[video.id] = lastSentTimeRef.current

        // Также сохраняем время для текущего сектора, если он есть
        if (currentSectorRef.current) {
          sectorTimes[currentSectorRef.current] = lastSentTimeRef.current
          console.log(
            `[MediaPlayer] Сохраняем время для сектора ${currentSectorRef.current}: ${lastSentTimeRef.current.toFixed(3)}`,
          )
        }

        // Обновляем displayTime для синхронизации с таймлайн баром
        if (setDisplayTime && lastSentTimeRef.current > 0) {
          setDisplayTime(lastSentTimeRef.current)
          console.log(
            `[MediaPlayer] Обновляем displayTime для параллельных видео: ${lastSentTimeRef.current.toFixed(3)}`,
          )
        }
      } else {
        // Если нет сохраненного времени и нет параллельных видео, начинаем с начала
        console.log(
          `[MediaPlayer] Нет сохраненного времени для видео ${video.id} и сектора ${currentSectorRef.current}, начинаем с начала`,
        )
        lastSentTimeRef.current = 0

        // Сбрасываем displayTime
        if (setDisplayTime) {
          setDisplayTime(0)
          console.log(
            `[MediaPlayer] Сбрасываем displayTime в 0 при отсутствии сохраненного времени`,
          )
        }
      }

      // Сбрасываем флаг воспроизведения при смене видео, чтобы избежать автоматического воспроизведения
      if (isPlaying) {
        console.log(`[MediaPlayer] Приостанавливаем воспроизведение при смене видео`)
        setIsPlaying(false)
      }
    }

    // Определяем, короткое ли у нас видео
    isShortVideo.current = (duration || 0) < 10

    // Нормализуем startTime - если это Unix timestamp, преобразуем в относительное время
    const rawStartTime = video.startTime || 0
    // Если startTime больше года в секундах, это, вероятно, Unix timestamp
    if (rawStartTime > 365 * 24 * 60 * 60) {
      // Используем первое видео как точку отсчета
      if (baseTimestampRef.current === null) {
        baseTimestampRef.current = rawStartTime
        videoStartTime.current = 0
        console.log(`[MediaPlayer] Установлена базовая метка времени: ${baseTimestampRef.current}`)
      } else {
        // Вычисляем относительное время от базовой метки
        // Если разница слишком большая (больше суток), считаем это новой базовой меткой
        const timeDiff = rawStartTime - baseTimestampRef.current
        if (Math.abs(timeDiff) > 24 * 60 * 60) {
          console.log(
            `[MediaPlayer] Обнаружена новая базовая метка времени: ${rawStartTime} (старая: ${baseTimestampRef.current})`,
          )
          baseTimestampRef.current = rawStartTime
          videoStartTime.current = 0
        } else {
          videoStartTime.current = timeDiff
          console.log(
            `[MediaPlayer] Относительное startTime: ${videoStartTime.current.toFixed(3)} (от базы ${baseTimestampRef.current})`,
          )
        }
      }
    } else {
      // Если это уже относительное время, используем как есть
      videoStartTime.current = rawStartTime
    }

    // Для видео из таймлайна всегда устанавливаем флаг готовности
    // Проверяем наличие startTime для определения источника
    if (video.startTime && video.startTime > 0) {
      console.log(
        `[MediaPlayer] Видео ${video.id} из таймлайна (startTime=${video.startTime}), устанавливаем флаг готовности`,
      )
      // Используем функции из контекста плеера для установки флагов
      setVideoReady(true)
      setVideoLoading(false)
    }

    // Оптимизированный обработчик timeupdate для плавного обновления timeline bar
    const onTimeUpdate = (): void => {
      // Проверяем, что видео не изменилось
      if (currentVideoIdRef.current !== video.id) return

      // Проверяем время с последнего обновления, чтобы не вызывать слишком частые изменения состояния
      const now = performance.now()
      // Увеличиваем порог до 200мс для уменьшения частоты обновлений
      if (now - lastUpdateTimeRef.current < 200) return

      // Обновляем currentTime только если не идет перемотка (внутренняя или внешняя)
      // и не меняется камера
      if (!videoElement.seeking && !isChangingCamera && !isSeeking) {
        // Получаем текущее локальное время видео
        const localVideoTime = videoElement.currentTime

        // Если текущее глобальное время - Unix timestamp, обрабатываем особым образом
        if (currentTime > 365 * 24 * 60 * 60) {
          // Обновляем displayTime в контексте для синхронизации с TimelineBar
          // Всегда обновляем displayTime при каждом событии timeupdate
          // Это необходимо для плавного движения таймлайн бара
          setDisplayTime(localVideoTime)

          // Логируем только при существенном изменении времени, чтобы не засорять консоль
          if (Math.abs(localVideoTime - displayTime) > 0.1) {
            console.log(
              `[MediaPlayer] Обновлен displayTime в контексте: ${localVideoTime.toFixed(3)}, старое значение: ${displayTime.toFixed(3)}`,
            )
          }

          // Сохраняем относительный прогресс (без учета startTime)
          const relativeProgress = localVideoTime

          // Проверяем валидность времени
          if (isFinite(relativeProgress) && !isNaN(relativeProgress) && relativeProgress >= 0) {
            // Увеличиваем порог разницы времени для уменьшения частоты обновлений
            const timeDiffThreshold = 0.2 // 200мс

            // Проверяем, изменилось ли время с последнего отправленного значения
            // Используем только если lastSentTimeRef не содержит Unix timestamp
            const validLastSentTime = lastSentTimeRef.current < 100000 ? lastSentTimeRef.current : 0
            const timeDiff = Math.abs(relativeProgress - validLastSentTime)

            if (timeDiff > timeDiffThreshold) {
              // Для отладки - показываем только значительные изменения
              if (timeDiff > 1) {
                console.log(
                  `[MediaPlayer] Обновление относительного прогресса: ${validLastSentTime.toFixed(3)} -> ${relativeProgress.toFixed(3)}`,
                )
              }

              // Устанавливаем флаг инициализации при первом обновлении прогресса
              if (!isInitializedRef.current && relativeProgress > 0) {
                isInitializedRef.current = true
                console.log(`[MediaPlayer] Инициализация прогресса: ${relativeProgress.toFixed(3)}`)
              }

              // Сохраняем относительный прогресс в ref для сравнения
              lastUpdateTimeRef.current = now
              lastSentTimeRef.current = relativeProgress

              // Сохраняем время для текущего видео
              videoTimesRef.current[video.id] = relativeProgress

              // НЕ обновляем глобальное время (currentTime), чтобы не сбросить Unix timestamp
            }
          }
        } else {
          // Стандартная обработка для обычного времени
          const newTime = localVideoTime + videoStartTime.current

          // Проверяем валидность времени (объединяем проверки для оптимизации)
          if (
            !isFinite(newTime) ||
            isNaN(newTime) ||
            newTime < 0.001 ||
            newTime > 100 * 365 * 24 * 60 * 60
          ) {
            // Не обновляем состояние при некорректном времени, просто игнорируем
            return
          }

          // Проверяем, что время не выходит за пределы видео
          const videoEndTime = videoStartTime.current + (duration || 0)
          if (newTime > videoEndTime) {
            setCurrentTime(videoEndTime)
            lastUpdateTimeRef.current = now
            lastSentTimeRef.current = videoEndTime
            return
          }

          // Увеличиваем порог разницы времени для уменьшения частоты обновлений
          const timeDiffThreshold = 0.2 // 200мс

          // Проверяем, изменилось ли время с последнего отправленного значения
          const timeDiff = Math.abs(newTime - lastSentTimeRef.current)
          if (timeDiff > timeDiffThreshold) {
            // Обновляем время для плавного движения timeline bar
            setCurrentTime(newTime)
            lastUpdateTimeRef.current = now
            lastSentTimeRef.current = newTime

            // Сохраняем локальное время для текущего видео
            videoTimesRef.current[video.id] = videoElement.currentTime
          }
        }
      }
    }

    const handleError = (e: ErrorEvent): void => {
      console.error("Video playback error:", e)
      setIsPlaying(false)
    }

    // Добавляем оптимизированный слушатель
    videoElement.addEventListener("timeupdate", onTimeUpdate)
    videoElement.addEventListener("error", handleError)

    const playVideo = async (): Promise<void> => {
      try {
        // Проверяем, что видео элемент все еще существует и доступен
        if (!videoElement || !document.body.contains(videoElement)) {
          console.log("[PlayVideo] Видео элемент не найден или удален из DOM")

          // Если видео элемента нет, но есть путь к видео, создаем его
          if (video?.id && video?.path && !videoRefs[video.id]) {
            console.log(`[PlayVideo] Создаем новый видео элемент для ${video.id}`)

            // Создаем видео элемент программно
            const newVideoElement = document.createElement("video")
            newVideoElement.id = `video-${video.id}`
            newVideoElement.preload = "auto"
            newVideoElement.playsInline = true
            newVideoElement.controls = false
            newVideoElement.autoplay = false
            newVideoElement.loop = false
            newVideoElement.muted = false
            newVideoElement.volume = volume
            newVideoElement.src = video.path

            // Добавляем элемент в DOM (скрытый)
            newVideoElement.style.position = "absolute"
            newVideoElement.style.width = "1px"
            newVideoElement.style.height = "1px"
            newVideoElement.style.opacity = "0"
            newVideoElement.style.pointerEvents = "none"
            document.body.appendChild(newVideoElement)

            // Сохраняем ссылку на элемент
            videoRefs[video.id] = newVideoElement

            // Добавляем видео элемент в глобальный реестр для отслеживания
            allVideoElementsRef.current.add(newVideoElement)
            console.log(
              `[PlayVideo] Добавлен новый видео элемент в глобальный реестр: ${video.id}, всего элементов: ${allVideoElementsRef.current.size}`,
            )

            // Добавляем обработчик события loadedmetadata
            const handleLoadedMetadata = () => {
              console.log(`[PlayVideo] Загружены метаданные для нового видео ${video.id}`)

              // Устанавливаем время воспроизведения
              if (videoTimesRef.current[video.id] !== undefined) {
                newVideoElement.currentTime = videoTimesRef.current[video.id]
                console.log(
                  `[PlayVideo] Установлено сохраненное время ${videoTimesRef.current[video.id].toFixed(3)} для нового видео ${video.id}`,
                )
              } else if (currentTime > 0 && currentTime < 100000) {
                newVideoElement.currentTime = currentTime
                console.log(
                  `[PlayVideo] Установлено текущее время ${currentTime.toFixed(3)} для нового видео ${video.id}`,
                )
              }

              // Если нужно воспроизвести видео и оно не воспроизводится
              if (isPlaying && !isChangingCamera && newVideoElement.paused) {
                console.log(
                  `[PlayVideo] Воспроизводим новое видео ${video.id} после загрузки метаданных`,
                )
                newVideoElement.play().catch((err) => {
                  if (err.name !== "AbortError") {
                    console.error(
                      `[PlayVideo] Ошибка при воспроизведении нового видео ${video.id}:`,
                      err,
                    )
                  }
                })
              }

              newVideoElement.removeEventListener("loadedmetadata", handleLoadedMetadata)
            }

            newVideoElement.addEventListener("loadedmetadata", handleLoadedMetadata)

            // Добавляем обработчик ошибок
            const handleError = () => {
              console.error(`[PlayVideo] Ошибка загрузки нового видео ${video.id}`)
              newVideoElement.removeEventListener("error", handleError)
            }

            newVideoElement.addEventListener("error", handleError)

            // Принудительно запускаем загрузку
            newVideoElement.load()

            return
          }

          // Пробуем получить элемент снова через небольшую задержку
          setTimeout(() => {
            // Проверяем, что видео ID не изменился с момента запуска таймера
            if (video?.id !== currentVideoIdRef.current) {
              console.log(
                `[PlayVideo] ID видео изменился с момента запуска таймера, пропускаем повторную попытку`,
              )
              return
            }

            // Проверяем наличие элемента в DOM двумя способами
            let refreshedElement = videoRefs[video.id]

            // Если элемент не найден в videoRefs, пробуем найти его по ID в DOM
            if (!refreshedElement || !document.body.contains(refreshedElement)) {
              const domElement = document.getElementById(`video-${video.id}`)
              if (domElement && domElement instanceof HTMLVideoElement) {
                console.log(`[PlayVideo] Найден видео элемент ${video.id} в DOM, но не в videoRefs`)
                refreshedElement = domElement
                // Обновляем ссылку в videoRefs
                videoRefs[video.id] = domElement
              }
            }

            if (refreshedElement && document.body.contains(refreshedElement)) {
              console.log("[PlayVideo] Повторная попытка воспроизведения после задержки")

              // Проверяем, что src установлен правильно
              if (
                video.path &&
                (!refreshedElement.src || !refreshedElement.src.includes(video.id))
              ) {
                console.log(
                  `[PlayVideo] Устанавливаем src для видео ${video.id} перед повторной попыткой: ${video.path}`,
                )
                refreshedElement.src = video.path
                refreshedElement.load()

                // Добавляем обработчик для запуска воспроизведения после загрузки
                const handleCanPlay = () => {
                  if (isPlaying && !isChangingCamera) {
                    console.log(`[PlayVideo] Запускаем воспроизведение после загрузки src`)
                    refreshedElement.play().catch((err) => {
                      if (err.name !== "AbortError") {
                        console.error("[PlayVideo] Ошибка при воспроизведении после загрузки:", err)
                      }
                    })
                  }
                  refreshedElement.removeEventListener("canplay", handleCanPlay)
                }

                refreshedElement.addEventListener("canplay", handleCanPlay, { once: true })

                // Устанавливаем таймаут на случай, если событие canplay не сработает
                setTimeout(() => {
                  refreshedElement.removeEventListener("canplay", handleCanPlay)
                  if (isPlaying && !isChangingCamera && refreshedElement.paused) {
                    console.log(`[PlayVideo] Запускаем воспроизведение после таймаута`)
                    refreshedElement.play().catch((err) => {
                      if (err.name !== "AbortError") {
                        console.error("[PlayVideo] Ошибка при воспроизведении после таймаута:", err)
                      }
                    })
                  }
                }, 3000) // Увеличиваем таймаут для более надежной работы
              } else if (isPlaying && !isChangingCamera) {
                refreshedElement.play().catch((err) => {
                  if (err.name !== "AbortError") {
                    console.error("[PlayVideo] Ошибка при повторной попытке:", err)
                  }
                })
              }
            } else {
              console.error(
                `[PlayVideo] Видео элемент ${video.id} не найден после повторной попытки`,
              )

              // Если элемент все еще не найден, пробуем создать его
              if (video?.id && video?.path) {
                console.log(
                  `[PlayVideo] Создаем новый видео элемент для ${video.id} после неудачной повторной попытки`,
                )

                // Создаем видео элемент программно (аналогично коду выше)
                const newVideoElement = document.createElement("video")
                newVideoElement.id = `video-${video.id}`
                newVideoElement.preload = "auto"
                newVideoElement.playsInline = true
                newVideoElement.controls = false
                newVideoElement.autoplay = false
                newVideoElement.loop = false
                newVideoElement.muted = false
                newVideoElement.volume = volume
                newVideoElement.src = video.path

                // Добавляем элемент в DOM
                newVideoElement.style.position = "absolute"
                newVideoElement.style.width = "1px"
                newVideoElement.style.height = "1px"
                newVideoElement.style.opacity = "0"
                newVideoElement.style.pointerEvents = "none"
                document.body.appendChild(newVideoElement)

                // Сохраняем ссылку на элемент
                videoRefs[video.id] = newVideoElement

                // Добавляем в глобальный реестр
                allVideoElementsRef.current.add(newVideoElement)

                // Добавляем обработчик для запуска воспроизведения после загрузки
                const handleCanPlay = () => {
                  if (isPlaying && !isChangingCamera) {
                    console.log(
                      `[PlayVideo] Запускаем воспроизведение нового элемента после загрузки`,
                    )
                    newVideoElement.play().catch((err) => {
                      if (err.name !== "AbortError") {
                        console.error(
                          "[PlayVideo] Ошибка при воспроизведении нового элемента:",
                          err,
                        )
                      }
                    })
                  }
                  newVideoElement.removeEventListener("canplay", handleCanPlay)
                }

                newVideoElement.addEventListener("canplay", handleCanPlay, { once: true })

                // Загружаем видео
                newVideoElement.load()

                // Запускаем еще одну попытку через дополнительную задержку
                setTimeout(() => {
                  // Проверяем, что видео ID не изменился
                  if (video?.id !== currentVideoIdRef.current) return

                  if (isPlaying && !isChangingCamera && newVideoElement.paused) {
                    console.log(`[PlayVideo] Финальная попытка воспроизведения для ${video.id}`)
                    newVideoElement.play().catch((err) => {
                      if (err.name !== "AbortError") {
                        console.error("[PlayVideo] Ошибка при финальной попытке:", err)
                      }
                    })
                  }
                }, 2000)
              }
            }
          }, 1000) // Увеличиваем задержку для более надежной повторной попытки

          return
        }

        // Проверяем, что видео ID не изменился
        if (video.id !== currentVideoIdRef.current) {
          console.log("[PlayVideo] ID видео изменился, пропускаем воспроизведение")
          return
        }

        if (isPlaying) {
          // Устанавливаем локальное время для видео (без учета startTime)
          let localTime = currentTime

          // Если у нас Unix timestamp, используем сохраненное время для этого видео
          if (currentTime > 365 * 24 * 60 * 60) {
            // Если displayTime доступен из контекста и был недавно обновлен, используем его
            if (displayTime !== undefined && displayTime > 0) {
              localTime = displayTime
              console.log(
                `[PlayVideo] Используем displayTime из контекста: ${localTime.toFixed(3)}`,
              )

              // Сохраняем время для этого видео
              videoTimesRef.current[video.id] = localTime
            }
            // Проверяем, есть ли сохраненное время для этого видео
            else if (videoTimesRef.current[video.id] !== undefined) {
              // Используем сохраненное время для этого видео
              localTime = videoTimesRef.current[video.id]
              console.log(
                `[PlayVideo] Используем сохраненное время для видео ${video.id}: ${localTime.toFixed(3)}`,
              )
            }
            // Если нет сохраненного времени для видео, проверяем lastSentTimeRef
            else if (
              isInitializedRef.current &&
              lastSentTimeRef.current > 0 &&
              lastSentTimeRef.current < 100000
            ) {
              // Используем lastSentTimeRef для восстановления прогресса воспроизведения
              // Но только если это разумное значение (не Unix timestamp)
              localTime = lastSentTimeRef.current
              console.log(`[PlayVideo] Используем сохраненный прогресс: ${localTime.toFixed(3)}`)

              // Сохраняем время для этого видео
              videoTimesRef.current[video.id] = localTime
            } else {
              // Если нет сохраненного прогресса или плеер не инициализирован,
              // или lastSentTimeRef содержит Unix timestamp
              // используем текущее время видео
              localTime = videoElement.currentTime || 0

              // Обновляем lastSentTimeRef с корректным значением
              if (lastSentTimeRef.current > 100000) {
                console.log(
                  `[PlayVideo] Сброс некорректного lastSentTimeRef: ${lastSentTimeRef.current} -> ${localTime}`,
                )
                lastSentTimeRef.current = localTime
              }

              // Сохраняем время для этого видео
              videoTimesRef.current[video.id] = localTime

              console.log(`[PlayVideo] Используем текущее время видео: ${localTime.toFixed(3)}`)
            }
          } else if (video.startTime) {
            // Для обычного времени вычисляем локальное время
            localTime = Math.max(0, currentTime - (video.startTime || 0))

            // Сохраняем локальное время для этого видео
            videoTimesRef.current[video.id] = localTime
          }

          // Проверяем, что текущее время видео отличается от требуемого
          if (Math.abs(videoElement.currentTime - localTime) > 0.5) {
            console.log(
              `[PlayVideo] Синхронизация времени: ${videoElement.currentTime.toFixed(3)} -> ${localTime.toFixed(3)}`,
            )
            videoElement.currentTime = localTime
          }

          // Проверяем готовность видео к воспроизведению
          if (videoElement.readyState >= 2) {
            // HAVE_CURRENT_DATA или выше
            // Используем более надежный способ воспроизведения с обработкой ошибок
            const playPromise = videoElement.play()

            // Обрабатываем promise только если он возвращен
            if (playPromise !== undefined) {
              playPromise.catch((playErr) => {
                // Игнорируем ошибки прерывания воспроизведения, так как они ожидаемы
                // при быстром переключении между видео
                if (playErr.name !== "AbortError") {
                  console.error("[PlayVideo] Ошибка воспроизведения:", playErr)
                  setIsPlaying(false)
                }
              })
            }
          } else {
            // Если видео не готово, добавляем одноразовый слушатель для запуска
            console.log("[PlayVideo] Видео не готово, ожидаем событие canplay")
            const handleCanPlay = () => {
              if (isPlaying) {
                // Проверяем, что состояние не изменилось
                videoElement.play().catch((playErr) => {
                  if (playErr.name !== "AbortError") {
                    console.error("[PlayVideo] Ошибка отложенного воспроизведения:", playErr)
                    setIsPlaying(false)
                  }
                })
              }
              // Удаляем слушатель после первого срабатывания
              videoElement.removeEventListener("canplay", handleCanPlay)
            }
            videoElement.addEventListener("canplay", handleCanPlay, { once: true })
          }
        } else {
          // Пауза в любом случае, если isPlaying = false
          if (!videoElement.paused) {
            // Сохраняем текущее время перед паузой в lastSentTimeRef и videoTimesRef
            const currentVideoTime = videoElement.currentTime
            lastSentTimeRef.current = currentVideoTime
            videoTimesRef.current[video.id] = currentVideoTime
            console.log(`[PlayVideo] Сохраняем время перед паузой: ${currentVideoTime.toFixed(3)}`)

            // Ставим на паузу
            videoElement.pause()
          }
        }
      } catch (error) {
        console.error("[PlayVideo] Необработанная ошибка:", error)
        setIsPlaying(false)
      }
    }

    // Устанавливаем громкость для активного видео
    // const trackVolume = trackVolumes[activeVideo.id] ?? 1
    // videoElement.volume = globalVolume * trackVolume

    playVideo()

    // Убираем старые слушатели при очистке
    return () => {
      videoElement.removeEventListener("timeupdate", onTimeUpdate)
      videoElement.removeEventListener("error", handleError)
    }
  }, [
    video,
    isPlaying,
    isChangingCamera,
    videoRefs,
    setCurrentTime,
    setIsPlaying,
    duration,
    isSeeking,
    currentTime,
    displayTime,
    setDisplayTime,
    // resetCamera,
  ])

  // Используем ref для отслеживания состояния воспроизведения во время переключения камеры
  const isPlayingDuringCameraChangeRef = useRef(false)
  // Используем ref для отслеживания последнего видео, для которого был установлен флаг isChangingCamera
  const lastChangingCameraVideoIdRef = useRef<string | null>(null)
  // Используем ref для блокировки быстрого последовательного переключения
  const isCameraChangeLockRef = useRef(false)

  useEffect(() => {
    // Проверяем, изменилось ли значение isChangingCamera
    if (isChangingCamera !== prevIsChangingCameraRef.current) {
      prevIsChangingCameraRef.current = isChangingCamera

      if (isChangingCamera && video?.id && videoRefs[video.id]) {
        console.log("[ChangingCamera] Обнаружено переключение камеры")

        // Сохраняем ID текущего видео
        lastChangingCameraVideoIdRef.current = video.id

        // Сохраняем текущее состояние воспроизведения и записи
        isPlayingDuringCameraChangeRef.current = isPlaying

        // Если видео воспроизводится, сначала ставим его на паузу
        // чтобы избежать конфликта между play() и pause()
        if (isPlaying) {
          const videoElement = videoRefs[video.id]
          if (videoElement && !videoElement.paused) {
            console.log(
              "[ChangingCamera] Временно приостанавливаем видео для безопасного переключения",
            )
            videoElement.pause()
          }
        }

        // Проверяем, что src установлен правильно
        const videoElement = videoRefs[video.id]
        if (
          videoElement &&
          video.path &&
          (!videoElement.src || !videoElement.src.includes(video.id))
        ) {
          console.log(`[ChangingCamera] Обновляем src для видео ${video.id}: ${video.path}`)
          videoElement.src = video.path
          videoElement.load()
        }

        // Сохраняем текущее время для синхронизации между треками
        if (video?.id) {
          // Определяем локальное время для синхронизации
          let localTime = 0

          // Если у нас Unix timestamp, используем сохраненное время для этого видео
          if (currentTime > 100 * 365 * 24 * 60 * 60) {
            // Проверяем, есть ли сохраненное время для этого видео
            if (videoTimesRef.current[video.id] !== undefined) {
              localTime = videoTimesRef.current[video.id]
              console.log(
                `[ChangingCamera] Используем сохраненное время для видео ${video.id}: ${localTime.toFixed(3)}`,
              )
            }
            // Если нет сохраненного времени, используем lastSentTimeRef
            else if (lastSentTimeRef.current > 0 && lastSentTimeRef.current < 100000) {
              localTime = lastSentTimeRef.current
              console.log(`[ChangingCamera] Используем lastSentTimeRef: ${localTime.toFixed(3)}`)
            }
            // Иначе используем текущее время видео или 0
            else {
              const videoElement = videoRefs[video.id]
              if (videoElement) {
                localTime = videoElement.currentTime || 0
              }
              console.log(
                `[ChangingCamera] Используем текущее время видео: ${localTime.toFixed(3)}`,
              )
            }
          }
          // Для обычного времени используем сохраненное время для этого видео или текущее время видео
          else {
            // Проверяем, есть ли сохраненное время для этого видео
            if (videoTimesRef.current[video.id] !== undefined) {
              localTime = videoTimesRef.current[video.id]
              console.log(
                `[ChangingCamera] Используем сохраненное время для видео ${video.id}: ${localTime.toFixed(3)}`,
              )
            }
            // Если нет сохраненного времени, вычисляем локальное время
            else {
              // Если startTime и currentTime оба являются Unix timestamp, используем 0 или текущее время видео
              if (
                video.startTime &&
                video.startTime > 365 * 24 * 60 * 60 &&
                currentTime &&
                currentTime > 365 * 24 * 60 * 60
              ) {
                const videoElement = videoRefs[video.id]
                if (videoElement) {
                  localTime = videoElement.currentTime || 0
                } else {
                  localTime = 0
                }
                console.log(
                  `[ChangingCamera] Используем текущее время видео: ${localTime.toFixed(3)}`,
                )
              }
              // Иначе вычисляем локальное время как разницу между currentTime и startTime
              else {
                localTime = Math.max(0, currentTime - (video.startTime || 0))
                console.log(
                  `[ChangingCamera] Вычисленное локальное время: ${localTime.toFixed(3)} (глобальное: ${currentTime.toFixed(3)}, startTime: ${(video.startTime || 0).toFixed(3)})`,
                )
              }
            }
          }

          // Постановка видео на паузу, если нужно (убираем запуск во время переключения)
          const videoElement = videoRefs[video.id]
          if (videoElement) {
            // Синхронизируем время видео с вычисленным локальным временем
            if (Math.abs(videoElement.currentTime - localTime) > 0.3) {
              console.log(
                `[ChangingCamera] Синхронизация времени: ${videoElement.currentTime.toFixed(3)} -> ${localTime.toFixed(3)}`,
              )
              videoElement.currentTime = localTime

              // Сохраняем время для этого видео
              videoTimesRef.current[video.id] = localTime
              lastSentTimeRef.current = localTime
            }

            // Отложенное воспроизведение после переключения камеры
            // Используем setTimeout, чтобы избежать конфликта между play() и pause()
            setTimeout(() => {
              // Проверяем, что видео элемент все еще существует и доступен
              // и что это то же самое видео, для которого был установлен флаг isChangingCamera
              if (
                videoElement &&
                document.body.contains(videoElement) &&
                video.id === lastChangingCameraVideoIdRef.current
              ) {
                // Проверяем, что src установлен правильно
                if (video.path && (!videoElement.src || !videoElement.src.includes(video.id))) {
                  console.log(
                    `[ChangingCamera] Повторное обновление src для видео ${video.id}: ${video.path}`,
                  )
                  videoElement.src = video.path
                  videoElement.load()

                  // Даем дополнительное время для загрузки видео
                  setTimeout(() => {
                    // Проверяем снова, что видео элемент все еще существует
                    if (videoElement && document.body.contains(videoElement)) {
                      // Синхронизируем время видео с вычисленным локальным временем
                      if (Math.abs(videoElement.currentTime - localTime) > 0.3) {
                        console.log(
                          `[ChangingCamera] Повторная синхронизация времени: ${videoElement.currentTime.toFixed(3)} -> ${localTime.toFixed(3)}`,
                        )
                        videoElement.currentTime = localTime
                      }

                      // Возобновляем воспроизведение, если нужно
                      resumePlayback(videoElement, localTime)
                    }
                  }, 200)
                  return
                }

                // Возобновляем воспроизведение, если нужно
                resumePlayback(videoElement, localTime)
              }
            }, 300) // Добавляем задержку для безопасного переключения

            // Вспомогательная функция для возобновления воспроизведения
            const resumePlayback = (videoElement: HTMLVideoElement, _localTime: number) => {
              // Особая обработка для записи - всегда запускаем воспроизведение
              if (isRecording) {
                console.log("[ChangingCamera] В режиме записи - продолжаем воспроизведение")

                // Сначала сохраняем состояние записи
                const wasRecording = isRecording

                // Временно останавливаем запись, чтобы избежать конфликтов
                if (wasRecording) {
                  console.log(
                    "[ChangingCamera] Временно приостанавливаем запись для безопасного переключения",
                  )
                  setIsRecording(false)
                }

                // Устанавливаем воспроизведение
                setIsPlaying(true)

                try {
                  videoElement.play().catch((err: Error) => {
                    if (err.name !== "AbortError") {
                      console.error("[ChangingCamera] Ошибка воспроизведения при записи:", err)
                    }
                  })

                  // Возобновляем запись после небольшой задержки
                  if (wasRecording) {
                    setTimeout(() => {
                      console.log("[ChangingCamera] Возобновляем запись после переключения камеры")
                      setIsRecording(true)
                    }, 300)
                  }
                } catch (error) {
                  console.error(
                    "[ChangingCamera] Ошибка при воспроизведении во время записи:",
                    error,
                  )

                  // Возобновляем запись даже при ошибке, если она была активна
                  if (wasRecording) {
                    setTimeout(() => {
                      console.log("[ChangingCamera] Возобновляем запись после ошибки")
                      setIsRecording(true)
                    }, 300)
                  }
                }
              }
              // Обычное воспроизведение, если нужно
              else if (isPlayingDuringCameraChangeRef.current && videoElement.paused) {
                try {
                  console.log(
                    "[ChangingCamera] Возобновляем воспроизведение после переключения камеры",
                  )
                  videoElement.play().catch((err: Error) => {
                    if (err.name !== "AbortError") {
                      console.error("[ChangingCamera] Ошибка воспроизведения:", err)
                    }
                  })
                } catch (error) {
                  console.error("[ChangingCamera] Ошибка при воспроизведении:", error)
                }
              }
            }
          }
        }
      }
    }
  }, [
    isChangingCamera,
    videoRefs,
    video?.id,
    currentTime,
    isPlaying,
    isRecording,
    setIsPlaying,
    setIsRecording,
    setCurrentTime,
  ])

  // Эффект для автоматического сброса флага isChangingCamera через заданное время
  // Используем ref для отслеживания таймера, чтобы избежать создания нового таймера при каждом рендере
  const autoResetTimerRef = useRef<NodeJS.Timeout | null>(null)
  // Используем ref для отслеживания ID видео, для которого был установлен таймер сброса
  const autoResetVideoIdRef = useRef<string | null>(null)

  useEffect(() => {
    // Очищаем предыдущий таймер, если он существует
    if (autoResetTimerRef.current) {
      clearTimeout(autoResetTimerRef.current)
      autoResetTimerRef.current = null
    }

    if (isChangingCamera && video?.id) {
      // Сохраняем ID текущего видео для проверки при сбросе
      autoResetVideoIdRef.current = video.id

      // Создаем новый таймер только если флаг isChangingCamera установлен
      autoResetTimerRef.current = setTimeout(() => {
        // Проверяем, что ID видео не изменился с момента установки таймера
        if (video.id === autoResetVideoIdRef.current) {
          console.log(
            `[AutoReset] Автоматический сброс флага isChangingCamera для видео ${video.id}`,
          )
          setIsChangingCamera(false)
        } else {
          console.log(
            `[AutoReset] Пропуск сброса флага isChangingCamera - видео изменилось: ${autoResetVideoIdRef.current} -> ${video.id}`,
          )
        }
        autoResetTimerRef.current = null
        autoResetVideoIdRef.current = null
      }, 2000) // Увеличиваем время до 2 секунд для надежности
    }

    return () => {
      // Очищаем таймер при размонтировании компонента
      if (autoResetTimerRef.current) {
        clearTimeout(autoResetTimerRef.current)
        autoResetTimerRef.current = null
      }
    }
  }, [isChangingCamera, video?.id, setIsChangingCamera])

  // Используем ref для отслеживания текущего сектора (дня)
  const currentSectorRef = useRef<string | null>(null)

  // Используем глобальный объект sectorTimes из хука useSectionTime

  // Эффект для синхронизации времени видео с общим состоянием - оптимизированная версия для плавного воспроизведения
  useEffect(() => {
    if (!video?.id) return

    const videoElement = videoRefs[video.id]
    if (!videoElement) return

    // Проверяем, изменилось ли видео
    if (currentVideoIdRef.current !== video.id) {
      console.log(
        `[MediaPlayer] Синхронизация: видео изменилось: ${currentVideoIdRef.current} -> ${video.id}`,
      )
      // Сохраняем ID текущего видео
      currentVideoIdRef.current = video.id
    }

    // Определяем, короткое ли у нас видео
    isShortVideo.current = (duration || 0) < 10

    // Обновляем startTime при каждой синхронизации
    videoStartTime.current = video.startTime || 0

    // Определяем сектор (день) текущего видео на основе startTime
    // Используем дату в формате YYYY-MM-DD как идентификатор сектора
    let currentSector = null
    if (video.startTime && video.startTime > 365 * 24 * 60 * 60) {
      const date = new Date(video.startTime * 1000)
      currentSector = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
    } else {
      // Если startTime не является Unix timestamp, используем текущую дату
      const date = new Date()
      currentSector = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
    }

    // Проверяем, изменился ли сектор
    const isSectorChanged = currentSector !== currentSectorRef.current
    if (isSectorChanged) {
      console.log(`[MediaPlayer] Сектор изменился: ${currentSectorRef.current} -> ${currentSector}`)

      // Сохраняем текущее время для предыдущего сектора
      if (
        currentSectorRef.current &&
        lastSentTimeRef.current > 0 &&
        lastSentTimeRef.current < 100000
      ) {
        sectorTimes[currentSectorRef.current] = lastSentTimeRef.current
        console.log(
          `[MediaPlayer] Сохраняем время для сектора ${currentSectorRef.current}: ${lastSentTimeRef.current.toFixed(3)}`,
        )
      }

      // Обновляем текущий сектор
      currentSectorRef.current = currentSector

      // Восстанавливаем время для нового сектора, если оно есть
      if (sectorTimes[currentSector] !== undefined) {
        lastSentTimeRef.current = sectorTimes[currentSector]
        console.log(
          `[MediaPlayer] Восстанавливаем время для сектора ${currentSector}: ${lastSentTimeRef.current.toFixed(3)}`,
        )
      } else {
        // Сохраняем текущее время при переключении между секторами
        // Это позволит сохранить текущую позицию воспроизведения при переключении между дорожками
        console.log(
          `[MediaPlayer] Сохраняем текущее время при переключении сектора: ${lastSentTimeRef.current.toFixed(3)}`,
        )
        // Не сбрасываем lastSentTimeRef.current, чтобы сохранить текущую позицию воспроизведения
        // Сохраняем текущее время для нового сектора
        if (lastSentTimeRef.current > 0 && lastSentTimeRef.current < 100000) {
          sectorTimes[currentSector] = lastSentTimeRef.current
          console.log(
            `[MediaPlayer] Сохраняем время для нового сектора ${currentSector}: ${lastSentTimeRef.current.toFixed(3)}`,
          )
        }
      }
    }

    // Проверяем, что время валидно
    if (!isFinite(currentTime) || currentTime < 0) {
      // Если время некорректно, устанавливаем в начало
      if (Math.abs(videoElement.currentTime - 0) > 0.5) {
        videoElement.currentTime = 0
      }
      return
    }

    // Если мы в процессе переключения камеры, обрабатываем особым образом
    if (isChangingCamera) {
      // Не обновляем позицию автоматически при смене камеры,
      // это будет сделано в эффекте isChangingCamera
      return
    }

    // Определяем локальное время в зависимости от типа глобального времени
    let localTime

    // Если у нас Unix timestamp, обрабатываем особым образом
    if (currentTime > 365 * 24 * 60 * 60) {
      // Проверяем, есть ли сохраненное время для этого видео
      if (videoTimesRef.current[video.id] !== undefined) {
        // Используем сохраненное время для этого видео
        localTime = videoTimesRef.current[video.id]
        console.log(
          `[Sync] Используем сохраненное время для видео ${video.id}: ${localTime.toFixed(3)}`,
        )
      }
      // Если нет сохраненного времени для этого видео, проверяем сохраненное время для сектора
      else if (currentSectorRef.current && sectorTimes[currentSectorRef.current] !== undefined) {
        // Используем сохраненное время для текущего сектора
        localTime = sectorTimes[currentSectorRef.current]
        console.log(
          `[Sync] Используем сохраненное время для сектора ${currentSectorRef.current}: ${localTime.toFixed(3)}`,
        )

        // Сохраняем это время для текущего видео
        videoTimesRef.current[video.id] = localTime
      }
      // Если нет сохраненного времени для сектора, проверяем lastSentTimeRef
      else if (
        isInitializedRef.current &&
        lastSentTimeRef.current > 0 &&
        lastSentTimeRef.current < 100000
      ) {
        // Используем lastSentTimeRef для восстановления прогресса воспроизведения
        // Но только если это разумное значение (не Unix timestamp)
        localTime = lastSentTimeRef.current
        console.log(`[Sync] Используем сохраненный прогресс: ${localTime.toFixed(3)}`)

        // Сохраняем это время для текущего видео
        videoTimesRef.current[video.id] = localTime
      } else {
        // Если нет сохраненного прогресса или плеер не инициализирован,
        // или lastSentTimeRef содержит Unix timestamp
        // используем текущее время видео
        localTime = videoElement.currentTime || 0

        // Обновляем lastSentTimeRef с корректным значением
        if (lastSentTimeRef.current > 100000) {
          console.log(
            `[Sync] Сброс некорректного lastSentTimeRef: ${lastSentTimeRef.current} -> ${localTime}`,
          )
          lastSentTimeRef.current = localTime
        }

        console.log(`[Sync] Используем текущее время видео: ${localTime.toFixed(3)}`)
      }
    } else {
      // Для обычного времени вычисляем локальное время
      localTime = Math.max(0, currentTime - videoStartTime.current)
    }

    // Вычисляем разницу между текущим временем видео и локальным временем
    const timeDifference = Math.abs(videoElement.currentTime - localTime)

    // Синхронизируем при активной перемотке или значительной разнице
    // Используем умеренный порог в 0.5 секунд для хорошей синхронизации
    if (isSeeking) {
      // При активной перемотке сразу применяем новое время
      videoElement.currentTime = localTime
      console.log(
        `[MediaPlayer] Перемотка: установлено время ${localTime.toFixed(3)} (глобальное: ${currentTime.toFixed(3)}, startTime: ${videoStartTime.current.toFixed(3)})`,
      )

      // Обновляем lastSentTimeRef и сохраняем время для этого видео и сектора
      lastSentTimeRef.current = localTime
      videoTimesRef.current[video.id] = localTime

      // Если есть параллельные видео, синхронизируем их время пропорционально
      if (parallelVideos && parallelVideos.length > 1) {
        // Вычисляем относительную позицию для текущего видео
        const relativePosition = localTime / (video.duration || 1)

        // Определяем источник текущего видео
        const currentVideoSource = getVideoSource(video.id)

        // Обновляем время для всех параллельных видео
        parallelVideos.forEach((parallelVideo) => {
          if (parallelVideo.id !== video.id && videoRefs[parallelVideo.id]) {
            // Определяем источник параллельного видео
            const parallelVideoSource = getVideoSource(parallelVideo.id)

            // Если источники разные, логируем это
            if (
              currentVideoSource &&
              parallelVideoSource &&
              currentVideoSource !== parallelVideoSource
            ) {
              console.log(
                `[MediaPlayer] Синхронизация между видео из разных источников: ${currentVideoSource} -> ${parallelVideoSource}`,
              )
            }

            const parallelVideoDuration = parallelVideo.duration || 1
            const newParallelTime = relativePosition * parallelVideoDuration

            videoRefs[parallelVideo.id].currentTime = newParallelTime
            videoTimesRef.current[parallelVideo.id] = newParallelTime
            console.log(
              `[MediaPlayer] Синхронизировано время ${newParallelTime.toFixed(3)} для видео ${parallelVideo.id}`,
            )
          }
        })
      }

      // Сохраняем время для текущего сектора
      if (currentSectorRef.current) {
        sectorTimes[currentSectorRef.current] = localTime
        console.log(
          `[Sync] Сохраняем время для сектора ${currentSectorRef.current}: ${localTime.toFixed(3)}`,
        )
      }

      // Сбрасываем isSeeking после установки времени с минимальной задержкой
      setTimeout(() => setIsSeeking(false), 50)
    } else if (timeDifference > 0.5) {
      // Значительные расхождения синхронизируем принудительно
      videoElement.currentTime = localTime
      console.log(
        `[MediaPlayer] Синхронизация: установлено время ${localTime.toFixed(3)} (глобальное: ${currentTime.toFixed(3)}, startTime: ${videoStartTime.current.toFixed(3)})`,
      )

      // Обновляем lastSentTimeRef и сохраняем время для этого видео и сектора
      lastSentTimeRef.current = localTime
      videoTimesRef.current[video.id] = localTime

      // Сохраняем время для текущего сектора
      if (currentSectorRef.current) {
        sectorTimes[currentSectorRef.current] = localTime
        console.log(
          `[Sync] Сохраняем время для сектора ${currentSectorRef.current}: ${localTime.toFixed(3)}`,
        )
      }
    }
    // Для плавного воспроизведения не синхронизируем малые различия
  }, [
    currentTime,
    video?.id,
    videoRefs,
    isSeeking,
    setIsSeeking,
    isChangingCamera,
    duration,
    video?.startTime,
    parallelVideos,
    video?.duration,
  ])

  // Эффект для обработки изменения состояния воспроизведения
  useEffect(() => {
    // Проверяем на дубликаты в параллельных видео
    const uniqueParallelIds = [...new Set(parallelVideos.map((v) => v.id))]
    if (uniqueParallelIds.length !== parallelVideos.length) {
      console.warn(
        `[PlayPauseEffect] Обнаружены дубликаты в параллельных видео! Уникальных: ${uniqueParallelIds.length}, всего: ${parallelVideos.length}`,
      )

      // Удаляем дубликаты из массива параллельных видео, предпочитая видео из предпочтительного источника
      const uniqueParallelVideos: MediaFile[] = []
      const processedIds = new Set<string>()

      // Получаем предпочтительный источник
      const source = preferredSource || "timeline"

      // Сначала добавляем видео из предпочтительного источника
      parallelVideos.forEach((video) => {
        if (video.id && !processedIds.has(video.id)) {
          // Определяем источник видео
          const videoSource =
            getVideoSource(video.id) || (video.startTime !== undefined ? "timeline" : "media")

          if (videoSource === source) {
            uniqueParallelVideos.push(video)
            processedIds.add(video.id)
          }
        }
      })

      // Затем добавляем оставшиеся видео, если такого ID еще нет
      parallelVideos.forEach((video) => {
        if (video.id && !processedIds.has(video.id)) {
          uniqueParallelVideos.push(video)
          processedIds.add(video.id)
        }
      })

      // Обновляем массив параллельных видео без дубликатов
      if (uniqueParallelVideos.length !== parallelVideos.length) {
        console.log(
          `[PlayPauseEffect] Удаляем дубликаты из параллельных видео, новый размер: ${uniqueParallelVideos.length}`,
        )
        console.log(`[PlayPauseEffect] Приоритет отдан видео из источника: ${source}`)
        setParallelVideos(uniqueParallelVideos)
        return // Выходим из эффекта, он будет вызван повторно с обновленным массивом
      }
    }

    // Проверяем, есть ли активное видео или видео в шаблоне
    const hasActiveVideo = !!video?.id
    const hasTemplateVideos = appliedTemplate?.videos && appliedTemplate.videos.length > 0
    const hasParallelVideos = parallelVideos && parallelVideos.length > 0

    // Если нет ни активного видео, ни видео в шаблоне, ни параллельных видео, выходим
    if (!hasActiveVideo && !hasTemplateVideos && !hasParallelVideos) {
      console.log("[PlayPauseEffect] Нет видео для воспроизведения")
      return
    }

    // Получаем видео элемент, если есть активное видео
    const videoElement = hasActiveVideo ? videoRefs[video.id] : null
    // Если есть активное видео, но нет элемента, и нет других видео, выходим
    if (hasActiveVideo && !videoElement && !hasTemplateVideos && !hasParallelVideos) return

    // Предотвращаем множественные вызовы в течение короткого промежутка времени
    const now = Date.now()
    if (isHandlingPlayPauseEffectRef.current || now - lastPlayPauseEffectTimeRef.current < 300) {
      console.log("[PlayPauseEffect] Игнорируем повторный вызов эффекта")
      return
    }

    // Устанавливаем флаг, что обрабатываем событие
    isHandlingPlayPauseEffectRef.current = true
    lastPlayPauseEffectTimeRef.current = now

    // Сохраняем текущее время видео перед изменением состояния воспроизведения, если есть активное видео и элемент
    if (hasActiveVideo && videoElement) {
      const currentVideoTime = videoElement.currentTime
      if (currentVideoTime > 0) {
        videoTimesRef.current[video.id] = currentVideoTime
        lastSentTimeRef.current = currentVideoTime

        // Сохраняем время для текущего сектора
        if (currentSectorRef.current) {
          sectorTimes[currentSectorRef.current] = currentVideoTime
          console.log(
            `[PlayPause] Сохраняем время для сектора ${currentSectorRef.current}: ${currentVideoTime.toFixed(3)}`,
          )
        }

        console.log(
          `[PlayPause] Сохраняем время для видео ${video.id}: ${currentVideoTime.toFixed(3)}`,
        )
      }
    }

    // Обрабатываем изменение состояния воспроизведения без установки флага isChangingCamera
    // Проверяем, не находимся ли мы в процессе переключения камеры или блокировки
    if (!isChangingCamera && !isCameraChangeLockRef.current) {
      // Если используется шаблон с несколькими видео, управляем всеми видео
      if (appliedTemplate?.template && parallelVideos.length > 0) {
        // Проверяем наличие видео в шаблоне
        const hasValidVideos = parallelVideos.some((parallelVideo) => {
          return parallelVideo.id && videoRefs[parallelVideo.id]
        })

        // Если нет валидных видео, выходим
        if (!hasValidVideos) {
          console.log(`[PlayPause] Нет валидных видео в шаблоне`)
          return
        }

        // Запускаем все видео одновременно, не дожидаясь их готовности
        // Это позволит браузеру самостоятельно управлять загрузкой и запуском
        if (isPlaying) {
          console.log(`[PlayPause] Запускаем синхронное воспроизведение всех видео`)

          // Используем дебаунсинг для предотвращения слишком частых вызовов
          const now = Date.now()

          // Проверяем, прошло ли достаточно времени с последнего запуска
          // Используем простую переменную вместо useRef, так как мы внутри эффекта
          const lastPlayAllTimeRef = { current: 0 }
          const timeSinceLastPlayAll = now - lastPlayAllTimeRef.current

          // Если прошло менее 300мс с последнего запуска, пропускаем
          if (timeSinceLastPlayAll < 300) {
            console.log(`[PlayPause] Пропускаем запуск всех видео (слишком частый вызов)`)
            return
          }

          // Обновляем время последнего запуска
          lastPlayAllTimeRef.current = now

          // Используем requestAnimationFrame для запуска всех видео в одном кадре отрисовки
          requestAnimationFrame(() => {
            try {
              // Создаем массив уникальных видео для воспроизведения
              const uniqueVideos = parallelVideos.filter(
                (v, i, arr) => arr.findIndex((item) => item.id === v.id) === i,
              )

              console.log(
                `[PlayPause] Запускаем воспроизведение ${uniqueVideos.length} уникальных видео`,
              )

              // Создаем Set для отслеживания уже запущенных видео
              const playedVideos = new Set<string>()

              // Запускаем воспроизведение всех видео одновременно
              uniqueVideos.forEach((parallelVideo) => {
                if (parallelVideo.id && videoRefs[parallelVideo.id]) {
                  const videoElement = videoRefs[parallelVideo.id]

                  // Проверяем, что элемент существует и находится в DOM
                  if (!videoElement || !document.body.contains(videoElement)) {
                    return
                  }

                  // Проверяем, не запускали ли мы уже это видео
                  if (playedVideos.has(parallelVideo.id)) {
                    return
                  }

                  // Добавляем ID в Set запущенных видео
                  playedVideos.add(parallelVideo.id)

                  // Устанавливаем высокий приоритет загрузки
                  videoElement.preload = "auto"

                  // Запускаем воспроизведение, если видео на паузе
                  if (videoElement.paused) {
                    // Запускаем воспроизведение с небольшой задержкой
                    setTimeout(() => {
                      // Повторно проверяем, что видео на паузе и элемент существует
                      if (
                        videoElement &&
                        document.body.contains(videoElement) &&
                        videoElement.paused &&
                        isPlaying
                      ) {
                        videoElement.play().catch((err) => {
                          // Игнорируем ошибки AbortError, так как они возникают при нормальной работе
                          if (err.name !== "AbortError") {
                            console.error(
                              `[PlayPause] Ошибка при воспроизведении видео ${parallelVideo.id}:`,
                              err,
                            )
                          }
                        })
                      }
                    }, 50)
                  }
                }
              })

              // Логируем результат
              console.log(
                `[PlayPause] Запущено воспроизведение ${playedVideos.size} уникальных видео`,
              )
            } catch (err) {
              console.error(`[PlayPause] Ошибка при синхронном запуске видео:`, err)
            }
          })
        } else {
          // Если нужно поставить на паузу, останавливаем все видео одновременно
          console.log(`[PlayPause] Останавливаем все видео в шаблоне`)

          // Используем pauseAllVideos для гарантированной остановки всех видео
          pauseAllVideos()

          // Не используем дополнительные вызовы для остановки видео,
          // так как pauseAllVideos уже оптимизирован и содержит все необходимые проверки
        }
      }
      // Если нет шаблона, управляем только активным видео
      else if (hasActiveVideo && videoElement && document.body.contains(videoElement)) {
        if (isPlaying) {
          // Если видео на паузе, запускаем воспроизведение
          if (videoElement.paused) {
            // Используем setTimeout с минимальной задержкой для предотвращения конфликта с другими операциями
            setTimeout(() => {
              // Проверяем, что видео элемент все еще существует и доступен
              // и что не началось новое переключение камеры
              if (
                videoElement &&
                document.body.contains(videoElement) &&
                isPlaying &&
                !isChangingCamera &&
                !isCameraChangeLockRef.current
              ) {
                // Проверяем готовность видео к воспроизведению
                if (videoElement.readyState >= 3 || isVideoReady(video.id)) {
                  // HAVE_FUTURE_DATA или выше - видео готово к воспроизведению
                  console.log(`[PlayPause] Запускаем воспроизведение для видео ${video.id}`)
                  videoElement.play().catch((err: Error) => {
                    if (err.name !== "AbortError") {
                      console.error("[PlayPause] Ошибка при воспроизведении:", err)
                      setIsPlaying(false)
                    }
                  })
                } else {
                  // Если видео не готово, добавляем одноразовый слушатель для запуска
                  console.log(`[PlayPause] Видео ${video.id} не готово, ожидаем событие canplay`)

                  // Функция для проверки готовности видео
                  const checkVideoReady = () => {
                    if (videoElement.readyState >= 3 || isVideoReady(video.id)) {
                      console.log(
                        `[PlayPause] Видео ${video.id} готово к воспроизведению после ожидания`,
                      )
                      if (isPlaying && !isChangingCamera && !isCameraChangeLockRef.current) {
                        videoElement.play().catch((err: Error) => {
                          if (err.name !== "AbortError") {
                            console.error("[PlayPause] Ошибка при отложенном воспроизведении:", err)
                            setIsPlaying(false)
                          }
                        })
                      }
                      clearInterval(checkInterval)
                    }
                  }

                  // Запускаем интервал для проверки готовности видео с более частыми проверками
                  const checkInterval = setInterval(checkVideoReady, 50)

                  // Устанавливаем таймаут для остановки интервала, если видео не будет готово в течение 10 секунд
                  setTimeout(() => {
                    clearInterval(checkInterval)
                    console.log(`[PlayPause] Превышено время ожидания готовности видео ${video.id}`)
                  }, 10000)
                }
              }
            }, 10) // Уменьшаем задержку для более быстрого запуска
          }
        } else {
          // Если видео воспроизводится, ставим на паузу
          if (!videoElement.paused) {
            console.log(`[PlayPause] Ставим на паузу видео ${video.id}`)
            videoElement.pause()

            // Сохраняем текущее время видео для последующего восстановления
            const currentVideoTime = videoElement.currentTime
            videoTimesRef.current[video.id] = currentVideoTime
            lastSentTimeRef.current = currentVideoTime
            console.log(
              `[PlayPause] Сохраняем текущее время видео при паузе: ${currentVideoTime.toFixed(3)}`,
            )

            // Останавливаем все видео для гарантии
            pauseAllVideos()

            // Повторно проверяем через небольшую задержку, что все видео остановлены
            setTimeout(() => {
              console.log(
                `[PlayPause] Повторная проверка остановки всех видео после паузы одного видео`,
              )
              pauseAllVideos()
            }, 100)
          }
        }
      } else {
        console.log(
          `[PlayPause] Видео элемент ${hasActiveVideo ? video.id : "неизвестно"} не найден или удален из DOM`,
        )
      }
    } else {
      console.log(
        `[PlayPause] Пропускаем изменение состояния воспроизведения во время переключения камеры или блокировки`,
      )
    }

    // Сбрасываем флаг обработки через небольшую задержку
    setTimeout(() => {
      isHandlingPlayPauseEffectRef.current = false
    }, 300)
  }, [
    isPlaying,
    video?.id,
    videoRefs,
    isChangingCamera,
    setIsPlaying,
    parallelVideos,
    setParallelVideos,
  ])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent): void => {
      if (e.key.toLowerCase() === "p" && video?.id) {
        // Сохраняем текущее время перед паузой
        if (isPlaying && video?.id && videoRefs[video.id]) {
          const videoElement = videoRefs[video.id]
          // Сохраняем текущее время в lastSentTimeRef и videoTimesRef
          const currentVideoTime = videoElement.currentTime
          lastSentTimeRef.current = currentVideoTime
          videoTimesRef.current[video.id] = currentVideoTime

          // Сохраняем время для текущего сектора
          if (currentSectorRef.current) {
            sectorTimes[currentSectorRef.current] = currentVideoTime
            console.log(
              `[KeyPress] Сохраняем время для сектора ${currentSectorRef.current}: ${currentVideoTime.toFixed(3)}`,
            )
          }

          console.log(`[KeyPress] Сохраняем время перед паузой: ${currentVideoTime.toFixed(3)}`)

          // Если переходим в состояние паузы, останавливаем все видео
          pauseAllVideos()
        }

        // Переключаем состояние воспроизведения
        setIsPlaying(!isPlaying)

        // Если переходим в состояние паузы, повторно проверяем, что все видео остановлены
        if (isPlaying) {
          setTimeout(() => {
            console.log(`[KeyPress] Повторная проверка остановки всех видео после нажатия клавиши`)
            pauseAllVideos()
          }, 100)
        }
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [isPlaying, video?.id, setIsPlaying, videoRefs])

  // Определяем, какое видео активно
  // Если есть активное видео, используем его ID
  // Если нет активного видео, но есть примененный шаблон с видео, используем ID первого видео из шаблона
  const activeId = video
    ? video.id
    : appliedTemplate?.videos && appliedTemplate.videos.length > 0
      ? appliedTemplate.videos[0].id
      : null

  // Используем ref для отслеживания предыдущего состояния для логирования
  const prevLogStateRef = useRef({
    parallelVideosLength: -1,
    activeId: null as string | null,
    lastLogTime: 0,
  })

  // Логируем информацию о параллельных видео только при изменениях
  const currentTimestamp = Date.now()
  if (
    parallelVideos.length !== prevLogStateRef.current.parallelVideosLength ||
    activeId !== prevLogStateRef.current.activeId ||
    currentTimestamp - prevLogStateRef.current.lastLogTime > 5000 // Не чаще чем раз в 5 секунд
  ) {
    prevLogStateRef.current = {
      parallelVideosLength: parallelVideos.length,
      activeId,
      lastLogTime: currentTimestamp,
    }
    // Теперь логируем только при изменениях
    // Отключаем логирование для уменьшения количества сообщений
    // console.log(
    //   `[MediaPlayer] Параллельные видео: ${parallelVideos.length}, активное видео ID: ${activeId}`,
    // )
  }

  // Определяем, какие видео нужно отображать в зависимости от шаблона
  const [videosToDisplay, setVideosToDisplay] = useState<MediaFile[]>([])

  // Получаем функции из контекста плеера
  const { setActiveVideoId, setVideo, setAppliedTemplate } = usePlayerContext()

  // Эффект для инициализации видео из браузера при изменении preferredSource
  useEffect(() => {
    // Выполняем только на клиенте
    if (typeof window !== "undefined") {
      // Отключаем логирование для уменьшения количества сообщений
      // console.log(`[MediaPlayer] preferredSource изменен на: ${preferredSource}`)

      // Если выбран источник "media" (браузер)
      if (preferredSource === "media") {
        console.log(`[MediaPlayer] Режим браузера активирован`)

        // Помечаем все параллельные видео как видео из браузера
        parallelVideos.forEach((v) => {
          if (v.id) {
            // Обновляем источники видео в машине состояний
            const newVideoSources: Record<string, "media" | "timeline"> = { ...videoSources }
            newVideoSources[v.id] = "media"
            updateVideoSources(newVideoSources)
            console.log(`[MediaPlayer] Видео ${v.id} помечено как видео из браузера`)
          }
        })

        // Обновляем список видео для отображения
        setVideosToDisplay([...parallelVideos])
        console.log(
          `[MediaPlayer] Обновлен список видео для отображения: ${parallelVideos.length} видео`,
        )

        // Если есть примененный шаблон и в нем нет видео
        if (
          appliedTemplate?.template &&
          (!appliedTemplate.videos || appliedTemplate.videos.length === 0)
        ) {
          // Создаем копию шаблона
          const templateCopy = JSON.parse(JSON.stringify(appliedTemplate))

          // Заполняем шаблон видео из браузера
          templateCopy.videos = parallelVideos.slice(0, templateCopy.template?.screens || 1)

          // Применяем обновленный шаблон
          setAppliedTemplate(templateCopy)
          console.log(`[MediaPlayer] Шаблон обновлен видео из браузера`)
        }

        // Если нет активного видео, устанавливаем первое видео из параллельных как активное
        if ((!video || !video.id) && parallelVideos.length > 0) {
          console.log(
            `[MediaPlayer] Устанавливаем первое видео из браузера как активное: ${parallelVideos[0].id}`,
          )
          setActiveVideoId(parallelVideos[0].id)
          setVideo(parallelVideos[0])
        } else if (video && video.id) {
          console.log(`[MediaPlayer] Используем текущее активное видео: ${video.id}`)
        }
      }
    }
  }, [
    preferredSource,
    parallelVideos,
    appliedTemplate,
    video,
    setActiveVideoId,
    setVideo,
    setAppliedTemplate,
    setVideosToDisplay,
  ])

  // Используем ref для отслеживания предыдущего состояния
  const prevStateRef = useRef({
    appliedTemplate: null as any,
    video: null as MediaFile | null,
    parallelVideos: [] as MediaFile[],
    activeId: null as string | null,
    videoSources: {} as Record<string, "media" | "timeline">,
    preferredSource: "timeline" as "media" | "timeline",
  })

  // Эффект для обновления списка видео для отображения с оптимизацией
  useEffect(() => {
    // Проверяем, изменились ли зависимости существенно
    const prevState = prevStateRef.current
    const isVideoChanged = video?.id !== prevState.video?.id
    const isParallelVideosChanged =
      parallelVideos.length !== prevState.parallelVideos.length ||
      parallelVideos.some((v, i) => v.id !== (prevState.parallelVideos[i]?.id || null))
    const isTemplateChanged =
      appliedTemplate?.template?.id !== prevState.appliedTemplate?.template?.id ||
      appliedTemplate?.videos?.length !== prevState.appliedTemplate?.videos?.length
    const isPreferredSourceChanged = preferredSource !== prevState.preferredSource

    // Если ничего существенно не изменилось, пропускаем обновление
    if (
      !isVideoChanged &&
      !isParallelVideosChanged &&
      !isTemplateChanged &&
      !isPreferredSourceChanged
    ) {
      return
    }

    // Обновляем ref с текущим состоянием
    prevStateRef.current = {
      appliedTemplate,
      video,
      parallelVideos,
      activeId,
      videoSources,
      preferredSource,
    }

    // Логируем только при существенных изменениях
    // Отключаем логирование для уменьшения количества сообщений
    // console.log(
    //   `[MediaPlayer] Обновление списка видео для отображения (причина: ${
    //     isVideoChanged
    //       ? "изменение видео"
    //       : isParallelVideosChanged
    //         ? "изменение параллельных видео"
    //         : isTemplateChanged
    //           ? "изменение шаблона"
    //           : "изменение источника"
    //   }), preferredSource: ${preferredSource}`,
    // )

    let newVideosToDisplay: MediaFile[] = []

    // Используем значение из контекста плеера
    const storedPreferredSource = preferredSource || "timeline"

    // Если есть примененный шаблон
    if (appliedTemplate?.template) {
      // Если в шаблоне есть видео, используем их
      if (appliedTemplate.videos && appliedTemplate.videos.length > 0) {
        // Создаем новый массив, чтобы избежать мутации исходного массива
        newVideosToDisplay = [...appliedTemplate.videos]
        console.log(`[MediaPlayer] Используем ${newVideosToDisplay.length} видео из шаблона`)
      }
      // Если в шаблоне нет видео, но есть параллельные видео, используем их с учетом предпочтительного источника
      else if (parallelVideos.length > 0) {
        // Фильтруем видео по источнику, если есть информация о источниках
        let filteredVideos = parallelVideos

        if (videoSources && Object.keys(videoSources).length > 0) {
          filteredVideos = parallelVideos.filter((v) => {
            // Если нет информации о источнике для этого видео, включаем его
            if (!v.id || !videoSources[v.id]) return true

            // Включаем только видео из предпочтительного источника
            return videoSources[v.id] === storedPreferredSource
          })

          console.log(
            `[MediaPlayer] Отфильтровано ${filteredVideos.length} видео из ${parallelVideos.length} по источнику ${storedPreferredSource}`,
          )
        }

        // Создаем новый массив с уникальными видео, чтобы избежать дубликатов
        const uniqueVideos = filteredVideos.filter(
          (v, i, arr) => arr.findIndex((item) => item.id === v.id) === i,
        )

        // Берем только нужное количество видео для шаблона
        newVideosToDisplay = uniqueVideos.slice(0, appliedTemplate.template.screens || 1)
        console.log(
          `[MediaPlayer] Используем ${newVideosToDisplay.length} параллельных видео для шаблона`,
        )
      }
      // Если есть активное видео и оно из предпочтительного источника, добавляем его
      else if (
        video &&
        (!videoSources || !video.id || videoSources[video.id] === storedPreferredSource)
      ) {
        newVideosToDisplay = [video]
        console.log(`[MediaPlayer] Используем активное видео ${video.id} для шаблона`)
      }
      // Иначе пытаемся найти видео из параллельных видео или активного видео
      else {
        console.log(`[MediaPlayer] В шаблоне нет видео, пытаемся найти альтернативные источники`)

        // Проверяем, есть ли параллельные видео
        if (parallelVideos.length > 0) {
          console.log(`[MediaPlayer] Найдено ${parallelVideos.length} параллельных видео`)
          // Используем параллельные видео для шаблона
          newVideosToDisplay = parallelVideos.slice(0, appliedTemplate.template.screens || 1)

          // Обновляем шаблон с найденными видео
          const templateCopy = JSON.parse(JSON.stringify(appliedTemplate))
          templateCopy.videos = newVideosToDisplay
          setAppliedTemplate(templateCopy)
        }
        // Если есть активное видео, используем его
        else if (video && video.id) {
          console.log(`[MediaPlayer] Используем активное видео ${video.id} для шаблона`)
          newVideosToDisplay = [video]

          // Обновляем шаблон с активным видео
          const templateCopy = JSON.parse(JSON.stringify(appliedTemplate))
          templateCopy.videos = newVideosToDisplay
          setAppliedTemplate(templateCopy)
        }
        else {
          console.log(`[MediaPlayer] Шаблон будет показан с пустыми ячейками (черный экран)`)
        }
      }
    }
    // Если нет примененного шаблона, но есть активное видео
    else if (video) {
      // Если видео из таймлайна, всегда используем его
      if (video.startTime && video.startTime > 0) {
        newVideosToDisplay = [video]
        console.log(
          `[MediaPlayer] Используем активное видео ${video.id} из таймлайна (startTime=${video.startTime})`,
        )
      }
      // Иначе проверяем источник
      else if (!videoSources || !video.id || videoSources[video.id] === storedPreferredSource) {
        newVideosToDisplay = [video]
        console.log(
          `[MediaPlayer] Используем активное видео ${video.id} из источника ${videoSources[video.id] || "неизвестно"}`,
        )
      }
    }
    // Если нет примененного шаблона и нет активного видео,
    // но есть параллельные видео
    else if (parallelVideos.length > 0) {
      console.log(`[MediaPlayer] Проверяем параллельные видео (${parallelVideos.length})`)

      // Сначала проверяем, есть ли среди параллельных видео видео из таймлайна
      const timelineVideos = parallelVideos.filter((v) => v.startTime && v.startTime > 0)

      if (timelineVideos.length > 0 && storedPreferredSource === "timeline") {
        newVideosToDisplay = timelineVideos
        console.log(
          `[MediaPlayer] Используем параллельные видео из таймлайна: ${timelineVideos
            .map((v) => v.id)
            .join(", ")}`,
        )
      }
      // Если предпочтительный источник - медиа, фильтруем по источнику
      else if (storedPreferredSource === "media") {
        // Фильтруем видео по источнику
        const filteredVideos = parallelVideos.filter((v) => {
          // Если нет информации о источнике для этого видео, включаем его
          if (!v.id || !videoSources[v.id]) {
            console.log(`[MediaPlayer] Включаем видео ${v.id} без информации о источнике`)
            return true
          }

          // Включаем только видео из предпочтительного источника
          const isFromPreferredSource = videoSources[v.id] === storedPreferredSource
          console.log(
            `[MediaPlayer] Видео ${v.id} из источника ${videoSources[v.id]}, включаем: ${isFromPreferredSource}`,
          )
          return isFromPreferredSource
        })

        if (filteredVideos.length > 0) {
          newVideosToDisplay = [filteredVideos[0]]
          console.log(`[MediaPlayer] Используем первое видео из браузера ${filteredVideos[0].id}`)
        } else {
          console.log(`[MediaPlayer] Нет подходящих видео из браузера после фильтрации`)

          // Если после фильтрации нет видео, но есть параллельные видео, используем первое
          if (parallelVideos.length > 0) {
            console.log(
              `[MediaPlayer] Используем первое параллельное видео без фильтрации: ${parallelVideos[0].id}`,
            )
            newVideosToDisplay = [parallelVideos[0]]

            // Устанавливаем источник этого видео как "media"
            if (parallelVideos[0].id) {
              // Обновляем источники видео в машине состояний
              const newVideoSources: Record<string, "media" | "timeline"> = { ...videoSources }
              newVideoSources[parallelVideos[0].id] = "media"
              updateVideoSources(newVideoSources)
            }
          }
        }
      }
      // Если нет видео из предпочтительного источника, используем все параллельные видео
      else if (newVideosToDisplay.length === 0) {
        newVideosToDisplay = [parallelVideos[0]]
        console.log(`[MediaPlayer] Используем первое параллельное видео: ${parallelVideos[0].id}`)
      }
    }

    // Добавляем активное видео в список только если оно не включено и нет шаблона
    if (video && !newVideosToDisplay.some((v) => v.id === video.id) && !appliedTemplate?.template) {
      // Если видео из таймлайна, всегда добавляем его
      if (video.startTime && video.startTime > 0) {
        console.log(
          `[MediaPlayer] Добавляем активное видео ${video.id} из таймлайна в список для отображения`,
        )
        newVideosToDisplay.push(video)
      }
      // Иначе проверяем источник
      else if (!videoSources || !video.id || videoSources[video.id] === storedPreferredSource) {
        console.log(
          `[MediaPlayer] Добавляем активное видео ${video.id} из источника ${videoSources[video.id] || "неизвестно"} в список для отображения`,
        )
        newVideosToDisplay.push(video)
      }
    }

    // Проверяем, изменился ли список видео для отображения
    const currentVideosIds = videosToDisplay.map((v) => v.id).join(",")
    const newVideosIds = newVideosToDisplay.map((v) => v.id).join(",")

    if (currentVideosIds !== newVideosIds) {
      // Отключаем логирование для уменьшения количества сообщений
      // console.log(`[MediaPlayer] Обновляем список видео для отображения: ${newVideosIds}`)
      // Обновляем состояние только если список действительно изменился
      setVideosToDisplay(newVideosToDisplay)
    }
  }, [
    appliedTemplate,
    video,
    parallelVideos,
    activeId,
    videoSources,
    preferredSource,
    videosToDisplay,
  ])

  // Эффект для обновления видео при изменении preferredSource
  useEffect(() => {
    // Отключаем логирование для уменьшения количества сообщений
    // console.log(`[MediaPlayer] Обнаружено изменение preferredSource: ${preferredSource}`)

    // Если источник - таймлайн, принудительно обновляем видео
    if (preferredSource === "timeline") {
      // Отключаем логирование для уменьшения количества сообщений
      // console.log(`[MediaPlayer] Принудительно обновляем видео в шаблоне для таймлайна`)

      // Сначала сбрасываем шаблон, если он есть
      if (appliedTemplate) {
        console.log(`[MediaPlayer] Временно сбрасываем шаблон для гарантии обновления`)

        // Сохраняем ссылку на текущий шаблон
        const currentTemplate = appliedTemplate

        // Сбрасываем шаблон
        setAppliedTemplate(null)

        // Через небольшую задержку восстанавливаем шаблон
        setTimeout(() => {
          console.log(`[MediaPlayer] Восстанавливаем шаблон после сброса`)
          setAppliedTemplate(currentTemplate)

          // Проходим по всем видео в шаблоне
          currentTemplate.videos.forEach((video) => {
            if (video.id && videoRefs[video.id] && video.path) {
              const videoElement = videoRefs[video.id]

              console.log(
                `[MediaPlayer] Обновляем видео ${video.id} в шаблоне, source=${preferredSource}, startTime=${video.startTime}`,
              )

              // Сохраняем текущее время и состояние воспроизведения
              const currentTime = videoElement.currentTime
              const wasPlaying = !videoElement.paused

              // Обновляем src
              videoElement.src = video.path
              videoElement.load()

              // Восстанавливаем время и состояние воспроизведения
              if (currentTime > 0) {
                videoElement.currentTime = currentTime
              }

              if (wasPlaying) {
                videoElement
                  .play()
                  .catch((e) =>
                    console.error(`[MediaPlayer] Ошибка воспроизведения видео ${video.id}:`, e),
                  )
              }
            }
          })
        }, 100)
      }
    }
  }, [preferredSource])

  // Эффект для применения шаблона с учетом источника видео
  useEffect(() => {
    if (!appliedTemplate?.template) return

    console.log(`[MediaPlayer] Применяем шаблон: ${appliedTemplate.template.id}`)
    console.log(`[MediaPlayer] Активное видео ID: ${activeId}`)
    console.log(`[MediaPlayer] Соотношение сторон: ${JSON.stringify(aspectRatio)}`)

    // Определяем источник видео для шаблона
    // Если активное видео из таймлайна (имеет startTime), используем видео из таймлайна
    // Иначе используем видео из браузера
    const useTimelineVideos = video?.startTime !== undefined
    console.log(
      `[MediaPlayer] Используем видео из ${useTimelineVideos ? "таймлайна" : "браузера"} для шаблона`,
    )

    // Проверяем, что все видео из шаблона имеют соответствующие элементы в DOM
    // Если нет, создаем их программно
    if (appliedTemplate.videos && appliedTemplate.videos.length > 0) {
      appliedTemplate.videos.forEach((video) => {
        if (video?.id && video?.path && !videoRefs[video.id]) {
          console.log(
            `[MediaPlayer] Предварительно создаем видео элемент для ${video.id} при применении шаблона`,
          )

          // Создаем видео элемент программно
          const newVideoElement = document.createElement("video")
          newVideoElement.id = `video-${video.id}`
          newVideoElement.preload = "auto"
          newVideoElement.playsInline = true
          newVideoElement.controls = false
          newVideoElement.autoplay = false
          newVideoElement.loop = false
          newVideoElement.muted = false
          newVideoElement.volume = volume
          newVideoElement.src = video.path

          // Добавляем элемент в DOM (скрытый)
          newVideoElement.style.position = "absolute"
          newVideoElement.style.width = "1px"
          newVideoElement.style.height = "1px"
          newVideoElement.style.opacity = "0"
          newVideoElement.style.pointerEvents = "none"
          document.body.appendChild(newVideoElement)

          // Сохраняем ссылку на элемент
          videoRefs[video.id] = newVideoElement

          // Добавляем видео элемент в глобальный реестр для отслеживания
          allVideoElementsRef.current.add(newVideoElement)

          // Загружаем видео
          newVideoElement.load()
        }
      })
    }

    // Создаем копию видео из шаблона
    let templateVideos = [...(appliedTemplate.videos || [])]

    // Если в шаблоне нет видео, но есть активное видео, добавляем его в шаблон
    if (templateVideos.length === 0 && video) {
      console.log(`[MediaPlayer] Добавляем активное видео ${video.id} в шаблон`)
      templateVideos = [video]
    }

    // Если в шаблоне меньше видео, чем нужно для шаблона, добавляем параллельные видео
    if (
      templateVideos.length < (appliedTemplate.template.screens || 1) &&
      parallelVideos.length > 0
    ) {
      console.log(
        `[MediaPlayer] Добавляем параллельные видео в шаблон (${templateVideos.length}/${appliedTemplate.template.screens})`,
      )

      // Фильтруем параллельные видео в зависимости от источника
      const filteredParallelVideos = parallelVideos.filter((v) => {
        const isTimelineVideo = v.startTime !== undefined
        // Используем только видео из того же источника, что и активное видео
        return useTimelineVideos === isTimelineVideo
      })

      console.log(
        `[MediaPlayer] Отфильтровано ${filteredParallelVideos.length} видео из ${parallelVideos.length} по источнику`,
      )

      // Добавляем только недостающие видео
      const missingCount = (appliedTemplate.template.screens || 1) - templateVideos.length
      const additionalVideos = filteredParallelVideos
        .filter((v) => !templateVideos.some((av) => av.id === v.id))
        .slice(0, missingCount)

      templateVideos = [...templateVideos, ...additionalVideos]
      console.log(
        `[MediaPlayer] Добавлено ${additionalVideos.length} параллельных видео в шаблон, всего: ${templateVideos.length}`,
      )
    }

    // Обновляем видео в шаблоне
    appliedTemplate.videos = templateVideos
  }, [appliedTemplate, video, parallelVideos, activeId, aspectRatio])

  // Используем ref для отслеживания предыдущих видео
  const prevVideosToDisplayRef = useRef<MediaFile[]>([])

  // Предварительно загружаем новые видео для более быстрого запуска
  useEffect(() => {
    // Проверяем, изменился ли список видео для отображения
    const currentVideosIds = videosToDisplay.map((v) => v?.id).join(",")
    const prevVideosIds = prevVideosToDisplayRef.current.map((v) => v?.id).join(",")

    // Если список не изменился, пропускаем обновление
    if (currentVideosIds === prevVideosIds || videosToDisplay.length === 0) {
      return
    }

    // Обновляем ref с текущим списком видео
    prevVideosToDisplayRef.current = [...videosToDisplay]

    // Находим только новые видео, которые нужно загрузить
    const videosToLoad = videosToDisplay.filter(
      (videoItem) => videoItem && videoItem.id && videoItem.path && !videoRefs[videoItem.id],
    )

    if (videosToLoad.length === 0) {
      return
    }

    // Оптимизированная версия загрузки видео с использованием пакетной обработки
    // Сортируем видео, чтобы первое видео загружалось с высшим приоритетом
    const sortedVideosToLoad = [...videosToLoad].sort((a, b) => {
      // Если это первое видео в шаблоне, даем ему высший приоритет
      if (a.id === videosToDisplay[0]?.id) return -1
      if (b.id === videosToDisplay[0]?.id) return 1
      return 0
    })

    console.log(
      `[MediaPlayer] Загрузка ${sortedVideosToLoad.length} видео с приоритетом для первого видео`,
    )

    // Используем requestAnimationFrame для более эффективной загрузки видео
    // Это позволит браузеру оптимизировать создание и загрузку видео элементов
    requestAnimationFrame(() => {
      // Создаем все видео элементы в одном кадре отрисовки
      const videoElements: HTMLVideoElement[] = []

      // Первый проход: создаем все видео элементы и проверяем кэш
      for (const videoItem of sortedVideosToLoad) {
        if (videoItem && videoItem.id && videoItem.path) {
          // Проверяем, есть ли видео в глобальном кэше
          let videoElement: HTMLVideoElement | null = null

          if (window.videoElementCache && window.videoElementCache.has(videoItem.id)) {
            const cachedVideo = window.videoElementCache.get(videoItem.id)
            if (cachedVideo && cachedVideo.readyState >= 2) {
              // Создаем новый элемент на основе кэшированного
              videoElement = document.createElement("video")
              videoElement.id = `video-${videoItem.id}`
              videoElement.preload = "auto"
              videoElement.playsInline = true
              videoElement.controls = false
              videoElement.autoplay = false
              videoElement.loop = false
              videoElement.muted = videoItem.id !== videosToDisplay[0]?.id // Звук только у первого видео
              videoElement.volume = volume
              videoElement.src = cachedVideo.src

              // Добавляем метку, что это кэшированное видео
              videoElement.dataset.fromCache = "true"
            }
          }

          // Если не нашли в кэше, создаем новый элемент
          if (!videoElement) {
            videoElement = document.createElement("video")
            videoElement.id = `video-${videoItem.id}`
            videoElement.preload = "auto"
            videoElement.playsInline = true
            videoElement.controls = false
            videoElement.autoplay = false
            videoElement.loop = false
            videoElement.muted = videoItem.id !== videosToDisplay[0]?.id // Звук только у первого видео
            videoElement.volume = volume
            videoElement.src = videoItem.path

            // Добавляем метку, что это новое видео
            videoElement.dataset.fromCache = "false"

            // Добавляем обработчик события загрузки
            videoElement.addEventListener("loadeddata", () => {
              // Добавляем в глобальный кэш
              if (
                window.videoElementCache &&
                videoElement &&
                !window.videoElementCache.has(videoItem.id)
              ) {
                window.videoElementCache.set(videoItem.id, videoElement)
              }
            })
          }

          // Общие настройки для всех видео элементов
          videoElement.style.position = "absolute"
          videoElement.style.width = "1px"
          videoElement.style.height = "1px"
          videoElement.style.opacity = "0"
          videoElement.style.pointerEvents = "none"

          // Сохраняем ссылку на элемент
          videoRefs[videoItem.id] = videoElement

          // Определяем источник видео
          const source = videoItem.startTime !== undefined ? "timeline" : "media"
          // Обновляем источники видео в машине состояний
          const newVideoSources: Record<string, "media" | "timeline"> = { ...videoSources }
          newVideoSources[videoItem.id] = source
          updateVideoSources(newVideoSources)

          // Добавляем элемент в массив для последующей обработки
          videoElements.push(videoElement)
        }
      }

      // Второй проход: добавляем все элементы в DOM и начинаем загрузку
      // Используем requestAnimationFrame для добавления элементов в DOM в следующем кадре отрисовки
      requestAnimationFrame(() => {
        // Добавляем все элементы в DOM
        videoElements.forEach((videoElement) => {
          document.body.appendChild(videoElement)
        })

        // Начинаем загрузку всех видео с приоритетом для первого видео
        // Используем setTimeout с разными задержками для приоритизации
        videoElements.forEach((videoElement, index) => {
          const videoId = videoElement.id.replace("video-", "")
          const isFirstVideo = videoId === videosToDisplay[0]?.id
          const isFromCache = videoElement.dataset.fromCache === "true"

          // Определяем задержку в зависимости от приоритета и источника
          const delay = isFirstVideo ? 0 : isFromCache ? 50 : 100 + index * 20

          // Начинаем загрузку с соответствующей задержкой
          setTimeout(() => {
            if (document.body.contains(videoElement)) {
              videoElement.load()
            }
          }, delay)
        })
      })
    })
  }, [videosToDisplay, videoRefs, volume])

  // Используем ref для отслеживания предыдущего состояния логирования
  const logStateRef = useRef({
    videosCount: 0,
    templateId: null as string | null,
    parallelVideosIds: "",
    activeId: null as string | null,
    lastLogTime: 0,
  })

  // Логируем информацию о видео для отладки только при изменениях
  const now = Date.now()
  const currentState = {
    videosCount: videosToDisplay.length,
    templateId: appliedTemplate?.template?.id || null,
    parallelVideosIds: parallelVideos.map((v) => v.id).join(","),
    activeId,
  }

  // Проверяем, изменилось ли состояние или прошло достаточно времени с последнего лога
  const isStateChanged =
    currentState.videosCount !== logStateRef.current.videosCount ||
    currentState.templateId !== logStateRef.current.templateId ||
    currentState.parallelVideosIds !== logStateRef.current.parallelVideosIds ||
    currentState.activeId !== logStateRef.current.activeId

  const isTimeForLog = now - logStateRef.current.lastLogTime > 2000 // Логируем не чаще чем раз в 2 секунды

  if (isStateChanged || isTimeForLog) {
    // Обновляем состояние логирования
    logStateRef.current = {
      ...currentState,
      lastLogTime: now,
    }

    // Логируем только основную информацию
    console.log(
      `[MediaPlayer] Видео для отображения: ${videosToDisplay.length}, шаблон: ${appliedTemplate?.template?.id || "нет"}`,
    )

    // Подробное логирование видео только если есть видео и состояние изменилось
    if (videosToDisplay.length > 0 && isStateChanged) {
      console.log("[MediaPlayer] Детали видео для отображения:")
      videosToDisplay.forEach((v, i) => {
        console.log(
          `[MediaPlayer] Видео ${i + 1}/${videosToDisplay.length}: id=${v.id}, name=${v.name}`,
        )
      })

      // Логируем информацию о параллельных видео и активном видео
      console.log(
        `[MediaPlayer] Параллельные видео: ${parallelVideos.map((v) => v.id).join(", ")}, активное видео: ${activeId}`,
      )
    }
  }

  // Вычисляем соотношение сторон для AspectRatio
  const aspectRatioValue = aspectRatio.width / aspectRatio.height

  // Вычисляем стили для контейнера видео
  const containerStyle = {
    position: "relative" as const,
    width: "100%",
    height: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  }

  return (
    <div className="media-player-container relative flex h-full flex-col">
      <div className="relative flex-1 bg-black" style={containerStyle}>
        <div className="flex h-full w-full items-center justify-center">
          <div className="max-h-[calc(100%-85px)] w-full max-w-[100%]">
            <AspectRatio ratio={aspectRatioValue} className="bg-black">
              <div className="relative h-full w-full">
                {videosToDisplay && videosToDisplay.length > 0 ? (
                  // Если есть видео для отображения
                  <div className="h-full w-full">
                    {/* Отключаем логирование для уменьшения количества сообщений */}
                    {/* <>
                      {console.log(
                        `[MediaPlayer] Отображаем видео: ${videosToDisplay.map((v) => v.id).join(", ")}, activeId=${activeId}, isVideoReady=${isVideoReady}`,
                      )}
                    </> */}

                    {/* Если есть примененный шаблон и он настраиваемый, используем ResizableTemplate */}
                    {appliedTemplate?.template && appliedTemplate.template.resizable ? (
                      <ResizableTemplate
                        appliedTemplate={appliedTemplate}
                        videos={videosToDisplay}
                        activeVideoId={activeId}
                        videoRefs={videoRefs}
                      />
                    ) : (
                      // Иначе используем стандартный подход с абсолютным позиционированием
                      videosToDisplay.map((videoItem, index) => {
                        // Получаем стили для видео в зависимости от шаблона
                        const videoStyle: VideoTemplateStyle = appliedTemplate?.template
                          ? getVideoStyleForTemplate(
                            appliedTemplate.template,
                            index,
                            videosToDisplay.length,
                          )
                          : {
                            position: "absolute" as const,
                            top: "0",
                            left: "0",
                            width: "100%",
                            height: "100%",
                            display: videoItem.id === activeId ? "block" : "none",
                          }

                        // Логируем стили для отладки только в 5% случаев
                        if (Math.random() < 0.05) {
                          console.log(
                            `[MediaPlayer] Стили для видео ${videoItem.id} (индекс ${index}):`,
                            videoStyle,
                          )
                        }

                        // Если используется шаблон, применяем ResizableVideo
                        if (appliedTemplate?.template) {
                          // Добавляем отладочный вывод
                          console.log(
                            `[MediaPlayer] Применяем шаблон ${appliedTemplate.template.id}, resizable: ${appliedTemplate.template.resizable}, split: ${appliedTemplate.template.split}`,
                          )
                          // Создаем компонент-обертку для ResizableVideo
                          const ResizableVideoWrapper = () => {
                            // Создаем ref для контейнера, если его еще нет
                            if (!videoContainerRefs.current[`${videoItem.id}-${index}`]) {
                              videoContainerRefs.current[`${videoItem.id}-${index}`] =
                                React.createRef<HTMLDivElement>()
                            }

                            // Получаем ref для контейнера
                            const containerRef =
                              videoContainerRefs.current[`${videoItem.id}-${index}`]

                            return (
                              <div
                                className="absolute"
                                style={{
                                  ...videoStyle,
                                  display: videoItem.path ? "block" : "none", // Показываем только видео с путем
                                  border: "1px solid #38dacac3", // Добавляем рамку для отладки
                                  overflow: "visible", // Убираем overflow: hidden
                                }}
                                data-video-id={videoItem.id} // Добавляем атрибут для отладки
                                ref={containerRef}
                              >
                                {videoItem && videoItem.path ? (
                                  <ResizableVideo
                                    video={videoItem}
                                    isActive={videoItem.id === activeId}
                                    videoRefs={videoRefs}
                                    index={index}
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center bg-black">
                                    <span className="text-white">
                                      {t("timeline.player.videoUnavailable", "Видео недоступно")}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )
                          }

                          return <ResizableVideoWrapper key={`wrapper-${videoItem.id}-${index}`} />
                        }

                        // Если шаблон не используется, используем стандартный подход
                        // Проверяем, не является ли это видео дубликатом (одно и то же видео может быть в списке дважды)
                        // Это может вызывать бесконечный цикл обновлений
                        const isDuplicate =
                          videosToDisplay.findIndex((v) => v.id === videoItem.id) !== index
                        if (isDuplicate) {
                          console.log(
                            `[MediaPlayer] Пропускаем дублирующееся видео ${videoItem.id} в индексе ${index}`,
                          )
                          return null
                        }

                        // Проверяем, есть ли уже видео элемент в DOM с таким же ID
                        // Если есть, используем его вместо создания нового
                        const existingVideoElement = document.querySelector(
                          `video[data-video-id="${videoItem.id}"]`,
                        ) as HTMLVideoElement
                        if (existingVideoElement && !videoRefs[videoItem.id]) {
                          console.log(
                            `[MediaPlayer] Найден существующий видео элемент для ${videoItem.id}, используем его`,
                          )
                          videoRefs[videoItem.id] = existingVideoElement
                        }

                        return (
                          <video
                            key={`${videoItem.id}-${index}`} // Добавляем индекс к ключу, чтобы сделать его уникальным
                            ref={(el) => {
                              if (
                                el &&
                                (!videoRefs[videoItem.id] || videoRefs[videoItem.id] !== el)
                              ) {
                                console.log(
                                  `[MediaPlayer] Монтирование видео элемента ${videoItem.id}`,
                                )

                                videoRefs[videoItem.id] = el

                                // Определяем источник видео (по умолчанию считаем, что это медиа машина)
                                // Если видео имеет startTime, то это видео из таймлайна
                                const source =
                                  videoItem.startTime !== undefined ? "timeline" : "media"
                                // Обновляем источники видео в машине состояний
                                const newVideoSources: Record<string, "media" | "timeline"> = {
                                  ...videoSources,
                                }
                                newVideoSources[videoItem.id] = source
                                updateVideoSources(newVideoSources)
                                console.log(
                                  `[MediaPlayer] Видео ${videoItem.id} определено как ${source}`,
                                )

                                // Проверяем, что путь к видео существует
                                if (videoItem.path) {
                                  // Логируем только в 10% случаев для уменьшения нагрузки
                                  if (Math.random() < 0.1) {
                                    console.log(
                                      `[MediaPlayer] Устанавливаем src для видео ${videoItem.id}: ${videoItem.path}`,
                                    )
                                  }
                                  el.src = videoItem.path
                                  el.load()
                                } else {
                                  console.error(
                                    `[MediaPlayer] Ошибка: путь к видео ${videoItem.id} не определен`,
                                  )
                                }

                                // Создаем функцию для логирования с ограничением частоты
                                const shouldLog = () => Math.random() < 0.2 // Логируем только 20% событий

                                // Устанавливаем обработчик загрузки метаданных
                                el.onloadedmetadata = () => {
                                  if (shouldLog()) {
                                    console.log(
                                      `[MediaPlayer] Метаданные загружены для видео ${videoItem.id}`,
                                    )
                                  }
                                  // Обновляем состояние готовности видео
                                  setVideoReadyState((prev) => ({
                                    ...prev,
                                    [videoItem.id]: Math.max(prev[videoItem.id] || 0, 1), // HAVE_METADATA
                                  }))
                                }

                                // Устанавливаем обработчик загрузки данных
                                el.onloadeddata = () => {
                                  if (shouldLog()) {
                                    console.log(
                                      `[MediaPlayer] Данные загружены для видео ${videoItem.id}`,
                                    )
                                  }
                                  // Обновляем состояние готовности видео
                                  setVideoReadyState((prev) => ({
                                    ...prev,
                                    [videoItem.id]: Math.max(prev[videoItem.id] || 0, 2), // HAVE_CURRENT_DATA
                                  }))
                                }

                                // Устанавливаем обработчик для события canplay
                                el.oncanplay = () => {
                                  if (shouldLog()) {
                                    console.log(
                                      `[MediaPlayer] Видео ${videoItem.id} может начать воспроизведение`,
                                    )
                                  }
                                  // Обновляем состояние готовности видео
                                  setVideoReadyState((prev) => ({
                                    ...prev,
                                    [videoItem.id]: Math.max(prev[videoItem.id] || 0, 3), // HAVE_FUTURE_DATA
                                  }))
                                }

                                // Устанавливаем обработчик для события canplaythrough
                                el.oncanplaythrough = () => {
                                  if (shouldLog()) {
                                    console.log(
                                      `[MediaPlayer] Видео ${videoItem.id} может воспроизводиться без буферизации`,
                                    )
                                  }
                                  // Обновляем состояние готовности видео
                                  setVideoReadyState((prev) => ({
                                    ...prev,
                                    [videoItem.id]: Math.max(prev[videoItem.id] || 0, 4), // HAVE_ENOUGH_DATA
                                  }))
                                }

                                // Устанавливаем обработчик ошибок напрямую
                                el.onerror = (e) => {
                                  console.error(`[Video] Ошибка видео ${videoItem.id}:`, e)

                                  // Если это активное видео, сбрасываем флаг воспроизведения
                                  if (videoItem.id === activeId) {
                                    setIsPlaying(false)

                                    // Сбрасываем флаг isChangingCamera при ошибке
                                    if (isChangingCamera) {
                                      setIsChangingCamera(false)
                                    }
                                  }

                                  // Пробуем перезагрузить видео
                                  try {
                                    if (videoItem.path) {
                                      console.log(
                                        `[Video] Пробуем перезагрузить видео ${videoItem.id}`,
                                      )
                                      el.src = videoItem.path
                                      el.load()
                                    }
                                  } catch (loadError) {
                                    console.error(
                                      `[Video] Ошибка при перезагрузке видео ${videoItem.id}:`,
                                      loadError,
                                    )
                                  }
                                }
                              }
                            }}
                            src={videoItem.path || ""}
                            className="object-contain"
                            style={{
                              ...videoStyle,
                              // Всегда показываем видео, если оно есть в шаблоне или является активным
                              display:
                                videoItem.path &&
                                (appliedTemplate?.template || videoItem.id === activeId)
                                  ? "block"
                                  : "none",
                            }}
                            data-video-id={videoItem.id} // Добавляем атрибут для отладки
                            playsInline
                            preload="auto"
                            controls={false}
                            autoPlay={false}
                            loop={false}
                            disablePictureInPicture
                            muted={false} // Звук у всех видео
                            onLoadedData={() => {
                              // Логируем только в 10% случаев для уменьшения нагрузки
                              if (Math.random() < 0.1) {
                                console.log(
                                  `[MediaPlayer] Видео ${videoItem.id} загружено и готово к воспроизведению`,
                                )
                              }
                            }}
                          />
                        )
                      })
                    )}
                  </div>
                ) : (
                  // Если нет видео для отображения
                  <div className="absolute inset-0 flex h-full w-full items-center justify-center bg-black">
                    <span className="text-lg text-white">{noVideoText}</span>
                  </div>
                )}
              </div>
            </AspectRatio>
          </div>
        </div>
      </div>
      <PlayerControls currentTime={currentTime} />
    </div>
  )
}

MediaPlayer.displayName = "MediaPlayer"
