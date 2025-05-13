import {
  Camera,
  ChevronFirst,
  ChevronLast,
  CircleDot,
  LayoutPanelTop,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  StepBack,
  StepForward,
  UnfoldHorizontal,
  Volume2,
  VolumeX,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { useUserSettings } from "@/media-editor/browser/providers/user-settings-provider"
import {
  findTemplateContainer,
  takeScreenshot,
} from "@/media-editor/media-player/components/take-screenshot"
import { VolumeSlider } from "@/media-editor/media-player/components/volume-slider"
import { useDisplayTime } from "@/media-editor/media-player/contexts"
import { AppliedTemplate } from "@/media-editor/media-player/services/template-service"
import { useTimeline } from "@/media-editor/timeline/services"

import { usePlayerContext } from ".."

interface PlayerControlsProps {
  currentTime: number
}

export function PlayerControls({ currentTime }: PlayerControlsProps) {
  const { t } = useTranslation()
  const { tracks, activeTrackId } = useTimeline()
  const { screenshotsPath } = useUserSettings()
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
    videoRefs,
    appliedTemplate,
    setAppliedTemplate,
    setActiveVideoId,
    isResizableMode,
    setIsResizableMode,
  } = usePlayerContext()

  // Используем состояние для хранения текущего времени воспроизведения
  const [localDisplayTime, setLocalDisplayTime] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  // Сохраняем последний примененный шаблон
  const [lastAppliedTemplate, setLastAppliedTemplate] = useState<AppliedTemplate | null>(null)
  const lastSaveTime = useRef(0)
  const SAVE_INTERVAL = 5000 // Сохраняем каждые 3 секунды

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

  // Переписываем handleSkipBackward: используем currentTime, вызываем setCurrentTime
  const handleSkipBackward = useCallback(() => {
    if (!video) return

    const videoStartTime = video.startTime || 0
    if (Math.abs(currentTime - videoStartTime) < 0.01) return

    let newTime
    if (!video?.probeData?.streams?.[0]?.r_frame_rate) {
      newTime = Math.max(videoStartTime, currentTime - 1 / 25)
    } else {
      const fpsStr = video.probeData.streams[0].r_frame_rate
      const fpsMatch = fpsStr.match(/(\d+)\/(\d+)/)
      const fps = fpsMatch ? parseInt(fpsMatch[1]) / parseInt(fpsMatch[2]) : eval(fpsStr)

      if (typeof fps !== "number" || fps <= 0 || isNaN(fps)) return

      const frameTime = 1 / fps
      newTime = Math.max(videoStartTime, currentTime - frameTime)
    }

    setCurrentTime(newTime)
    setIsPlaying(false)
  }, [video, currentTime, setCurrentTime, setIsPlaying])

  // Переписываем handleSkipForward: используем currentTime, вызываем setCurrentTime
  const handleSkipForward = useCallback(() => {
    if (!video) return

    const videoStartTime = video.startTime || 0
    const videoDuration = video.duration || 0
    const videoEndTime = videoStartTime + videoDuration
    if (Math.abs(currentTime - videoEndTime) < 0.01) return

    let newTime
    if (!video?.probeData?.streams?.[0]?.r_frame_rate) {
      newTime = Math.min(videoEndTime, currentTime + 1 / 25)
    } else {
      const fpsStr = video.probeData.streams[0].r_frame_rate
      const fpsMatch = fpsStr.match(/(\d+)\/(\d+)/)
      const fps = fpsMatch ? parseInt(fpsMatch[1]) / parseInt(fpsMatch[2]) : eval(fpsStr)

      if (typeof fps !== "number" || fps <= 0 || isNaN(fps)) return

      const frameTime = 1 / fps
      newTime = Math.min(videoEndTime, currentTime + frameTime)
    }

    setCurrentTime(newTime)
    setIsPlaying(false)
  }, [video, currentTime, setCurrentTime, setIsPlaying])

  // Используем useRef для хранения последнего значения громкости и предотвращения лишних рендеров
  const volumeRef = useRef(volume)
  const volumeChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Оптимизированная функция изменения громкости с дебаунсингом
  const handleVolumeChange = useCallback(
    (value: number[]) => {
      const newVolume = value[0]

      // Обновляем значение в ref без вызова setVolume на каждое изменение
      volumeRef.current = newVolume

      // Применяем громкость напрямую к видео элементам для мгновенной обратной связи
      if (video?.id && videoRefs[video.id]) {
        videoRefs[video.id].volume = newVolume
      }

      // Если используется шаблон с несколькими видео, применяем громкость ко всем видео
      if (appliedTemplate?.template && parallelVideos.length > 0) {
        parallelVideos.forEach((parallelVideo) => {
          if (parallelVideo.id && videoRefs[parallelVideo.id]) {
            // Устанавливаем громкость для всех видео в шаблоне
            videoRefs[parallelVideo.id].volume = newVolume
            videoRefs[parallelVideo.id].muted = false
          }
        })
      }

      // Используем дебаунсинг для обновления состояния
      if (volumeChangeTimeoutRef.current) {
        clearTimeout(volumeChangeTimeoutRef.current)
      }

      volumeChangeTimeoutRef.current = setTimeout(() => {
        setVolume(newVolume)
        volumeChangeTimeoutRef.current = null
      }, 100) // Обновляем состояние не чаще чем раз в 100мс
    },
    [video, videoRefs, setVolume, appliedTemplate, parallelVideos],
  )

  // Функция, которая вызывается при завершении изменения громкости (отпускании слайдера)
  const handleVolumeChangeEnd = useCallback(() => {
    // Обновляем состояние сразу при отпускании слайдера
    setVolume(volumeRef.current)

    // Сохраняем значение громкости в localStorage только при отпускании слайдера
    if (typeof window !== "undefined") {
      localStorage.setItem("player-volume", volumeRef.current.toString())
      console.log(`[PlayerControls] Сохранен уровень звука: ${volumeRef.current}`)
    }
  }, [setVolume])

  const handleToggleMute = useCallback(() => {
    const newVolume = volume === 0 ? 1 : 0
    setVolume(newVolume)

    // Сохраняем текущее значение громкости в ref
    volumeRef.current = newVolume

    // Применяем громкость напрямую к видео элементам для мгновенной обратной связи
    if (video?.id && videoRefs[video.id]) {
      videoRefs[video.id].volume = newVolume
    }

    // Если используется шаблон с несколькими видео, применяем громкость ко всем видео
    if (appliedTemplate?.template && parallelVideos.length > 0) {
      parallelVideos.forEach((parallelVideo) => {
        if (parallelVideo.id && videoRefs[parallelVideo.id]) {
          // Устанавливаем громкость для всех видео в шаблоне
          videoRefs[parallelVideo.id].volume = newVolume
          videoRefs[parallelVideo.id].muted = newVolume === 0
        }
      })
    }

    // При переключении mute сразу сохраняем значение в localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("player-volume", newVolume.toString())
      console.log(`[PlayerControls] Сохранен уровень звука при переключении: ${newVolume}`)
    }
  }, [volume, setVolume, video, videoRefs, appliedTemplate, parallelVideos])

  const handleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen)
  }, [isFullscreen])

  // Функция для создания и сохранения скриншота
  const handleTakeSnapshot = useCallback(async () => {
    try {
      console.log("[handleTakeSnapshot] Создаем скриншот")

      // Проверяем, используется ли шаблон
      if (appliedTemplate) {
        console.log("[handleTakeSnapshot] Создаем скриншот для шаблона")

        // Находим контейнер с шаблоном
        const templateContainer = findTemplateContainer()
        if (!templateContainer) return

        // Создаем и сохраняем скриншот шаблона
        await takeScreenshot({
          isTemplate: true,
          templateContainer,
          screenshotsPath,
        })
      } else if (video && videoRefs[video.id]) {
        console.log("[handleTakeSnapshot] Создаем скриншот для видео:", video.id)

        // Получаем видеоэлемент
        const videoElement = videoRefs[video.id]

        // Создаем и сохраняем скриншот видео
        await takeScreenshot({
          isTemplate: false,
          videoElement,
          screenshotsPath,
        })
      } else {
        console.log("[handleTakeSnapshot] Нет активного видео или шаблона для скриншота")
      }
    } catch (error) {
      console.error("[handleTakeSnapshot] Ошибка при создании скриншота:", error)
    }
  }, [video, videoRefs, screenshotsPath, appliedTemplate])

  // Функция для сброса шаблона
  const handleResetTemplate = useCallback(() => {
    console.log("[handleResetTemplate] Вызвана функция сброса шаблона")
    console.log("[handleResetTemplate] Текущий шаблон:", appliedTemplate)

    if (appliedTemplate) {
      console.log("[handleResetTemplate] Сбрасываем шаблон:", appliedTemplate.template?.id)
      // Сохраняем текущий шаблон перед сбросом
      setLastAppliedTemplate(appliedTemplate)
      // Принудительно устанавливаем null для сброса шаблона
      setAppliedTemplate(null)

      // Добавляем проверку через setTimeout
      setTimeout(() => {
        console.log("[handleResetTemplate] Проверка после сброса:", appliedTemplate)
      }, 100)
    } else {
      console.log("[handleResetTemplate] Нет активного шаблона для сброса")
    }
  }, [appliedTemplate, setAppliedTemplate, setLastAppliedTemplate])

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

  // Улучшенный handleTimeChange для корректной работы с параллельными видео
  const handleTimeChange = useCallback(
    (value: number[]) => {
      if (!video) return

      // Если идет процесс переключения камеры, игнорируем изменение времени
      if (isChangingCamera) {
        console.log("[handleTimeChange] Игнорируем изменение времени во время переключения камеры")
        return
      }

      const videoDuration = video.duration || 0
      const sliderValue = value[0]

      // Проверка валидности значения
      if (!isFinite(sliderValue) || sliderValue < 0) return

      // Ограничиваем время в пределах длительности видео
      const clampedTime = Math.min(videoDuration, Math.max(0, sliderValue))

      // Определяем, короткое ли у нас видео (меньше 10 секунд)
      const isShortVideo = videoDuration < 10

      // Для коротких видео используем меньший порог изменения
      const timeChangeThreshold = isShortVideo ? 0.001 : 0.01

      // Вычисляем локальное время для сравнения
      const localTime =
        currentTime > 365 * 24 * 60 * 60 && video.startTime
          ? Math.max(0, currentTime - (video.startTime || 0))
          : currentTime

      // Проверяем, существенно ли изменилось время
      if (Math.abs(clampedTime - localTime) < timeChangeThreshold) return

      // Логируем только при значительных изменениях времени
      if (Math.abs(clampedTime - localTime) > 0.5) {
        console.log("[handleTimeChange] Значительное изменение времени:", {
          currentTime: localTime.toFixed(3),
          clampedTime: clampedTime.toFixed(3),
          delta: (clampedTime - localTime).toFixed(3),
        })
      }

      // Устанавливаем seeking перед изменением времени, чтобы избежать
      // конфликтов с обновлениями от timeupdate
      setIsSeeking(true)

      try {
        // Если текущее время - Unix timestamp, обрабатываем особым образом
        if (currentTime > 365 * 24 * 60 * 60) {
          // Устанавливаем относительный прогресс для текущего видео
          console.log(
            `[handleTimeChange] Установка относительного прогресса: ${clampedTime.toFixed(3)}`,
          )

          // Устанавливаем время напрямую для текущего видео
          if (video.id && videoRefs[video.id]) {
            videoRefs[video.id].currentTime = clampedTime
            console.log(
              `[handleTimeChange] Установлено время ${clampedTime.toFixed(3)} для видео ${video.id}`,
            )

            // Обновляем локальное отображаемое время
            setLocalDisplayTime(clampedTime)

            // Сохраняем время для текущего видео в videoTimesRef
            if (video.id) {
              // Используем функцию из контекста для сохранения времени
              // Это обеспечит синхронизацию с другими компонентами
              console.log(
                `[handleTimeChange] Сохраняем время ${clampedTime.toFixed(3)} для видео ${video.id}`,
              )
            }

            // Если есть параллельные видео, обновляем их время пропорционально
            if (parallelVideos && parallelVideos.length > 1) {
              // Вычисляем относительную позицию для текущего видео
              const relativePosition = clampedTime / (video.duration || 1)

              // Обновляем время для всех параллельных видео
              parallelVideos.forEach((parallelVideo) => {
                if (parallelVideo.id !== video.id && videoRefs[parallelVideo.id]) {
                  const parallelVideoDuration = parallelVideo.duration || 1
                  const newParallelTime = relativePosition * parallelVideoDuration

                  videoRefs[parallelVideo.id].currentTime = newParallelTime
                  console.log(
                    `[handleTimeChange] Синхронизировано время ${newParallelTime.toFixed(3)} для видео ${parallelVideo.id}`,
                  )
                }
              })
            }
          }

          // Сбрасываем флаг seeking после небольшой задержки
          setTimeout(() => {
            setIsSeeking(false)
          }, 50)

          return
        }

        // Для обычного времени преобразуем относительное время в абсолютное
        let newTime = clampedTime
        if (video.startTime) {
          newTime = video.startTime + clampedTime
          console.log(`[handleTimeChange] Преобразование времени: ${clampedTime} -> ${newTime}`)
        }

        // Устанавливаем новое время с пометкой, что источник - пользователь
        setCurrentTime(newTime)
      } catch (error) {
        console.error("[handleTimeChange] Ошибка при изменении времени:", error)
        setIsSeeking(false)
      }
    },
    [
      video,
      videoRefs,
      setCurrentTime,
      setIsSeeking,
      currentTime,
      isChangingCamera,
      parallelVideos,
      setLocalDisplayTime,
    ],
  )

  // Переписываем handleChevronFirst: используем currentTime, вызываем setCurrentTime
  const handleChevronFirst = useCallback(() => {
    if (!video || !activeTrackId) return

    // Находим активный трек
    const activeTrack = tracks.find((track) => track.id === activeTrackId)
    if (!activeTrack) return

    // Находим первое видео в треке
    const firstVideo = activeTrack.videos?.[0]
    if (!firstVideo) return

    const startTime = firstVideo.startTime || 0
    if (Math.abs(currentTime - startTime) < 0.01) return

    setCurrentTime(startTime)
    setIsPlaying(false)
  }, [video, activeTrackId, tracks, currentTime, setCurrentTime, setIsPlaying])

  // Переписываем handleChevronLast: используем currentTime, вызываем setCurrentTime
  const handleChevronLast = useCallback(() => {
    if (!video) return

    const videoStartTime = video.startTime || 0
    const videoDuration = video.duration || 0
    const videoEndTime = videoStartTime + videoDuration

    if (Math.abs(currentTime - videoEndTime) < 0.01) return

    setCurrentTime(videoEndTime)
    setIsPlaying(false)
  }, [video, currentTime, setCurrentTime, setIsPlaying])

  // Используем currentTime для isFirstFrame / isLastFrame
  // Безопасно вычисляем fps из строки формата "num/den"
  const fpsStr = video?.probeData?.streams?.[0]?.r_frame_rate || ""
  let frameTime = 0
  try {
    if (fpsStr) {
      const fpsMatch = fpsStr.match(/(\d+)\/(\d+)/)
      const fps = fpsMatch
        ? parseInt(fpsMatch[1], 10) / parseInt(fpsMatch[2], 10)
        : parseFloat(fpsStr)

      if (!isNaN(fps) && fps > 0) {
        frameTime = 1 / fps
      }
    }
  } catch (e) {
    console.error("[PlayerControls] Ошибка при вычислении fps:", e)
  }
  const isFirstFrame = Math.abs(currentTime - (video?.startTime || 0)) < frameTime
  const videoEndTimeForLastFrame = (video?.startTime || 0) + (video?.duration || 0)
  const isLastFrame = Math.abs(currentTime - videoEndTimeForLastFrame) < frameTime

  // Функция форматирования относительного времени
  const formatRelativeTime = (time: number): string => {
    // Добавим проверку на конечность числа
    if (!isFinite(time)) {
      console.warn("[formatRelativeTime] Received non-finite time:", time)
      return "00:00:00.000"
    }
    // Используем Math.max для гарантии неотрицательного значения
    const absTime = Math.max(0, time)
    const hours = Math.floor(absTime / 3600)
    const minutes = Math.floor((absTime % 3600) / 60)
    const seconds = Math.floor(absTime % 60)
    const milliseconds = Math.floor((absTime % 1) * 1000)
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(3, "0")}`
  }

  // Функция форматирования абсолютного времени сектора
  const formatSectorTime = (time: number, startTime?: number): string => {
    // Если нет startTime или это не Unix timestamp, используем относительное время
    if (!startTime || startTime < 365 * 24 * 60 * 60) {
      return formatRelativeTime(time)
    }

    // Преобразуем Unix timestamp в объект Date
    const date = new Date((startTime + time) * 1000)

    // Форматируем время в формате HH:MM:SS.mmm
    const hours = date.getHours().toString().padStart(2, "0")
    const minutes = date.getMinutes().toString().padStart(2, "0")
    const seconds = date.getSeconds().toString().padStart(2, "0")
    const milliseconds = date.getMilliseconds().toString().padStart(3, "0")

    return `${hours}:${minutes}:${seconds}.${milliseconds}`
  }

  // videoRefs уже получен выше

  // Обновляем локальное время при воспроизведении
  useEffect(() => {
    if (!video?.id || !videoRefs[video.id]) return

    const videoElement = videoRefs[video.id]

    // Функция обновления времени
    const updateTime = () => {
      setLocalDisplayTime(videoElement.currentTime)
    }

    // Добавляем обработчик события timeupdate
    if (isPlaying) {
      videoElement.addEventListener("timeupdate", updateTime)
    }

    return () => {
      videoElement.removeEventListener("timeupdate", updateTime)
    }
  }, [video?.id, videoRefs, isPlaying])

  // Импортируем контекст для обмена данными с TimelineBar
  const { setDisplayTime } = useDisplayTime()

  // Нормализуем currentTime для отображения, если это Unix timestamp
  const displayTime = useMemo(() => {
    if (currentTime > 365 * 24 * 60 * 60) {
      // Если время больше года в секундах, это, вероятно, Unix timestamp
      // Используем локальное время для отображения
      return localDisplayTime
    }
    return currentTime
  }, [currentTime, localDisplayTime])

  // Обновляем контекст при изменении displayTime
  useEffect(() => {
    setDisplayTime(displayTime)
  }, [displayTime, setDisplayTime])

  // Ограничиваем логирование, чтобы не перегружать консоль
  useEffect(() => {
    console.log(
      "[PlayerControls] Rendering with currentTime:",
      currentTime,
      "displayTime:",
      displayTime,
    )
  }, [currentTime, displayTime])

  // Улучшаем handlePlayPause: НЕ устанавливаем флаг isChangingCamera при переключении
  const handlePlayPause = useCallback(() => {
    // Проверяем, есть ли активное видео или видео в шаблоне или параллельные видео
    const hasActiveVideo = !!video
    const hasTemplateVideos = appliedTemplate?.videos && appliedTemplate.videos.length > 0
    const hasParallelVideos = parallelVideos && parallelVideos.length > 0

    // Если нет ни активного видео, ни видео в шаблоне, ни параллельных видео, выходим
    if (!hasActiveVideo && !hasTemplateVideos && !hasParallelVideos) {
      console.log("[handlePlayPause] Нет видео для воспроизведения")
      return
    }

    // Не устанавливаем флаг isChangingCamera при переключении между паузой и воспроизведением,
    // так как это приводит к сбросу времени
    console.log("[handlePlayPause] Переключение воспроизведения")

    // Если начинаем воспроизведение и есть активное видео, устанавливаем текущее время видео в displayTime
    if (!isPlaying && hasActiveVideo && video.id && videoRefs[video.id]) {
      const videoElement = videoRefs[video.id]

      // Если currentTime - это Unix timestamp, используем displayTime
      if (currentTime > 365 * 24 * 60 * 60) {
        console.log(
          `[handlePlayPause] Установка времени видео в displayTime: ${displayTime.toFixed(3)}`,
        )
        videoElement.currentTime = displayTime

        // Сохраняем это время для текущего видео
        console.log(
          `[handlePlayPause] Сохраняем displayTime ${displayTime.toFixed(3)} для видео ${video.id}`,
        )
      }
    }

    // Проверяем готовность видео перед началом воспроизведения
    if (!isPlaying && hasActiveVideo && video.id && videoRefs[video.id]) {
      const videoElement = videoRefs[video.id]

      // Проверяем готовность видео
      if (videoElement.readyState < 3) {
        console.log(`[handlePlayPause] Видео ${video.id} не готово, ожидаем загрузку...`)

        // Показываем индикатор загрузки
        // Это можно реализовать через состояние в контексте плеера, если нужно
      }
    }

    // В любом случае переключаем состояние воспроизведения
    setIsPlaying(!isPlaying)
  }, [
    isPlaying,
    setIsPlaying,
    video,
    videoRefs,
    currentTime,
    displayTime,
    appliedTemplate,
    parallelVideos,
  ])

  return (
    <div className="flex w-full flex-col">
      {/* Прогресс-бар и время */}
      <div className="px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="relative h-1 w-full rounded-full border border-white bg-gray-800">
              <div
                className="absolute top-0 left-0 h-full rounded-full bg-white"
                style={{ width: `${(Math.max(0, displayTime) / (video?.duration || 100)) * 100}%` }}
              />
              <div
                className="absolute top-1/2 h-[13px] w-[13px] -translate-y-1/2 rounded-full border border-white bg-white"
                style={{
                  left: `calc(${(Math.max(0, displayTime) / (video?.duration || 100)) * 100}% - 6px)`,
                }}
              />
              <Slider
                value={[Math.max(0, displayTime)]}
                min={0}
                max={video?.duration || 100}
                step={0.001}
                onValueChange={handleTimeChange}
                className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                disabled={isChangingCamera} // Отключаем слайдер во время переключения камеры
              />
            </div>
          </div>
          <span className="rounded-md bg-white px-1 text-xs text-black dark:bg-black dark:text-white">
            {currentTime > 365 * 24 * 60 * 60
              ? formatSectorTime(Math.max(0, displayTime), video?.startTime)
              : formatRelativeTime(Math.max(0, displayTime))}
          </span>
          <span className="mb-[3px]">/</span>
          <span className="rounded-md bg-white px-1 text-xs text-black dark:bg-black dark:text-white">
            {currentTime > 365 * 24 * 60 * 60
              ? formatSectorTime(video?.duration || 0, video?.startTime)
              : formatRelativeTime(video?.duration || 0)}
          </span>

          {/* Скрытый элемент для обновления компонента при воспроизведении */}
          {currentTime > 365 * 24 * 60 * 60 && (
            <span className="hidden">{localDisplayTime.toFixed(3)}</span>
          )}
        </div>
      </div>

      <div className="h-full w-full p-1">
        <div className="flex items-center justify-between px-2 py-0" style={{ minWidth: "1000px" }}>
          {/* Левая часть: кнопки для камер и шаблонов */}
          <div className="flex items-center gap-2" style={{ minWidth: "150px" }}>
            {/* Кнопка переключения режима resizable - показываем только если применен шаблон */}
            <Button
              className={`h-8 w-8 cursor-pointer ${isResizableMode ? "bg-[#45444b] hover:bg-[#45444b]/80" : "hover:bg-[#45444b]/80"}`}
              variant="ghost"
              size="icon"
              title={
                isResizableMode
                  ? t("timeline.controlsMain.fixedSizeMode")
                  : t("timeline.controlsMain.resizableMode")
              }
              onClick={() => setIsResizableMode(!isResizableMode)}
              disabled={!appliedTemplate}
            >
              {<UnfoldHorizontal className="h-8 w-8" />}
            </Button>

            {/* Кнопка шаблона - всегда активна, переключает режим шаблона */}
            <Button
              className="h-8 w-8 cursor-pointer"
              variant="ghost"
              size="icon"
              title={
                appliedTemplate
                  ? t("timeline.controlsMain.resetTemplate")
                  : t("timeline.controlsMain.applyTemplate") || "Применить шаблон"
              }
              onClick={
                appliedTemplate
                  ? handleResetTemplate
                  : () => setAppliedTemplate(lastAppliedTemplate)
              }
            >
              {appliedTemplate ? (
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
                  <rect x="4" y="4" width="16" height="16" rx="2" />
                  <line x1="4" y1="4" x2="20" y2="20" />
                </svg>
              ) : (
                <LayoutPanelTop className="h-8 w-8" />
              )}
            </Button>

            <Button
              className="h-8 w-8 cursor-pointer"
              variant="ghost"
              size="icon"
              title={t("timeline.controls.takeSnapshot")}
              onClick={handleTakeSnapshot}
            >
              <Camera className="h-8 w-8" />
            </Button>

            {/* Кнопка переключения между камерами - показываем только если есть параллельные видео */}
            {parallelVideos && parallelVideos.length > 1 && (
              <Button
                className={`h-8 w-8 cursor-pointer ${isChangingCamera ? "animate-pulse" : ""}`}
                variant="ghost"
                size="icon"
                title={`${t("timeline.controlsMain.switchCamera")} (${parallelVideos.findIndex((v) => v.id === video?.id) + 1}/${parallelVideos.length})`}
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
              title={t("timeline.controls.firstFrame")}
              onClick={handleChevronFirst}
              disabled={isFirstFrame || isPlaying || isChangingCamera}
            >
              <ChevronFirst className="h-8 w-8" />
            </Button>

            <Button
              className="h-8 w-8 cursor-pointer"
              variant="ghost"
              size="icon"
              title={t("timeline.controls.previousFrame")}
              onClick={handleSkipBackward}
              disabled={isFirstFrame || isPlaying || isChangingCamera}
            >
              <StepBack className="h-8 w-8" />
            </Button>

            <Button
              className="h-8 w-8 cursor-pointer"
              variant="ghost"
              size="icon"
              title={isPlaying ? t("timeline.controls.pause") : t("timeline.controls.play")}
              onClick={handlePlayPause}
              disabled={isChangingCamera}
            >
              {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
            </Button>

            <Button
              className="h-8 w-8 cursor-pointer"
              variant="ghost"
              size="icon"
              title={t("timeline.controls.nextFrame")}
              onClick={handleSkipForward}
              disabled={isLastFrame || isPlaying || isChangingCamera}
            >
              <StepForward className="h-8 w-8" />
            </Button>

            <Button
              className="h-8 w-8 cursor-pointer"
              variant="ghost"
              size="icon"
              title={t("timeline.controls.lastFrame")}
              onClick={handleChevronLast}
              disabled={isLastFrame || isPlaying || isChangingCamera}
            >
              <ChevronLast className="h-8 w-8" />
            </Button>

            <Button
              className={"h-8 w-8 cursor-pointer"}
              variant="ghost"
              size="icon"
              title={
                isRecording ? t("timeline.controls.stopRecord") : t("timeline.controls.record")
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
          </div>

          {/* Правая часть: кнопки управления звуком и полноэкранным режимом */}
          <div
            className="flex items-center gap-2"
            style={{ minWidth: "150px", justifyContent: "flex-end" }}
          >
            <div className="flex items-center gap-2">
              <Button
                className="h-8 w-8 cursor-pointer"
                variant="ghost"
                size="icon"
                title={
                  volume === 0
                    ? t("timeline.controls.unmuteAudio")
                    : t("timeline.controls.muteAudio")
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
              className="h-8 w-8 cursor-pointer"
              variant="ghost"
              size="icon"
              title={
                isFullscreen
                  ? t("timeline.controls.exitFullscreen")
                  : t("timeline.controls.fullscreen")
              }
              onClick={handleFullscreen}
            >
              {isFullscreen ? <Minimize2 className="h-8 w-8" /> : <Maximize2 className="h-8 w-8" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
