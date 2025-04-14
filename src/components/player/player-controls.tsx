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
import { useCallback, useEffect, useRef, useState } from "react"

import { EntryPointIcon } from "@/components/icons/entry-point"
import { ExitPointIcon } from "@/components/icons/exit-point"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { useRootStore } from "@/hooks/use-root-store"
import { cn } from "@/lib/utils"

interface PlayerControlsProps {
  currentTime: number
}

export function PlayerControls({ currentTime }: PlayerControlsProps) {
  const {
    isPlaying,
    setIsPlaying,
    activeVideo,
    setCurrentTime,
    volume: globalVolume,
    setVolume: setGlobalVolume,
    setIsSeeking,
    activeTrackId,
    initializeHistory,
    isRecordingSchema,
    startRecordingSchema,
    stopRecordingSchema,
    tracks,
  } = useRootStore()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const lastSaveTime = useRef(0)
  const SAVE_INTERVAL = 5000 // Сохраняем каждые 5 секунд

  // Загружаем состояние при монтировании компонента
  useEffect(() => {
    initializeHistory()
  }, [initializeHistory])

  // Сохраняем состояние периодически
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      if (now - lastSaveTime.current >= SAVE_INTERVAL) {
        lastSaveTime.current = now
      }
    }, SAVE_INTERVAL)

    return () => clearInterval(interval)
  }, [])

  // Упрощаем handlePlayPause: только переключаем isPlaying
  const handlePlayPause = useCallback(() => {
    if (!activeVideo) return
    setIsPlaying(!isPlaying)
  }, [isPlaying, setIsPlaying, activeVideo])

  // Переписываем handleSkipBackward: используем currentTime, вызываем setCurrentTime
  const handleSkipBackward = useCallback(() => {
    if (!activeVideo) return

    const videoStartTime = activeVideo.startTime || 0
    if (Math.abs(currentTime - videoStartTime) < 0.01) return

    let newTime
    if (!activeVideo?.probeData?.streams?.[0]?.r_frame_rate) {
      newTime = Math.max(videoStartTime, currentTime - 1 / 25)
    } else {
      const fpsStr = activeVideo.probeData.streams[0].r_frame_rate
      const fpsMatch = fpsStr.match(/(\d+)\/(\d+)/)
      const fps = fpsMatch ? parseInt(fpsMatch[1]) / parseInt(fpsMatch[2]) : eval(fpsStr)

      if (typeof fps !== "number" || fps <= 0 || isNaN(fps)) return

      const frameTime = 1 / fps
      newTime = Math.max(videoStartTime, currentTime - frameTime)
    }

    setCurrentTime(newTime)
    setIsPlaying(false)
  }, [activeVideo, currentTime, setCurrentTime, setIsPlaying])

  // Переписываем handleSkipForward: используем currentTime, вызываем setCurrentTime
  const handleSkipForward = useCallback(() => {
    if (!activeVideo) return

    const videoStartTime = activeVideo.startTime || 0
    const videoDuration = activeVideo.duration || 0
    const videoEndTime = videoStartTime + videoDuration
    if (Math.abs(currentTime - videoEndTime) < 0.01) return

    let newTime
    if (!activeVideo?.probeData?.streams?.[0]?.r_frame_rate) {
      newTime = Math.min(videoEndTime, currentTime + 1 / 25)
    } else {
      const fpsStr = activeVideo.probeData.streams[0].r_frame_rate
      const fpsMatch = fpsStr.match(/(\d+)\/(\d+)/)
      const fps = fpsMatch ? parseInt(fpsMatch[1]) / parseInt(fpsMatch[2]) : eval(fpsStr)

      if (typeof fps !== "number" || fps <= 0 || isNaN(fps)) return

      const frameTime = 1 / fps
      newTime = Math.min(videoEndTime, currentTime + frameTime)
    }

    setCurrentTime(newTime)
    setIsPlaying(false)
  }, [activeVideo, currentTime, setCurrentTime, setIsPlaying])

  const handleVolumeChange = useCallback(
    (value: number[]) => {
      setGlobalVolume(value[0])
    },
    [setGlobalVolume],
  )

  const handleToggleMute = useCallback(() => {
    setGlobalVolume(globalVolume === 0 ? 1 : 0)
  }, [globalVolume, setGlobalVolume])

  const handleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen)
  }, [isFullscreen])

  // Переписываем handleRecordToggle: используем currentTime
  const handleRecordToggle = useCallback(() => {
    if (isRecordingSchema) {
      stopRecordingSchema()
    } else {
      const trackId = activeTrackId || activeVideo?.id || ""
      if (trackId) {
        console.log("[handleRecordToggle] Начинаем запись для трека:", trackId)
        startRecordingSchema(trackId, currentTime)
      } else {
        console.warn("Не удалось начать запись: отсутствует активный трек и активное видео")
      }
    }
  }, [
    isRecordingSchema,
    startRecordingSchema,
    stopRecordingSchema,
    activeTrackId,
    activeVideo,
    currentTime,
  ])

  // Оптимизированный handleTimeChange для коротких видео
  const handleTimeChange = useCallback(
    (value: number[]) => {
      if (!activeVideo) return

      const videoDuration = activeVideo.duration || 0
      const sliderValue = value[0]

      // Проверка валидности значения
      if (!isFinite(sliderValue) || sliderValue < 0) return

      // Ограничиваем время в пределах длительности видео
      const clampedTime = Math.min(videoDuration, Math.max(0, sliderValue))

      // Определяем, короткое ли у нас видео (меньше 10 секунд)
      const isShortVideo = videoDuration < 10

      // Для коротких видео используем меньший порог изменения
      const timeChangeThreshold = isShortVideo ? 0.001 : 0.01

      // Проверяем, существенно ли изменилось время
      if (Math.abs(clampedTime - currentTime) < timeChangeThreshold) return

      // Логируем только при значительных изменениях времени
      if (Math.abs(clampedTime - currentTime) > 0.5) {
        console.log("[handleTimeChange] Значительное изменение времени:", {
          currentTime: currentTime.toFixed(3),
          clampedTime: clampedTime.toFixed(3),
          delta: (clampedTime - currentTime).toFixed(3),
        })
      }

      // Устанавливаем seeking перед изменением времени, чтобы избежать
      // конфликтов с обновлениями от timeupdate
      setIsSeeking(true)

      // Устанавливаем новое время с пометкой, что источник - пользователь
      setCurrentTime(clampedTime, "user")
    },
    [activeVideo, setCurrentTime, setIsSeeking, currentTime],
  )

  // Переписываем handleChevronFirst: используем currentTime, вызываем setCurrentTime
  const handleChevronFirst = useCallback(() => {
    if (!activeVideo || !activeTrackId) return

    // Находим активный трек
    const activeTrack = tracks.find(track => track.id === activeTrackId)
    if (!activeTrack) return

    // Находим первое видео в треке
    const firstVideo = activeTrack.videos[0]
    if (!firstVideo) return

    const startTime = firstVideo.startTime || 0
    if (Math.abs(currentTime - startTime) < 0.01) return

    setCurrentTime(startTime)
    setIsPlaying(false)
  }, [activeVideo, activeTrackId, tracks, currentTime, setCurrentTime, setIsPlaying])

  // Переписываем handleChevronLast: используем currentTime, вызываем setCurrentTime
  const handleChevronLast = useCallback(() => {
    if (!activeVideo) return

    const videoStartTime = activeVideo.startTime || 0
    const videoDuration = activeVideo.duration || 0
    const videoEndTime = videoStartTime + videoDuration

    if (Math.abs(currentTime - videoEndTime) < 0.01) return

    setCurrentTime(videoEndTime)
    setIsPlaying(false)
  }, [activeVideo, currentTime, setCurrentTime, setIsPlaying])

  // Используем currentTime для isFirstFrame / isLastFrame
  const fps = activeVideo?.probeData?.streams?.[0]?.r_frame_rate
  const frameTime = fps ? 1 / eval(fps) : 0
  const isFirstFrame = Math.abs(currentTime - (activeVideo?.startTime || 0)) < frameTime
  const videoEndTimeForLastFrame = (activeVideo?.startTime || 0) + (activeVideo?.duration || 0)
  const isLastFrame = Math.abs(currentTime - videoEndTimeForLastFrame) < frameTime

  // Функция форматирования времени
  const formatTime = (time: number) => {
    // Добавим проверку на конечность числа
    if (!isFinite(time)) {
      console.warn("[formatTime] Received non-finite time:", time)
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

  // Лог для проверки получаемого currentTime
  console.log("[PlayerControls] Rendering with currentTime:", currentTime)

  return (
    <div className="w-full flex flex-col">
      {/* Прогресс-бар и время */}
      <div className="px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-red-500">
            <Slider
              value={[Math.max(0, currentTime)]}
              min={0}
              max={activeVideo?.duration || 100}
              step={0.001}
              onValueChange={handleTimeChange}
              className="cursor-pointer"
            />
          </div>
          <span className="text-xs bg-white dark:bg-black text-black dark:text-white rounded-md px-1">
            {formatTime(Math.max(0, currentTime))}
          </span>
          <span className="mb-[3px]">/</span>
          <span className="text-xs bg-white dark:bg-black text-black dark:text-white rounded-md px-1">
            {formatTime(activeVideo?.duration || 0)}
          </span>
        </div>
      </div>

      <div className="w-full h-full p-1">
        <div className="flex items-center justify-between border border-white rounded-md">
          <div className="flex items-center gap-2">
            <Button
              className="cursor-pointer h-8 w-8"
              variant="ghost"
              size="icon"
              title="Первый кадр"
              onClick={handleChevronFirst}
              disabled={isFirstFrame || isPlaying}
            >
              <ChevronFirst className="w-6 h-6" />
            </Button>

            <Button
              className="cursor-pointer h-8 w-8"
              variant="ghost"
              size="icon"
              title="Предыдущий кадр"
              onClick={handleSkipBackward}
              disabled={isFirstFrame || isPlaying}
            >
              <StepBack className="w-6 h-6" />
            </Button>

            <Button
              className="cursor-pointer h-8 w-8"
              variant="ghost"
              size="icon"
              title={isPlaying ? "Пауза" : "Воспроизвести"}
              onClick={handlePlayPause}
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </Button>

            <Button
              className="cursor-pointer h-8 w-8"
              variant="ghost"
              size="icon"
              title="Следующий кадр"
              onClick={handleSkipForward}
              disabled={isLastFrame || isPlaying}
            >
              <StepForward className="w-6 h-6" />
            </Button>

            <Button
              className="cursor-pointer h-8 w-8"
              variant="ghost"
              size="icon"
              title="Последний кадр"
              onClick={handleChevronLast}
              disabled={isLastFrame || isPlaying}
            >
              <ChevronLast className="w-6 h-6" />
            </Button>

            <Button
              className={"cursor-pointer h-8 w-8"}
              variant="ghost"
              size="icon"
              title={isRecordingSchema ? "Остановить запись" : "Начать запись"}
              onClick={handleRecordToggle}
            >
              <CircleDot
                className={cn(
                  "w-4 h-4",
                  isRecordingSchema
                    ? "text-red-500 hover:text-red-600 animate-pulse"
                    : "text-white hover:text-gray-300",
                )}
              />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              className="cursor-pointer h-6 w-6"
              variant="ghost"
              size="icon"
              title="Точка входа"
              onClick={() => {}}
            >
              <EntryPointIcon className="w-4 h-4" />
            </Button>
            <Button
              className="cursor-pointer h-6 w-6"
              variant="ghost"
              size="icon"
              title="Точка выхода"
              onClick={() => {}}
            >
              <ExitPointIcon className="w-4 h-4" />
            </Button>
            <Button
              className="cursor-pointer h-6 w-6"
              variant="ghost"
              size="icon"
              title="Настройки"
              onClick={() => {}}
            >
              <MonitorCog className="w-4 h-4" />
            </Button>

            <Button
              className="cursor-pointer h-6 w-6"
              variant="ghost"
              size="icon"
              title="Сделать снимок"
              onClick={() => {}}
            >
              <Camera className="w-4 h-4" />
            </Button>

            <div className="flex items-center gap-2">
              <Button
                className="cursor-pointer h-6 w-6"
                variant="ghost"
                size="icon"
                title={globalVolume === 0 ? "Включить звук" : "Выключить звук"}
                onClick={handleToggleMute}
              >
                {globalVolume === 0 ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </Button>
              <div className="w-20">
                <Slider
                  value={[globalVolume]}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={handleVolumeChange}
                  className="cursor-pointer"
                />
              </div>
            </div>

            <Button
              className="cursor-pointer h-6 w-6"
              variant="ghost"
              size="icon"
              title={isFullscreen ? "Выйти из полноэкранного режима" : "Полноэкранный режим"}
              onClick={handleFullscreen}
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
