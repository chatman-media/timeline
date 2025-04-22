import { Eye, EyeOff, Lock, LockOpen, Volume2, VolumeX } from "lucide-react"
import { useState } from "react"

import { Slider } from "@/components/ui/slider"
import { Track } from "@/types/media"

interface TrackControlsProps {
  track: Track
  onVisibilityChange?: (visible: boolean) => void
  onLockChange?: (locked: boolean) => void
  onVolumeChange?: (volume: number) => void
}

export function TrackControls({
  track,
  onVisibilityChange,
  onLockChange,
  onVolumeChange,
}: TrackControlsProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isLocked, setIsLocked] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(100)

  const handleVisibilityToggle = () => {
    const newValue = !isVisible
    setIsVisible(newValue)
    onVisibilityChange?.(newValue)
  }

  const handleLockToggle = () => {
    const newValue = !isLocked
    setIsLocked(newValue)
    onLockChange?.(newValue)
  }

  const handleVolumeToggle = () => {
    const newValue = !isMuted
    setIsMuted(newValue)
    onVolumeChange?.(newValue ? 0 : volume)
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)
    onVolumeChange?.(newVolume)
  }

  // Определяем, является ли трек видео или аудио
  const isVideoTrack = track.videos.some((video) =>
    video.probeData?.streams?.some((stream) => stream.codec_type === "video"),
  )

  return (
    <div className="flex w-[200px] items-center gap-2 border-r border-gray-800 bg-[#012325] px-2 py-1">
      <button
        onClick={handleVisibilityToggle}
        className="rounded p-1 hover:bg-gray-700"
        title={isVisible ? "Скрыть трек" : "Показать трек"}
      >
        {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
      </button>

      <button
        onClick={handleLockToggle}
        className="rounded p-1 hover:bg-gray-700"
        title={isLocked ? "Разблокировать трек" : "Заблокировать трек"}
      >
        {isLocked ? <Lock className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}
      </button>

      {!isVideoTrack && (
        <div className="flex flex-1 items-center gap-2">
          <button
            onClick={handleVolumeToggle}
            className="shrink-0 rounded p-1 hover:bg-gray-700"
            title={isMuted ? "Включить звук" : "Выключить звук"}
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4 text-gray-500" />
            ) : (
              <Volume2 className="h-4 w-4 text-gray-300" />
            )}
          </button>
          <div className="flex min-w-[100px] flex-1 items-center gap-2">
            <Slider
              value={[isMuted ? 0 : volume]}
              min={0}
              max={100}
              step={1}
              onValueChange={handleVolumeChange}
              className="w-full [&_[data-orientation=horizontal]]:h-0.5"
            />
            <span className="w-[30px] text-right text-xs text-gray-300">
              {isMuted ? 0 : volume}
            </span>
          </div>
        </div>
      )}

      <div className="shrink-0 truncate text-sm text-gray-300">
        {isVideoTrack ? `Видео ${track.index}` : `Аудио ${track.index}`}
      </div>
    </div>
  )
}
