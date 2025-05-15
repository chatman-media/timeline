import {
  Camera,
  ChevronFirst,
  ChevronLast,
  CircleDot,
  GalleryThumbnails,
  Grid2x2,
  LayoutPanelTop,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  SquarePlay,
  StepBack,
  StepForward,
  TvMinimalPlay,
  UnfoldHorizontal,
  Volume2,
  VolumeX,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { getFrameTime } from "@/lib/video-utils"
import { useMedia } from "@/media-editor/browser"
import { useUserSettings } from "@/media-editor/browser/providers/user-settings-provider"
import { VolumeSlider } from "@/media-editor/media-player/components/volume-slider"
import { useDisplayTime } from "@/media-editor/media-player/contexts"
import { useFullscreenChange } from "@/media-editor/media-player/hooks/use-fullscreen-change"
import { usePlaybackControl } from "@/media-editor/media-player/hooks/use-playback-control"
import { useScreenshot } from "@/media-editor/media-player/hooks/use-screenshot"
import { useTimeControl } from "@/media-editor/media-player/hooks/use-time-control"
import { useVolumeControl } from "@/media-editor/media-player/hooks/use-volume-control"
import { AppliedTemplate } from "@/media-editor/media-player/services/template-service"
import { useTimeline } from "@/media-editor/timeline/services"
import { MediaFile } from "@/types/media"

import { usePlayerContext } from ".."

interface PlayerControlsProps {
  currentTime: number
}

export function PlayerControls({ currentTime }: PlayerControlsProps) {
  const { t } = useTranslation()
  const { tracks, activeTrackId } = useTimeline()
  const { screenshotsPath } = useUserSettings()
  const { displayTime, setDisplayTime } = useDisplayTime()
  const media = useMedia()

  // Состояние для отслеживания источника видео больше не нужно, так как используем машину состояний

  const {
    isPlaying,
    setIsPlaying,
    video,
    setVideo,
    setCurrentTime,
    volume,
    setVolume,
    isRecording,
    setIsRecording,
    setIsSeeking,
    isChangingCamera,
    setIsChangingCamera,
    parallelVideos,
    setParallelVideos,
    videoRefs,
    appliedTemplate,
    setAppliedTemplate,
    activeVideoId,
    setActiveVideoId,
    isResizableMode,
    setIsResizableMode,
    preferredSource,
    setPreferredSource,
    setLastAppliedTemplate,
    switchVideoSource,
  } = usePlayerContext()

  // Используем состояние для хранения текущего времени воспроизведения
  const [localDisplayTime, setLocalDisplayTime] = useState(0)
  const lastSaveTime = useRef(0)
  const SAVE_INTERVAL = 25000 // Сохраняем каждые 25 секунд

  // Используем хук для отслеживания полноэкранного режима
  const { isFullscreen } = useFullscreenChange()

  // Удаляем неиспользуемый ref

  // Временно отключаем сохранение состояния периодически
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      if (now - lastSaveTime.current >= SAVE_INTERVAL) {
        lastSaveTime.current = now
      }
    }, SAVE_INTERVAL)

    return () => clearInterval(interval)
  }, [video])

  // Используем хук для управления громкостью
  const { volumeRef, handleVolumeChange, handleVolumeChangeEnd, handleToggleMute } =
    useVolumeControl({
      video,
      videoRefs,
      volume,
      setVolume,
    })

  // Функция для переключения полноэкранного режима
  const handleFullscreen = useCallback(() => {
    // Проверяем, есть ли активное видео
    if (!video && !parallelVideos.length) {
      console.log("[handleFullscreen] Нет активного видео для отображения в полноэкранном режиме")
      return
    }

    // Находим контейнер медиаплеера
    const playerContainer = document.querySelector(".media-player-container") as HTMLElement

    if (!playerContainer) {
      console.error("[handleFullscreen] Не найден контейнер медиаплеера")
      return
    }

    // Используем функцию toggleFullscreen из хука useFullscreenChange
    const { toggleFullscreen } = useFullscreenChange()
    toggleFullscreen(playerContainer)

    console.log(`[handleFullscreen] ${isFullscreen ? "Выход из" : "Вход в"} полноэкранный режим`)
  }, [video, parallelVideos.length, isFullscreen])

  // Используем хук для создания и сохранения скриншота
  const { takeSnapshot } = useScreenshot({
    video,
    videoRefs,
    screenshotsPath,
    appliedTemplate,
  })

  // Функция для сброса шаблона
  const handleResetTemplate = useCallback(() => {
    console.log("[handleResetTemplate] Вызвана функция сброса шаблона")
    console.log("[handleResetTemplate] Текущий шаблон:", appliedTemplate)

    // Устанавливаем флаг, что идет переключение камеры
    setIsChangingCamera(true)

    if (appliedTemplate) {
      console.log("[handleResetTemplate] Сбрасываем шаблон:", appliedTemplate.template?.id)

      // Создаем копию текущего шаблона перед сбросом
      const templateToSave = JSON.parse(JSON.stringify(appliedTemplate))

      // Сохраняем текущий шаблон перед сбросом в контексте плеера
      setLastAppliedTemplate(templateToSave)
      console.log(
        "[handleResetTemplate] Шаблон сохранен в контексте плеера:",
        templateToSave.template?.id,
      )

      // Сохраняем текущее время воспроизведения
      let currentVideoTime = 0
      if (video?.id && videoRefs[video.id]) {
        currentVideoTime = videoRefs[video.id].currentTime
        console.log(`[handleResetTemplate] Текущее время видео: ${currentVideoTime.toFixed(3)}`)
      }

      // Определяем, какое видео будет активным после сброса шаблона
      let newActiveVideo: MediaFile | undefined

      // Если в шаблоне есть видео, используем первое из них
      if (templateToSave.videos && templateToSave.videos.length > 0) {
        newActiveVideo = templateToSave.videos[0]
        if (newActiveVideo && newActiveVideo.id) {
          console.log(
            `[handleResetTemplate] Используем первое видео из шаблона: ${newActiveVideo.id}`,
          )
        }
      }
      // Если нет видео в шаблоне, но есть параллельные видео, используем первое из них
      else if (parallelVideos.length > 0) {
        newActiveVideo = parallelVideos[0]
        if (newActiveVideo && newActiveVideo.id) {
          console.log(
            `[handleResetTemplate] Используем первое параллельное видео: ${newActiveVideo.id}`,
          )
        }
      }

      // Принудительно устанавливаем null для сброса шаблона
      setAppliedTemplate(null)

      // Если нашли видео для активации, устанавливаем его
      if (newActiveVideo && newActiveVideo.id) {
        // Устанавливаем новое активное видео
        setActiveVideoId(newActiveVideo.id)
        setVideo(newActiveVideo)
        console.log(`[handleResetTemplate] Установлено новое активное видео: ${newActiveVideo.id}`)

        // Устанавливаем время воспроизведения для нового видео
        setTimeout(() => {
          if (newActiveVideo.id && videoRefs[newActiveVideo.id]) {
            videoRefs[newActiveVideo.id].currentTime = currentVideoTime
            console.log(
              `[handleResetTemplate] Установлено время ${currentVideoTime.toFixed(3)} для видео ${newActiveVideo.id}`,
            )

            // Если видео должно воспроизводиться, запускаем его
            if (isPlaying) {
              console.log(
                `[handleResetTemplate] Запускаем воспроизведение видео ${newActiveVideo.id}`,
              )
              videoRefs[newActiveVideo.id].play().catch((error) => {
                console.error(
                  `[handleResetTemplate] Ошибка воспроизведения видео ${newActiveVideo.id}:`,
                  error,
                )
              })
            }
          }
        }, 100)
      }

      // Сбрасываем флаг переключения камеры через небольшую задержку
      setTimeout(() => {
        setIsChangingCamera(false)
        console.log("[handleResetTemplate] Сброс шаблона завершен")
      }, 300)
    } else {
      console.log("[handleResetTemplate] Нет активного шаблона для сброса")
      setIsChangingCamera(false)
    }
  }, [
    appliedTemplate,
    setAppliedTemplate,
    setLastAppliedTemplate,
    video,
    videoRefs,
    parallelVideos,
    setActiveVideoId,
    setVideo,
    setIsChangingCamera,
    isPlaying,
  ])

  // Улучшенная функция для переключения между камерами
  const handleSwitchCamera = useCallback(() => {
    // Если нет параллельных видео или их меньше 2, ничего не делаем
    if (!parallelVideos || parallelVideos.length < 2) {
      console.log("[handleSwitchCamera] Нет доступных камер для переключения")
      return
    }

    // Находим индекс текущей активной камеры
    const currentIndex = parallelVideos.findIndex((v) => v.id === video?.id)
    if (currentIndex === -1) {
      console.log("[handleSwitchCamera] Текущая камера не найдена в списке параллельных видео")
      // Если текущая камера не найдена, используем первую камеру из списка
      const nextVideo = parallelVideos[0]
      console.log(`[handleSwitchCamera] Используем первую камеру из списка: ${nextVideo.id}`)
      setVideo(nextVideo)
      setActiveVideoId(nextVideo.id)
      return
    }

    // Вычисляем индекс следующей камеры
    const nextIndex = (currentIndex + 1) % parallelVideos.length
    const nextVideo = parallelVideos[nextIndex]

    console.log(`[handleSwitchCamera] Переключение с камеры ${video?.id} на камеру ${nextVideo.id}`)

    // Проверяем, не находимся ли мы уже в процессе переключения
    if (isChangingCamera) {
      console.log("[handleSwitchCamera] Уже идет процесс переключения камеры, пропускаем")
      return
    }

    // Сохраняем текущее время воспроизведения и вычисляем относительную позицию (в процентах)
    const currentVideoTime = video?.id && videoRefs[video.id] ? videoRefs[video.id].currentTime : 0
    const currentVideoDuration = video?.duration || 1
    const relativePosition = currentVideoTime / currentVideoDuration

    console.log(
      `[handleSwitchCamera] Текущее время: ${currentVideoTime}, относительная позицию: ${relativePosition.toFixed(3)}`,
    )

    // Сохраняем состояние записи
    const wasRecording = isRecording

    // Временно останавливаем запись, если она активна
    if (wasRecording) {
      console.log(
        "[handleSwitchCamera] Временно приостанавливаем запись для безопасного переключения",
      )
      setIsRecording(false)
    }

    // Устанавливаем флаг переключения камеры
    setIsChangingCamera(true)

    // Устанавливаем новое активное видео и ID
    console.log(`[handleSwitchCamera] Устанавливаем новое активное видео: ${nextVideo.id}`)
    setVideo(nextVideo)
    setActiveVideoId(nextVideo.id)

    // Сбрасываем флаг переключения камеры через небольшую задержку
    setTimeout(() => {
      try {
        // Вычисляем новое время на основе относительной позиции
        if (videoRefs[nextVideo.id]) {
          const nextVideoDuration = nextVideo.duration || 1
          // Используем относительную позицию для вычисления нового времени
          const newTime = relativePosition * nextVideoDuration

          // Устанавливаем новое время для следующего видео
          videoRefs[nextVideo.id].currentTime = newTime
          console.log(
            `[handleSwitchCamera] Установлено время ${newTime.toFixed(3)} для видео ${nextVideo.id} (длительность: ${nextVideoDuration})`,
          )

          // Сбрасываем флаг переключения камеры
          setIsChangingCamera(false)

          // Принудительно обновляем слайдер, устанавливая isSeeking
          setIsSeeking(true)
          setTimeout(() => {
            setIsSeeking(false)

            // Возобновляем запись, если она была активна
            if (wasRecording) {
              console.log("[handleSwitchCamera] Возобновляем запись после переключения камеры")
              setIsRecording(true)

              // Если видео было на паузе, запускаем воспроизведение для записи
              if (!isPlaying) {
                console.log(
                  "[handleSwitchCamera] Автоматически запускаем воспроизведение для записи",
                )
                setIsPlaying(true)
              }
            }
          }, 50)
        } else {
          console.log(`[handleSwitchCamera] Видео элемент для ${nextVideo.id} не найден`)
          setIsChangingCamera(false)

          // Возобновляем запись, если она была активна, даже при ошибке
          if (wasRecording) {
            console.log("[handleSwitchCamera] Возобновляем запись после ошибки")
            setIsRecording(true)
          }
        }
      } catch (error) {
        console.error("[handleSwitchCamera] Ошибка при переключении камеры:", error)
        setIsChangingCamera(false)

        // Возобновляем запись, если она была активна, даже при ошибке
        if (wasRecording) {
          console.log("[handleSwitchCamera] Возобновляем запись после ошибки")
          setIsRecording(true)
        }
      }
    }, 300)
  }, [
    parallelVideos,
    video,
    videoRefs,
    setVideo,
    setIsChangingCamera,
    setIsSeeking,
    isChangingCamera,
    isRecording,
    setIsRecording,
    isPlaying,
    setIsPlaying,
    setActiveVideoId,
  ])

  // Функция для переключения между источниками видео (браузер/таймлайн)
  const handleToggleSource = useCallback(() => {
    // Проверяем, не выполняется ли уже переключение источника
    if (isChangingCamera) {
      console.log("[handleToggleSource] Игнорируем переключение источника во время смены камеры")
      return
    }

    // Выводим информацию о текущем состоянии
    console.log(
      `[handleToggleSource] Текущее состояние: preferredSource=${preferredSource}, activeTrackId=${activeTrackId}, tracks=${tracks.length}, parallelVideos=${parallelVideos.length}`,
    )

    // Если есть активный трек, выводим информацию о нем
    if (activeTrackId) {
      const activeTrack = tracks.find((track) => track.id === activeTrackId)
      console.log(
        `[handleToggleSource] Активный трек: ${activeTrackId}, видео: ${activeTrack?.videos?.length || 0}`,
      )
    }

    // Переключаем предпочтительный источник
    const newSource = preferredSource === "media" ? "timeline" : "media"
    console.log(`[handleToggleSource] Переключаем источник: ${preferredSource} -> ${newSource}`)

    // Устанавливаем флаг, что идет переключение камеры
    setIsChangingCamera(true)

    // Если переключаемся на таймлайн, сначала сбрасываем шаблон
    if (newSource === "timeline" && appliedTemplate) {
      console.log(`[handleToggleSource] Сначала сбрасываем шаблон для гарантии обновления`)
      setAppliedTemplate(null)
    }

    // Устанавливаем новый предпочтительный источник в контексте плеера
    setPreferredSource(newSource)

    // Если переключаемся на таймлайн
    if (newSource === "timeline") {
      console.log(`[handleToggleSource] Переключаемся на таймлайн, проверяем наличие шаблона`)

      // Если есть примененный шаблон, сохраняем его перед переключением
      if (appliedTemplate) {
        console.log(
          `[handleToggleSource] Есть примененный шаблон, сохраняем его перед переключением`,
        )

        // Сохраняем текущий шаблон как последний примененный
        setLastAppliedTemplate(appliedTemplate)
      }

      // Проверяем, есть ли видео в активном треке
      let hasVideosInActiveTrack = false
      if (activeTrackId) {
        const activeTrack = tracks.find((track) => track.id === activeTrackId)
        hasVideosInActiveTrack = !!(activeTrack?.videos && activeTrack.videos.length > 0)
        console.log(
          `[handleToggleSource] Активный трек ${activeTrackId} ${hasVideosInActiveTrack ? "содержит" : "не содержит"} видео`,
        )
      }

      // Если в активном треке нет видео, выводим предупреждение
      if (!hasVideosInActiveTrack) {
        console.log(
          `[handleToggleSource] В активном треке нет видео, переключение может не сработать корректно`,
        )
      }

      // Вызываем метод switchVideoSource для обновления видео в шаблоне
      // Передаем треки, активный трек и параллельные видео
      switchVideoSource(tracks, activeTrackId, parallelVideos)

      // Добавляем дополнительную проверку через небольшую задержку
      setTimeout(() => {
        console.log(
          `[handleToggleSource] Проверяем, что переключение на таймлайн выполнено корректно`,
        )

        // Повторно вызываем switchVideoSource для гарантии обновления
        if (hasVideosInActiveTrack) {
          console.log(
            `[handleToggleSource] Повторно вызываем switchVideoSource для гарантии обновления`,
          )
          switchVideoSource(tracks, activeTrackId, parallelVideos)

          // Если есть примененный шаблон, принудительно обновляем его
          if (appliedTemplate) {
            console.log(`[handleToggleSource] Принудительно обновляем шаблон для таймлайна`)

            // Получаем видео из активного трека
            const activeTrack = tracks.find((track) => track.id === activeTrackId)
            if (activeTrack?.videos && activeTrack.videos.length > 0) {
              // Создаем копию шаблона
              const templateCopy = JSON.parse(JSON.stringify(appliedTemplate))

              // Заполняем шаблон видео из таймлайна
              const requiredVideos = templateCopy.template?.screens || 1
              templateCopy.videos = activeTrack.videos.slice(0, requiredVideos).map((video) => ({
                ...video,
                source: "timeline", // Явно устанавливаем источник как timeline
              }))

              console.log(
                `[handleToggleSource] Обновляем шаблон с ${templateCopy.videos.length} видео из таймлайна`,
              )

              // Сначала сбрасываем шаблон, чтобы гарантировать обновление
              setAppliedTemplate(null)

              // Через небольшую задержку устанавливаем обновленный шаблон
              setTimeout(() => {
                setAppliedTemplate(templateCopy)

                // Устанавливаем первое видео из таймлайна как активное
                if (templateCopy.videos.length > 0) {
                  setActiveVideoId(templateCopy.videos[0].id)
                  setVideo(templateCopy.videos[0])
                  console.log(
                    `[handleToggleSource] Установлено активное видео из таймлайна: ${templateCopy.videos[0].id}`,
                  )
                }
              }, 50)
            }
          }
        }
      }, 300)
    }
    // Если переключаемся на браузер
    else {
      console.log(`[handleToggleSource] Переключаемся на браузер, проверяем наличие шаблона`)

      // Если есть примененный шаблон, сохраняем его перед переключением
      if (appliedTemplate) {
        console.log(
          `[handleToggleSource] Есть примененный шаблон, сохраняем его перед переключением`,
        )

        // Сохраняем текущий шаблон как последний примененный
        setLastAppliedTemplate(appliedTemplate)
      }

      // Вызываем метод switchVideoSource для обновления видео в шаблоне
      // Передаем треки, активный трек и параллельные видео
      switchVideoSource(tracks, activeTrackId, parallelVideos)
    }

    // Сбрасываем флаг autoSelectVideoExecuted, чтобы разрешить автоматический выбор видео
    autoSelectVideoExecutedRef.current = false

    // Сбрасываем флаг переключения камеры через небольшую задержку
    setTimeout(() => {
      setIsChangingCamera(false)
    }, 300)
  }, [
    preferredSource,
    setPreferredSource,
    switchVideoSource,
    tracks,
    activeTrackId,
    parallelVideos,
    isChangingCamera,
    setIsChangingCamera,
    appliedTemplate,
    setLastAppliedTemplate,
  ])

  // Улучшенный handleRecordToggle для корректной работы с параллельными видео
  const handleRecordToggle = useCallback(() => {
    // Если идет процесс переключения камеры, игнорируем нажатие
    if (isChangingCamera) {
      console.log("[handleRecordToggle] Игнорируем переключение записи во время смены камеры")
      return
    }

    if (isRecording) {
      console.log("[handleRecordToggle] Останавливаем запись")
      setIsRecording(false)

      // Также останавливаем воспроизведение при остановке записи
      if (isPlaying) {
        console.log(
          "[handleRecordToggle] Автоматически останавливаем воспроизведение при остановке записи",
        )
        setIsPlaying(false)

        // Устанавливаем первый кадр видео
        if (video) {
          const videoStartTime = video.startTime || 0
          console.log(`[handleRecordToggle] Устанавливаем первый кадр видео: ${videoStartTime}`)
          setCurrentTime(videoStartTime)
        }
      }
    } else {
      const trackId = activeTrackId || video?.id || ""
      if (trackId) {
        console.log("[handleRecordToggle] Начинаем запись для трека:", trackId)

        // Если видео на паузе, запускаем воспроизведение
        if (!isPlaying && video?.id && videoRefs[video.id]) {
          console.log("[handleRecordToggle] Автоматически запускаем воспроизведение для записи")
          setIsPlaying(true)
        }

        setIsRecording(true)
      } else {
        console.warn("Не удалось начать запись: отсутствует активный трек и активное видео")
      }
    }
  }, [
    isRecording,
    setIsRecording,
    activeTrackId,
    video,
    isChangingCamera,
    isPlaying,
    videoRefs,
    setIsPlaying,
  ])

  // Функция для получения активного видео в различных контекстах (шаблон, трек)
  const getActiveVideo = useCallback((): MediaFile | undefined => {
    // Если есть активное видео, возвращаем его
    if (video) {
      return video
    }

    // Если есть шаблон с видео, возвращаем первое видео из шаблона
    if (appliedTemplate?.videos && appliedTemplate.videos.length > 0) {
      return appliedTemplate.videos[0]
    }

    // Если есть активный трек, возвращаем первое видео из трека
    if (activeTrackId) {
      const activeTrack = tracks.find((track) => track.id === activeTrackId)
      if (activeTrack?.videos && activeTrack.videos.length > 0) {
        return activeTrack.videos[0]
      }
    }

    // Если есть параллельные видео, возвращаем первое из них
    if (parallelVideos && parallelVideos.length > 0) {
      return parallelVideos[0]
    }

    // Если ничего не найдено, возвращаем undefined
    return undefined
  }, [video, appliedTemplate, activeTrackId, tracks, parallelVideos])

  // Нормализуем currentTime для отображения, если это Unix timestamp
  const calculatedDisplayTime = useMemo(() => {
    if (currentTime > 365 * 24 * 60 * 60) {
      // Если время больше года в секундах, это, вероятно, Unix timestamp
      // Используем локальное время для отображения
      return localDisplayTime
    }
    return currentTime
  }, [currentTime, localDisplayTime])

  // Ref для отслеживания предыдущего значения calculatedDisplayTime
  const prevTimeRef = useRef(calculatedDisplayTime)

  // Используем хук для управления временем
  const { handleTimeChange, formatRelativeTime, formatSectorTime, getDisplayVideo } =
    useTimeControl({
      video,
      videoRefs,
      currentTime,
      setCurrentTime,
      setIsSeeking,
      isChangingCamera,
      parallelVideos,
      appliedTemplate,
      setLocalDisplayTime,
      activeVideoId, // Передаем ID активного видео
    })

  // Используем хук для управления воспроизведением
  const {
    handleSkipBackward,
    handleSkipForward,
    handleChevronFirst,
    handleChevronLast,
    handlePlayPause,
  } = usePlaybackControl({
    video,
    videoRefs,
    currentTime,
    setCurrentTime,
    isPlaying,
    setIsPlaying,
    isChangingCamera,
    activeTrackId,
    tracks,
    parallelVideos,
    appliedTemplate,
    calculatedDisplayTime,
  })

  // Используем currentTime для isFirstFrame / isLastFrame
  // Получаем frameTime с помощью функции getFrameTime
  const frameTime = getFrameTime(video || undefined)
  console.log(
    `[PlayerControls] Используем frameTime: ${frameTime} (${1 / frameTime} fps) для видео ${video?.id || "unknown"}`,
  )

  // Функции форматирования времени перенесены в хук useTimeControl

  // videoRefs уже получен выше

  // Упрощенный механизм отслеживания времени видео
  useEffect(() => {
    // Если нет видео или не воспроизводится, выходим
    if (!video?.id || !videoRefs || !isPlaying) return

    // Получаем видео для отслеживания времени
    const videoToTrack = getDisplayVideo()
    if (!videoToTrack?.id) return

    // Получаем элемент видео
    const videoElement = videoRefs[videoToTrack.id]
    if (!videoElement) return

    // Простая функция обновления времени
    const handleTimeUpdate = () => {
      const newTime = videoElement.currentTime
      setLocalDisplayTime(newTime)
      setDisplayTime(newTime)
    }

    // Добавляем обработчик события timeupdate
    videoElement.addEventListener("timeupdate", handleTimeUpdate)

    // Функция очистки
    return () => {
      videoElement.removeEventListener("timeupdate", handleTimeUpdate)
    }
  }, [video?.id, videoRefs, isPlaying, setDisplayTime])

  // Обновляем контекст при изменении calculatedDisplayTime
  // Но только если не воспроизводится видео, чтобы избежать конфликта с updateTime
  useEffect(() => {
    // Обновляем только если время изменилось существенно и видео не воспроизводится
    if (!isPlaying && Math.abs(prevTimeRef.current - calculatedDisplayTime) > 0.05) {
      setDisplayTime(calculatedDisplayTime)

      // Убираем лишнее логирование для улучшения производительности

      // Обновляем предыдущее значение
      prevTimeRef.current = calculatedDisplayTime
    }
  }, [calculatedDisplayTime, setDisplayTime, isPlaying])

  // Эффект для обновления иконки источника после гидратации
  const [isHydrated, setIsHydrated] = useState(false)
  useEffect(() => {
    // Устанавливаем флаг гидратации после монтирования компонента
    setIsHydrated(true)
  }, [])

  // Эффект для автоматического выбора активного видео, если текущее активное видео не определено
  // Используем ref для отслеживания, был ли уже выполнен эффект
  const autoSelectVideoExecutedRef = useRef(false)

  // Эффект для инициализации источника видео при загрузке страницы
  useEffect(() => {
    // Если эффект уже был выполнен, ничего не делаем
    if (autoSelectVideoExecutedRef.current) return

    // Проверяем, есть ли видео на таймлайне
    const hasTimelineVideos = tracks.some((track) => track.videos && track.videos.length > 0)

    // Если на таймлайне нет видео, устанавливаем источник в режим "браузер"
    if (!hasTimelineVideos) {
      console.log(`[InitSource] На таймлайне нет видео, устанавливаем источник в режим "браузер"`)

      // Устанавливаем источник в режим "браузер"
      setPreferredSource("media")

      // Получаем все медиафайлы из библиотеки
      if (media.allMediaFiles && media.allMediaFiles.length > 0) {
        // Фильтруем только видеофайлы с путями
        const validMediaFiles = media.allMediaFiles.filter((file) => file.isVideo && file.path)

        if (validMediaFiles.length > 0) {
          // Сортируем по имени (в будущем можно добавить сортировку по дате добавления)
          const sortedMediaFiles = [...validMediaFiles].sort((a, b) => {
            // Сортируем по имени
            return (a.name || "").localeCompare(b.name || "")
          })

          // Берем несколько видео для параллельного отображения (до 4)
          const selectedVideos = sortedMediaFiles.slice(0, 4)

          console.log(`[InitSource] Выбрано ${selectedVideos.length} видео из браузера`)

          // Устанавливаем первое видео как активное
          setVideo(selectedVideos[0])
          setActiveVideoId(selectedVideos[0].id)

          // Обновляем параллельные видео
          setParallelVideos(selectedVideos)

          console.log(
            `[InitSource] Установлены параллельные видео: ${selectedVideos.map((v) => v.id).join(", ")}`,
          )

          // Если есть примененный шаблон, обновляем его с новыми видео
          if (appliedTemplate) {
            console.log(`[InitSource] Обновляем примененный шаблон с новыми видео`)

            // Создаем копию шаблона
            const templateCopy = JSON.parse(JSON.stringify(appliedTemplate))

            // Заполняем шаблон видео из браузера
            const screensCount = templateCopy.template?.screens || 1
            templateCopy.videos = selectedVideos.slice(0, screensCount).map((video) => ({
              ...video,
              source: "media", // Явно устанавливаем источник как media
            }))

            // Применяем обновленный шаблон
            setAppliedTemplate(templateCopy)

            console.log(
              `[InitSource] Шаблон обновлен с ${templateCopy.videos.length} видео из браузера`,
            )
          }
        }
      }
    }

    // Помечаем, что эффект был выполнен
    autoSelectVideoExecutedRef.current = true
  }, [
    tracks,
    setPreferredSource,
    media.allMediaFiles,
    setVideo,
    setActiveVideoId,
    setParallelVideos,
    appliedTemplate,
    setAppliedTemplate,
  ])

  useEffect(() => {
    // Если уже есть активное видео или эффект уже был выполнен, ничего не делаем
    if (video || autoSelectVideoExecutedRef.current) return

    // Помечаем, что эффект был выполнен
    autoSelectVideoExecutedRef.current = true

    // Получаем активное видео
    const activeVideo = getActiveVideo()

    // Если нашли активное видео и оно отличается от текущего, устанавливаем его
    if (activeVideo && activeVideo !== video) {
      console.log(`[AutoSelectActiveVideo] Автоматически выбрано активное видео: ${activeVideo.id}`)
      setVideo(activeVideo)
      setActiveVideoId(activeVideo.id)
    }
  }, [video, getActiveVideo, setVideo, setActiveVideoId])

  // Создаем мемоизированные значения для начального и конечного времени
  const startTimeForFirstFrame = useMemo(() => {
    if (activeTrackId) {
      const activeTrack = tracks.find((track) => track.id === activeTrackId)
      if (activeTrack && activeTrack.videos && activeTrack.videos.length > 0) {
        const firstVideo = activeTrack.videos[0]
        if (firstVideo) {
          return firstVideo.startTime || 0
        }
      }
    }
    return video?.startTime || 0
  }, [activeTrackId, tracks, video])

  const endTimeForLastFrame = useMemo(() => {
    if (activeTrackId) {
      const activeTrack = tracks.find((track) => track.id === activeTrackId)
      if (activeTrack && activeTrack.videos && activeTrack.videos.length > 0) {
        const lastVideo = activeTrack.videos[activeTrack.videos.length - 1]
        if (lastVideo) {
          return (lastVideo.startTime || 0) + (lastVideo.duration || 0)
        }
      }
    }
    return (video?.startTime || 0) + (video?.duration || 0)
  }, [activeTrackId, tracks, video])

  // Определяем isFirstFrame и isLastFrame на основе мемоизированных значений
  const isFirstFrame = useMemo(() => {
    return Math.abs(currentTime - startTimeForFirstFrame) < frameTime
  }, [currentTime, startTimeForFirstFrame, frameTime])

  const isLastFrame = useMemo(() => {
    return Math.abs(currentTime - endTimeForLastFrame) < frameTime
  }, [currentTime, endTimeForLastFrame, frameTime])

  return (
    <div className="flex w-full flex-col">
      {/* Прогресс-бар и время */}
      <div className="px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="relative h-1 w-full rounded-full border border-white bg-gray-800">
              <div
                className="absolute top-0 left-0 h-full rounded-full bg-white"
                style={{
                  width: `${(Math.max(0, calculatedDisplayTime) / (getDisplayVideo()?.duration || 100)) * 100}%`,
                }}
              />
              <div
                className="absolute top-1/2 h-[13px] w-[13px] -translate-y-1/2 rounded-full border border-white bg-white"
                style={{
                  left: `calc(${(Math.max(0, calculatedDisplayTime) / (getDisplayVideo()?.duration || 100)) * 100}% - 6px)`,
                }}
              />
              <Slider
                value={[Math.max(0, calculatedDisplayTime)]}
                min={0}
                max={getDisplayVideo()?.duration || 100}
                step={0.001}
                onValueChange={handleTimeChange}
                className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                disabled={isChangingCamera} // Отключаем слайдер во время переключения камеры
              />
            </div>
          </div>
          <span className="rounded-md bg-white px-1 text-xs text-black dark:bg-black dark:text-white">
            {currentTime > 365 * 24 * 60 * 60
              ? formatSectorTime(Math.max(0, calculatedDisplayTime), getDisplayVideo()?.startTime)
              : formatRelativeTime(Math.max(0, calculatedDisplayTime))}
          </span>
          <span className="mb-[3px]">/</span>
          <span className="rounded-md bg-white px-1 text-xs text-black dark:bg-black dark:text-white">
            {currentTime > 365 * 24 * 60 * 60
              ? formatSectorTime(getDisplayVideo()?.duration || 0, getDisplayVideo()?.startTime)
              : formatRelativeTime(getDisplayVideo()?.duration || 0)}
          </span>

          {/* Скрытый элемент для обновления компонента при воспроизведении */}
          {currentTime > 365 * 24 * 60 * 60 && (
            <span className="hidden">
              {localDisplayTime.toFixed(3)} - {calculatedDisplayTime.toFixed(3)}
            </span>
          )}
        </div>
      </div>

      <div className="h-full w-full p-1">
        <div className="flex items-center justify-between px-1 py-0">
          {/* Левая часть: индикатор источника, кнопки для камер и шаблонов */}
          <div className="flex items-center gap-2">
            {/* Индикатор источника видео - всегда отображается и работает как переключатель */}
            <Button
              className={`h-8 w-8 cursor-pointer ${!isHydrated || preferredSource === "timeline" ? "bg-[#45444b] hover:bg-[#45444b]/80" : "hover:bg-[#45444b]/80"}`}
              variant="ghost"
              size="icon"
              title={
                !isHydrated
                  ? "Timeline"
                  : preferredSource === "timeline"
                    ? t("timeline.source.timeline", "Таймлайн")
                    : t("timeline.source.browser", "Браузер")
              }
              onClick={handleToggleSource}
            >
              {/* Используем isHydrated для условного рендеринга иконки */}
              {!isHydrated || preferredSource === "timeline" ? (
                <TvMinimalPlay className="h-8 w-8" />
              ) : (
                <GalleryThumbnails className="h-8 w-8" />
              )}
            </Button>

            {/* Кнопка шаблона - всегда активна, переключает режим шаблона */}
            <Button
              className="h-8 w-8 cursor-pointer"
              variant="ghost"
              size="icon"
              title={
                typeof window !== "undefined"
                  ? t("timeline.controlsMain.resetTemplate") || "Сбросить шаблон"
                  : "Reset Template"
              }
              onClick={handleResetTemplate}
            >
              {appliedTemplate ? (
                <Grid2x2 className="h-8 w-8" />
              ) : (
                <SquarePlay className="h-8 w-8" />
              )}
            </Button>

            {/* Кнопка переключения режима resizable - показываем только если применен шаблон */}
            <Button
              className={`h-8 w-8 cursor-pointer ${isResizableMode ? "bg-[#45444b] hover:bg-[#45444b]/80" : "hover:bg-[#45444b]/80"}`}
              variant="ghost"
              size="icon"
              title={
                typeof window !== "undefined"
                  ? isResizableMode
                    ? t("timeline.controlsMain.fixedSizeMode")
                    : t("timeline.controlsMain.resizableMode")
                  : ""
              }
              onClick={() => setIsResizableMode(!isResizableMode)}
              disabled={!appliedTemplate}
            >
              {<UnfoldHorizontal className="h-8 w-8" />}
            </Button>

            {/* Кнопка снимка экрана */}
            <Button
              className="h-8 w-8 cursor-pointer"
              variant="ghost"
              size="icon"
              title={
                typeof window !== "undefined"
                  ? t("timeline.controls.takeSnapshot")
                  : "Take snapshot"
              }
              onClick={takeSnapshot}
            >
              <Camera className="h-8 w-8" />
            </Button>

            {/* Кнопка переключения между камерами - показываем только если есть параллельные видео */}
            {parallelVideos && parallelVideos.length > 1 && (
              <Button
                className={`h-8 w-8 cursor-pointer ${isChangingCamera ? "animate-pulse" : ""}`}
                variant="ghost"
                size="icon"
                title={
                  typeof window !== "undefined"
                    ? `${t("timeline.controlsMain.switchCamera")} (${parallelVideos.findIndex((v) => v.id === video?.id) + 1}/${parallelVideos.length})`
                    : "Switch Camera"
                }
                onClick={handleSwitchCamera}
                disabled={isChangingCamera}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10 17a2 2 0 1 1 4 0 2 2 0 0 1-4 0Z" />
                  <path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2" />
                  <path d="M10 13H8a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2" />
                  <path d="M10 8V7a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1" />
                  <path d="M12 17v-9" />
                </svg>
              </Button>
            )}
          </div>

          {/* Центральная часть: кнопки управления воспроизведением */}
          <div
            className="flex items-center justify-center gap-2"
            style={{ flex: "1", marginLeft: "auto", marginRight: "auto" }}
          >
            <Button
              className="h-8 w-8 cursor-pointer"
              variant="ghost"
              size="icon"
              title={
                typeof window !== "undefined" ? t("timeline.controls.firstFrame") : "First frame"
              }
              onClick={handleChevronFirst}
              disabled={isFirstFrame || isPlaying || isChangingCamera}
            >
              <ChevronFirst className="h-8 w-8" />
            </Button>

            <Button
              className="h-8 w-8 cursor-pointer"
              variant="ghost"
              size="icon"
              title={
                typeof window !== "undefined"
                  ? t("timeline.controls.previousFrame")
                  : "Previous frame"
              }
              onClick={handleSkipBackward}
              disabled={isFirstFrame || isPlaying || isChangingCamera}
            >
              <StepBack className="h-8 w-8" />
            </Button>

            <Button
              className="h-8 w-8 cursor-pointer"
              variant="ghost"
              size="icon"
              title={
                typeof window !== "undefined"
                  ? isPlaying
                    ? t("timeline.controls.pause")
                    : t("timeline.controls.play")
                  : "Play"
              }
              onClick={handlePlayPause}
              disabled={isChangingCamera}
            >
              {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
            </Button>

            <Button
              className={"h-8 w-8 cursor-pointer"}
              variant="ghost"
              size="icon"
              title={
                typeof window !== "undefined"
                  ? isRecording
                    ? t("timeline.controls.stopRecord")
                    : t("timeline.controls.record")
                  : "Record"
              }
              onClick={handleRecordToggle}
              disabled={isChangingCamera} // Отключаем кнопку во время переключения камеры
            >
              <CircleDot
                className={cn(
                  "h-8 w-8",
                  isRecording
                    ? "animate-pulse text-red-500 hover:text-red-600"
                    : "text-white hover:text-gray-300",
                )}
              />
            </Button>

            <Button
              className="h-8 w-8 cursor-pointer"
              variant="ghost"
              size="icon"
              title={
                typeof window !== "undefined" ? t("timeline.controls.nextFrame") : "Next frame"
              }
              onClick={handleSkipForward}
              disabled={isLastFrame || isPlaying || isChangingCamera}
            >
              <StepForward className="h-8 w-8" />
            </Button>

            <Button
              className="h-8 w-8 cursor-pointer"
              variant="ghost"
              size="icon"
              title={
                typeof window !== "undefined" ? t("timeline.controls.lastFrame") : "Last frame"
              }
              onClick={handleChevronLast}
              disabled={isLastFrame || isPlaying || isChangingCamera}
            >
              <ChevronLast className="h-8 w-8" />
            </Button>
          </div>

          {/* Правая часть: кнопки управления звуком и полноэкранным режимом */}
          <div className="flex items-center gap-2" style={{ justifyContent: "flex-end" }}>
            <div className="flex items-center gap-2">
              <Button
                className="h-8 w-8 cursor-pointer"
                variant="ghost"
                size="icon"
                title={
                  typeof window !== "undefined"
                    ? volume === 0
                      ? t("timeline.controls.unmuteAudio")
                      : t("timeline.controls.muteAudio")
                    : "Mute audio"
                }
                onClick={handleToggleMute}
              >
                {volume === 0 ? <VolumeX className="h-8 w-8" /> : <Volume2 className="h-8 w-8" />}
              </Button>
              <div className="w-20">
                <VolumeSlider
                  volume={volume}
                  volumeRef={volumeRef}
                  onValueChange={handleVolumeChange}
                  onValueCommit={handleVolumeChangeEnd}
                />
              </div>
            </div>

            <Button
              className={`ml-1 h-8 w-8 ${!video && !parallelVideos.length ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
              variant="ghost"
              size="icon"
              title={
                typeof window !== "undefined"
                  ? isFullscreen
                    ? t("timeline.controls.exitFullscreen")
                    : t("timeline.controls.fullscreen")
                  : "Fullscreen"
              }
              onClick={handleFullscreen}
              disabled={!video && !parallelVideos.length}
            >
              {isFullscreen ? <Minimize2 className="h-8 w-8" /> : <Maximize2 className="h-8 w-8" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
