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
    <div className="flex items-center gap-2 px-2 py-1 bg-[#012325] border-r border-gray-800 w-[200px]">
      <button
        onClick={handleVisibilityToggle}
        className="p-1 hover:bg-gray-700 rounded"
        title={isVisible ? "Скрыть трек" : "Показать трек"}
      >
        {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
      </button>

      <button
        onClick={handleLockToggle}
        className="p-1 hover:bg-gray-700 rounded"
        title={isLocked ? "Разблокировать трек" : "Заблокировать трек"}
      >
        {isLocked ? <Lock className="w-4 h-4" /> : <LockOpen className="w-4 h-4" />}
      </button>

      {!isVideoTrack && (
        <div className="flex items-center gap-2 flex-1">
          <button
            onClick={handleVolumeToggle}
            className="p-1 hover:bg-gray-700 rounded shrink-0"
            title={isMuted ? "Включить звук" : "Выключить звук"}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-gray-500" />
            ) : (
              <Volume2 className="w-4 h-4 text-gray-300" />
            )}
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-[100px]">
            <Slider
              value={[isMuted ? 0 : volume]}
              min={0}
              max={100}
              step={1}
              onValueChange={handleVolumeChange}
              className="w-full [&_[data-orientation=horizontal]]:h-0.5"
            />
            <span className="text-xs text-gray-300 w-[30px] text-right">
              {isMuted ? 0 : volume}
            </span>
          </div>
        </div>
      )}

      <div className="text-sm text-gray-300 truncate shrink-0">
        {isVideoTrack ? `Видео ${track.index}` : `Аудио ${track.index}`}
      </div>
    </div>
  )
}
