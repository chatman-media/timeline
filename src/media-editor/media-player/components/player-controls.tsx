import {
  Camera,
  ChevronFirst,
  ChevronLast,
  CircleDot,
  Maximize2,
  MonitorCog,
  Pause,
  Play,
  StepBack,
  StepForward,
  Volume2,
  VolumeX,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { EntryPointIcon } from "@/components/icons/entry-point"
import { ExitPointIcon } from "@/components/icons/exit-point"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { useTimeline } from "@/media-editor/timeline/services"

import { usePlayerContext } from ".."

interface PlayerControlsProps {
  currentTime: number
}

export function PlayerControls({ currentTime }: PlayerControlsProps) {
  const { tracks, activeTrackId } = useTimeline()
  const {
    isPlaying,
    setIsPlaying,
    video,
    setCurrentTime,
    volume,
    setVolume,
    isRecording,
    setIsRecording,
    setIsSeeking,
    setIsChangingCamera,
  } = usePlayerContext()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const lastSaveTime = useRef(0)
  const SAVE_INTERVAL = 3000 // Сохраняем каждые 3 секунды

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

  // Улучшаем handlePlayPause: НЕ устанавливаем флаг isChangingCamera при переключении
  const handlePlayPause = useCallback(() => {
    if (!video) return

    // Не устанавливаем флаг isChangingCamera при переключении между паузой и воспроизведением,
    // так как это приводит к сбросу времени
    console.log("[handlePlayPause] Переключение воспроизведения")

    setIsPlaying(!isPlaying)
  }, [isPlaying, setIsPlaying, video])

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

  const handleVolumeChange = useCallback(
    (value: number[]) => {
      setVolume(value[0])
    },
    [setVolume],
  )

  const handleToggleMute = useCallback(() => {
    setVolume(volume === 0 ? 1 : 0)
  }, [volume, setVolume])

  const handleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen)
  }, [isFullscreen])

  // Переписываем handleRecordToggle: используем currentTime
  const handleRecordToggle = useCallback(() => {
    if (isRecording) {
      setIsRecording(false)
    } else {
      const trackId = activeTrackId || video?.id || ""
      if (trackId) {
        console.log("[handleRecordToggle] Начинаем запись для трека:", trackId)
        setIsRecording(true)
      } else {
        console.warn("Не удалось начать запись: отсутствует активный трек и активное видео")
      }
    }
  }, [isRecording, setIsRecording, activeTrackId, video])

  // Оптимизированный handleTimeChange для коротких видео
  const handleTimeChange = useCallback(
    (value: number[]) => {
      if (!video) return

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

      // Если текущее время - Unix timestamp, сохраняем только относительный прогресс
      // и не меняем глобальное время
      if (currentTime > 365 * 24 * 60 * 60) {
        // Устанавливаем только флаг перемотки, чтобы синхронизировать видео
        // Глобальное время (Unix timestamp) не меняем
        console.log(
          `[handleTimeChange] Установка относительного прогресса: ${clampedTime.toFixed(3)}`,
        )
        setIsSeeking(true)

        // Завершаем обработку, не вызывая setCurrentTime
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
    },
    [video, setCurrentTime, setIsSeeking, currentTime],
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
  const fps = video?.probeData?.streams?.[0]?.r_frame_rate
  const frameTime = fps ? 1 / eval(fps) : 0
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

  // Получаем videoRefs из контекста плеера на верхнем уровне компонента
  const { videoRefs } = usePlayerContext()

  // Используем состояние для хранения текущего времени воспроизведения
  const [localDisplayTime, setLocalDisplayTime] = useState(0)

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

  // Нормализуем currentTime для отображения, если это Unix timestamp
  const displayTime = useMemo(() => {
    if (currentTime > 365 * 24 * 60 * 60) {
      // Если время больше года в секундах, это, вероятно, Unix timestamp
      // Используем локальное время для отображения
      return localDisplayTime
    }
    return currentTime
  }, [currentTime, localDisplayTime])

  // Ограничиваем логирование, чтобы не перегружать консоль
  useEffect(() => {
    console.log(
      "[PlayerControls] Rendering with currentTime:",
      currentTime,
      "displayTime:",
      displayTime,
    )
  }, [currentTime, displayTime])

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
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
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
        <div className="flex items-center justify-between rounded-md border border-white">
          <div className="flex items-center gap-2">
            <Button
              className="h-8 w-8 cursor-pointer"
              variant="ghost"
              size="icon"
              title="Первый кадр"
              onClick={handleChevronFirst}
              disabled={isFirstFrame || isPlaying}
            >
              <ChevronFirst className="h-6 w-6" />
            </Button>

            <Button
              className="h-8 w-8 cursor-pointer"
              variant="ghost"
              size="icon"
              title="Предыдущий кадр"
              onClick={handleSkipBackward}
              disabled={isFirstFrame || isPlaying}
            >
              <StepBack className="h-6 w-6" />
            </Button>

            <Button
              className="h-8 w-8 cursor-pointer"
              variant="ghost"
              size="icon"
              title={isPlaying ? "Пауза" : "Воспроизвести"}
              onClick={handlePlayPause}
            >
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </Button>

            <Button
              className="h-8 w-8 cursor-pointer"
              variant="ghost"
              size="icon"
              title="Следующий кадр"
              onClick={handleSkipForward}
              disabled={isLastFrame || isPlaying}
            >
              <StepForward className="h-6 w-6" />
            </Button>

            <Button
              className="h-8 w-8 cursor-pointer"
              variant="ghost"
              size="icon"
              title="Последний кадр"
              onClick={handleChevronLast}
              disabled={isLastFrame || isPlaying}
            >
              <ChevronLast className="h-6 w-6" />
            </Button>

            <Button
              className={"h-8 w-8 cursor-pointer"}
              variant="ghost"
              size="icon"
              title={isRecording ? "Остановить запись" : "Начать запись"}
              onClick={handleRecordToggle}
            >
              <CircleDot
                className={cn(
                  "h-4 w-4",
                  isRecording
                    ? "animate-pulse text-red-500 hover:text-red-600"
                    : "text-white hover:text-gray-300",
                )}
              />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              className="h-6 w-6 cursor-pointer"
              variant="ghost"
              size="icon"
              title="Точка входа"
              onClick={() => {}}
            >
              <EntryPointIcon className="h-4 w-4" />
            </Button>
            <Button
              className="h-6 w-6 cursor-pointer"
              variant="ghost"
              size="icon"
              title="Точка выхода"
              onClick={() => {}}
            >
              <ExitPointIcon className="h-4 w-4" />
            </Button>
            <Button
              className="h-6 w-6 cursor-pointer"
              variant="ghost"
              size="icon"
              title="Настройки"
              onClick={() => {}}
            >
              <MonitorCog className="h-4 w-4" />
            </Button>

            <Button
              className="h-6 w-6 cursor-pointer"
              variant="ghost"
              size="icon"
              title="Сделать снимок"
              onClick={() => {}}
            >
              <Camera className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2">
              <Button
                className="h-6 w-6 cursor-pointer"
                variant="ghost"
                size="icon"
                title={volume === 0 ? "Включить звук" : "Выключить звук"}
                onClick={handleToggleMute}
              >
                {volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <div className="w-20">
                <div className="relative h-1 w-full rounded-full border border-white bg-gray-800">
                  <div
                    className="absolute top-0 left-0 h-full rounded-full bg-white"
                    style={{ width: `${volume * 100}%` }}
                  />
                  <div
                    className="absolute top-1/2 h-[11px] w-[11px] -translate-y-1/2 rounded-full border border-white bg-white"
                    style={{ left: `calc(${volume * 100}% - 5px)` }}
                  />
                  <Slider
                    value={[volume]}
                    min={0}
                    max={1}
                    step={0.01}
                    onValueChange={handleVolumeChange}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                </div>
              </div>
            </div>

            <Button
              className="h-6 w-6 cursor-pointer"
              variant="ghost"
              size="icon"
              title={isFullscreen ? "Выйти из полноэкранного режима" : "Полноэкранный режим"}
              onClick={handleFullscreen}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
