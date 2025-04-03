import {
  Camera,
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
import { useCallback, useEffect, useRef, useState } from "react"

import { EntryPointIcon } from "@/components/icons/entry-point"
import { ExitPointIcon } from "@/components/icons/exit-point"
import { Slider } from "@/components/ui/slider"
import { useRootStore } from "@/hooks/use-root-store"
import { cn } from "@/lib/utils"

import { Button } from "../ui/button"

export function PlayerControls() {
  const { isPlaying, setIsPlaying, currentTime, activeVideo, setCurrentTime } = useRootStore()
  const [volume, setVolume] = useState(1)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const volumeControlRef = useRef<HTMLDivElement>(null)
  const [isRecording, setIsRecording] = useState(false)
  const lastUpdateTime = useRef(0)

  const handlePlayPause = useCallback(() => {
    setIsPlaying(!isPlaying)
  }, [isPlaying, setIsPlaying])

  const handleSkipBackward = useCallback(() => {
    // Реализовать перемотку назад
  }, [])

  const handleSkipForward = useCallback(() => {
    // Реализовать перемотку вперед
  }, [])

  const handleVolumeChange = useCallback((value: number[]) => {
    setVolume(value[0])
  }, [])

  const handleToggleMute = useCallback(() => {
    setVolume(volume === 0 ? 1 : 0)
  }, [volume])

  const handleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen)
  }, [isFullscreen])

  const handleRecordToggle = useCallback(() => {
    setIsRecording(!isRecording)
  }, [isRecording])

  const handleTimeChange = useCallback((value: number[]) => {
    const now = performance.now()
    if (now - lastUpdateTime.current < 6.6) return // Ограничиваем до ~60fps
    
    if (activeVideo?.startTime !== undefined) {
      lastUpdateTime.current = now
      requestAnimationFrame(() => {
        setCurrentTime(value[0] + activeVideo.startTime!)
      })
    }
  }, [activeVideo?.startTime])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (volumeControlRef.current && !volumeControlRef.current.contains(event.target as Node)) {
        setShowVolumeSlider(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Функция для форматирования времени в формат ЧЧ:ММ:СС
  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600)
    const minutes = Math.floor((time % 3600) / 60)
    const seconds = Math.floor(time % 60)
    const milliseconds = Math.floor((time % 1) * 1000)
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`
  }

  return (
    <div className="w-full flex flex-col">
      {/* Прогресс-бар и время */}
      <div className="px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/80">{formatTime(currentTime - (activeVideo?.startTime || 0))}</span>
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
          <span className="text-xs text-white/80">{formatTime(activeVideo?.duration || 0)}</span>
        </div>
      </div>

      <div className="w-full flex items-center p-[2px] justify-between dark:bg-[#1b1a1f] text-white">
        <div className="flex items-center gap-2">
          <Button
            className="cursor-pointer h-6 w-6"
            variant="ghost"
            size="icon"
            title="Перемотка назад"
            onClick={handleSkipBackward}
          >
            <StepBack className="w-4 h-4" />
          </Button>

          <Button
            className="cursor-pointer h-6 w-6"
            variant="ghost"
            size="icon"
            title="Перемотка вперед"
            onClick={handleSkipForward}
          >
            <StepForward className="w-4 h-4" />
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
            className={"cursor-pointer h-6 w-6"}
            variant="ghost"
            size="icon"
            title={isRecording ? "Остановить запись" : "Начать запись"}
            onClick={handleRecordToggle}
          >
            <CircleDot className={cn(
              "w-4 h-4",
              isRecording 
                ? "text-red-500 hover:text-red-600" 
                : "text-white hover:text-gray-300"
            )} />
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

          <Button
            className="cursor-pointer h-6 w-6"
            variant="ghost"
            size="icon"
            title="Снимок"
            onClick={() => {}}
          >
            <Camera className="w-4 h-4" />
          </Button>

          <div
            ref={volumeControlRef}
            className="relative"
            onMouseEnter={() => setShowVolumeSlider(true)}
            onMouseLeave={() => setShowVolumeSlider(false)}
          >
            <Button
              className="cursor-pointer h-6 w-6"
              variant="ghost"
              size="icon"
              title={volume === 0 ? "Включить звук" : "Выключить звук"}
              onClick={handleToggleMute}
            >
              {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
            
            {showVolumeSlider && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-24 h-32 bg-black/90 rounded-lg p-4">
                <Slider
                  value={[volume]}
                  onValueChange={handleVolumeChange}
                  orientation="vertical"
                  min={0}
                  max={1}
                  step={0.01}
                  className="h-full"
                />
              </div>
            )}
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