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
import { useCallback, useRef, useState } from "react"

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
  } = useRootStore()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const lastUpdateTime = useRef(0)

  const handlePlayPause = useCallback(() => {
    setIsPlaying(!isPlaying)
  }, [isPlaying, setIsPlaying])

  const handleSkipBackward = useCallback(() => {
    const fps = activeVideo?.probeData?.streams?.[0]?.r_frame_rate
    if (!fps) return

    const frameTime = 1 / eval(fps)
    const newTime = Math.max(activeVideo?.startTime || 0, currentTime - frameTime)
    setIsPlaying(false)
    setCurrentTime(newTime)
  }, [activeVideo, currentTime])

  const handleSkipForward = useCallback(() => {
    const fps = activeVideo?.probeData?.streams?.[0]?.r_frame_rate
    if (!fps) return

    const frameTime = 1 / eval(fps)
    const newTime = Math.min(activeVideo?.endTime || Infinity, currentTime + frameTime)
    setIsPlaying(false)
    setCurrentTime(newTime)
  }, [activeVideo, currentTime])

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
        setCurrentTime(newTime)
      }
    },
    [activeVideo, setCurrentTime],
  )

  const handleChevronFirst = useCallback(() => {
    setCurrentTime(0)
  }, [])

  const handleChevronLast = useCallback(() => {
    setCurrentTime(activeVideo?.endTime || 0)
  }, [activeVideo?.endTime])

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
              value={[currentTime - (activeVideo?.startTime || 0)]}
              min={0}
              max={activeVideo?.duration || 100}
              step={0.1}
              onValueChange={handleTimeChange}
              className="cursor-pointer"
            />
          </div>
          <span className="text-xs text-white/80">
            {formatTime(currentTime - (activeVideo?.startTime || 0))}
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
          >
            <ChevronFirst className="w-4 h-4" />
          </Button>

          <Button
            className="cursor-pointer h-6 w-6"
            variant="ghost"
            size="icon"
            title="Предыдущий кадр"
            onClick={handleSkipBackward}
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
          >
            <StepForward className="w-4 h-4" />
          </Button>

          <Button
            className="cursor-pointer h-6 w-6"
            variant="ghost"
            size="icon"
            title="Последний кадр"
            onClick={handleChevronLast}
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
