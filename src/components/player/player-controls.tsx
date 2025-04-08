import {
  ChevronFirst,
  ChevronLast,
  CircleDot,
  Maximize2,
  Pause,
  Play,
  Settings,
  StepBack,
  StepForward,
  Volume2,
  VolumeX,
} from "lucide-react"
import { useCallback, useEffect,useRef, useState } from "react"

import { EntryPointIcon } from "@/components/icons/entry-point"
import { ExitPointIcon } from "@/components/icons/exit-point"
import { Slider } from "@/components/ui/slider"
import { useRootStore } from "@/hooks/use-root-store"
import { cn } from "@/lib/utils"

import { Button } from "../ui/button"

export function PlayerControls() {
  const {
    isPlaying,
    setIsPlaying,
    currentTime,
    activeVideo,
    setCurrentTime,
    volume: globalVolume,
    setVolume: setGlobalVolume,
    isSeeking,
    setIsSeeking,
    tracks,
    activeTrackId,
    timeRanges,
    saveState,
    loadState,
  } = useRootStore()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [localTime, setLocalTime] = useState(currentTime)
  const lastUpdateTime = useRef(0)
  const lastSaveTime = useRef(0)
  const frameRef = useRef<number | null>(null)
  const initialFrameTimeRef = useRef<number | null>(null)
  const timeAtPlayStartRef = useRef<number>(0)
  const SAVE_INTERVAL = 5000 // Сохраняем каждые 5 секунд

  // Загружаем состояние при монтировании компонента
  useEffect(() => {
    loadState()
  }, [loadState])

  // Сохраняем состояние периодически
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      if (now - lastSaveTime.current >= SAVE_INTERVAL) {
        saveState()
        lastSaveTime.current = now
      }
    }, SAVE_INTERVAL)

    return () => clearInterval(interval)
  }, [saveState])

  // Синхронизируем локальное время с глобальным при изменении currentTime
  useEffect(() => {
    if (!isPlaying) {
      setLocalTime(currentTime)
    }
  }, [currentTime, isPlaying])

  // Фиксируем время начала воспроизведения
  useEffect(() => {
    if (isPlaying) {
      timeAtPlayStartRef.current = localTime || 0
      initialFrameTimeRef.current = null
    }
  }, [isPlaying, localTime])

  useEffect(() => {
    if (
      !isPlaying ||
      !activeVideo ||
      localTime === undefined ||
      activeVideo.startTime === undefined ||
      activeVideo.endTime === undefined ||
      !activeVideo.probeData?.streams?.[0]?.r_frame_rate ||
      isSeeking
    ) {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
      return
    }

    const startTime: number = activeVideo.startTime
    const endTime: number = activeVideo.endTime
    const fpsStr = activeVideo.probeData.streams[0].r_frame_rate

    // Более надежный расчет FPS
    const fpsMatch = fpsStr.match(/(\d+)\/(\d+)/)
    const fps = fpsMatch ? parseInt(fpsMatch[1]) / parseInt(fpsMatch[2]) : eval(fpsStr)

    if (typeof fps !== "number" || fps <= 0 || isNaN(fps)) {
      console.error("Некорректный FPS:", fpsStr)
      return
    }

    // Всегда сбрасываем initialFrameTimeRef при запуске анимации
    initialFrameTimeRef.current = null

    const updateFrame = (timestamp: number) => {
      if (initialFrameTimeRef.current === null) {
        initialFrameTimeRef.current = timestamp
      }

      // Рассчитываем прошедшее время с начала воспроизведения
      const elapsed = timestamp - initialFrameTimeRef.current

      // Вычисляем текущее время на основе точного времени
      // Важно: используем timeAtPlayStartRef.current как базовую точку
      const exactTime = timeAtPlayStartRef.current + elapsed / 1000

      if (exactTime >= endTime) {
        // Если достигли конца, перейти к началу
        setLocalTime(startTime)
        setCurrentTime(startTime)
        timeAtPlayStartRef.current = startTime
        initialFrameTimeRef.current = timestamp
      } else {
        // Обновляем локальное время
        setLocalTime(exactTime)

        // Обновляем глобальное время реже для улучшения производительности
        const now = performance.now()
        if (now - lastUpdateTime.current >= 200) {
          setCurrentTime(exactTime)
          lastUpdateTime.current = now
        }
      }

      // Запланировать следующий кадр
      frameRef.current = requestAnimationFrame(updateFrame)
    }

    // Запускаем анимацию
    frameRef.current = requestAnimationFrame(updateFrame)

    // Очищаем при размонтировании
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
    }
  }, [isPlaying, activeVideo, setCurrentTime, isSeeking])

  // Сохраняем состояние при изменении активной дорожки
  useEffect(() => {
    saveState()
  }, [activeTrackId, saveState])

  // Сохраняем состояние при изменении времени
  useEffect(() => {
    const now = Date.now()
    if (now - lastUpdateTime.current >= 1000) {
      // Сохраняем не чаще чем раз в секунду
      saveState()
      lastUpdateTime.current = now
    }
  }, [currentTime, saveState])

  const handlePlayPause = useCallback(() => {
    // Если останавливаем воспроизведение, фиксируем текущее время
    if (isPlaying) {
      timeAtPlayStartRef.current = localTime
    } else {
      // Если запускаем воспроизведение, сбрасываем initialFrameTimeRef
      initialFrameTimeRef.current = null
      timeAtPlayStartRef.current = localTime
    }

    setIsPlaying(!isPlaying)
  }, [isPlaying, setIsPlaying, localTime])

  const handleSkipBackward = useCallback(() => {
    if (!activeVideo?.probeData?.streams?.[0]?.r_frame_rate) {
      const newTime = localTime - 1 / 25
      setLocalTime(newTime)
      setCurrentTime(newTime)
      // Важно: обновляем точку отсчета для следующего воспроизведения
      timeAtPlayStartRef.current = newTime
      setIsPlaying(false)
      return
    }

    const fpsStr = activeVideo.probeData.streams[0].r_frame_rate
    // Более надежный расчет FPS
    const fpsMatch = fpsStr.match(/(\d+)\/(\d+)/)
    const fps = fpsMatch ? parseInt(fpsMatch[1]) / parseInt(fpsMatch[2]) : eval(fpsStr)

    if (typeof fps !== "number" || fps <= 0 || isNaN(fps)) return

    const frameTime = 1 / fps
    // Используем актуальное localTime
    const newTime = Math.max(activeVideo?.startTime || 0, localTime - frameTime)

    // Обновляем timeAtPlayStartRef, чтобы при следующем воспроизведении начать с правильного места
    timeAtPlayStartRef.current = newTime

    setLocalTime(newTime)
    setCurrentTime(newTime)
    setIsPlaying(false)
  }, [activeVideo, localTime, setCurrentTime, setIsPlaying, currentTime])

  const handleSkipForward = useCallback(() => {
    if (!activeVideo?.probeData?.streams?.[0]?.r_frame_rate) {
      const newTime = localTime + 1 / 25
      setLocalTime(newTime)
      setCurrentTime(newTime)
      // Важно: обновляем точку отсчета для следующего воспроизведения
      timeAtPlayStartRef.current = newTime
      setIsPlaying(false)
      return
    }

    const fpsStr = activeVideo.probeData.streams[0].r_frame_rate
    // Более надежный расчет FPS
    const fpsMatch = fpsStr.match(/(\d+)\/(\d+)/)
    const fps = fpsMatch ? parseInt(fpsMatch[1]) / parseInt(fpsMatch[2]) : eval(fpsStr)

    if (typeof fps !== "number" || fps <= 0 || isNaN(fps)) return

    const frameTime = 1 / fps
    // Используем актуальное localTime
    const newTime = Math.min(activeVideo?.endTime || Infinity, localTime + frameTime)

    // Обновляем timeAtPlayStartRef, чтобы при следующем воспроизведении начать с правильного места
    timeAtPlayStartRef.current = newTime

    setLocalTime(newTime)
    setCurrentTime(newTime)
    setIsPlaying(false)
  }, [activeVideo, localTime, setCurrentTime, setIsPlaying, currentTime])

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

  const handleRecordToggle = useCallback(() => {
    setIsRecording(!isRecording)
  }, [isRecording])

  const handleTimeChange = useCallback(
    (value: number[]) => {
      if (activeVideo?.startTime !== undefined) {
        const newTime = value[0] + activeVideo.startTime

        // Обновляем локальное время и timeAtPlayStartRef
        setLocalTime(newTime)
        timeAtPlayStartRef.current = newTime

        setCurrentTime(newTime)
        setIsPlaying(false)
      }
    },
    [activeVideo, setCurrentTime, setIsPlaying],
  )

  const handleChevronFirst = useCallback(() => {
    const startTime = activeVideo?.startTime || 0
    setLocalTime(startTime)
    setCurrentTime(startTime)

    // Обновляем timeAtPlayStartRef
    timeAtPlayStartRef.current = startTime

    setIsPlaying(false)
  }, [activeVideo, setCurrentTime, setIsPlaying])

  const handleChevronLast = useCallback(() => {
    const endTime = activeVideo?.endTime || 0
    setLocalTime(endTime)
    setCurrentTime(endTime)

    // Обновляем timeAtPlayStartRef
    timeAtPlayStartRef.current = endTime

    setIsPlaying(false)
  }, [activeVideo?.endTime, setCurrentTime, setIsPlaying])

  // Проверяем, находимся ли мы на первом или последнем кадре
  const fps = activeVideo?.probeData?.streams?.[0]?.r_frame_rate
  const frameTime = fps ? 1 / eval(fps) : 0
  const isFirstFrame = Math.abs(localTime - (activeVideo?.startTime || 0)) < frameTime
  const isLastFrame = Math.abs(localTime - (activeVideo?.endTime || Infinity)) < frameTime

  // Функция для форматирования времени в формат ЧЧ:ММ:СС
  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600)
    const minutes = Math.floor((time % 3600) / 60)
    const seconds = Math.floor(time % 60)
    const milliseconds = Math.floor((time % 1) * 1000)
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(3, "0")}`
  }

  return (
    <div className="w-full flex flex-col">
      {/* Прогресс-бар и время */}
      <div className="px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Slider
              value={[localTime - (activeVideo?.startTime || 0)]}
              min={0}
              max={activeVideo?.duration || 100}
              step={0.1}
              onValueChange={handleTimeChange}
              className="cursor-pointer"
            />
          </div>
          <span className="text-xs text-white/80">
            {formatTime(localTime - (activeVideo?.startTime || 0))}
          </span>
          <span className="mb-1">/</span>
          <span className="text-xs text-white/80">{formatTime(activeVideo?.duration || 0)}</span>
        </div>
      </div>

      <div className="w-full flex items-center p-[2px] justify-between dark:bg-[#1b1a1f] text-white">
        <div className="flex items-center gap-2">
          <Button
            className="cursor-pointer h-6 w-6"
            variant="ghost"
            size="icon"
            title="Первый кадр"
            onClick={handleChevronFirst}
            disabled={isFirstFrame || isPlaying}
          >
            <ChevronFirst className="w-4 h-4" />
          </Button>

          <Button
            className="cursor-pointer h-6 w-6"
            variant="ghost"
            size="icon"
            title="Предыдущий кадр"
            onClick={handleSkipBackward}
            disabled={isFirstFrame || isPlaying}
          >
            <StepBack className="w-4 h-4" />
          </Button>

          <Button
            className="cursor-pointer h-6 w-6"
            variant="ghost"
            size="icon"
            title={isPlaying ? "Пауза" : "Воспроизвести"}
            onClick={handlePlayPause}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>

          <Button
            className="cursor-pointer h-6 w-6"
            variant="ghost"
            size="icon"
            title="Следующий кадр"
            onClick={handleSkipForward}
            disabled={isLastFrame || isPlaying}
          >
            <StepForward className="w-4 h-4" />
          </Button>

          <Button
            className="cursor-pointer h-6 w-6"
            variant="ghost"
            size="icon"
            title="Последний кадр"
            onClick={handleChevronLast}
            disabled={isLastFrame || isPlaying}
          >
            <ChevronLast className="w-4 h-4" />
          </Button>

          <Button
            className={"cursor-pointer h-6 w-6"}
            variant="ghost"
            size="icon"
            title={isRecording ? "Остановить запись" : "Начать запись"}
            onClick={handleRecordToggle}
          >
            <CircleDot
              className={cn(
                "w-4 h-4",
                isRecording ? "text-red-500 hover:text-red-600" : "text-white hover:text-gray-300",
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
            <Settings className="w-4 h-4" />
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
  )
}
