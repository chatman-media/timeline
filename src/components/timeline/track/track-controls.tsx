import { Eye, EyeOff, Lock, LockOpen, Volume2, VolumeX } from "lucide-react"
import { useState } from "react"

import { Track } from "@/types/videos"

interface TrackControlsProps {
  track: Track
  onVisibilityChange?: (visible: boolean) => void
  onLockChange?: (locked: boolean) => void
  onVolumeChange?: (muted: boolean) => void
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
    onVolumeChange?.(newValue)
  }

  // Определяем, является ли трек видео или аудио
  const isVideoTrack = track.videos.some(video => 
    video.probeData?.streams?.some(stream => stream.codec_type === "video")
  )

  return (
    <div className="flex items-center gap-2 px-2 py-1 bg-[#012325] border-r border-gray-800 w-[200px]">
      <button
        onClick={handleVisibilityToggle}
        className="p-1 hover:bg-gray-700 rounded"
        title={isVisible ? "Скрыть трек" : "Показать трек"}
      >
        {isVisible ? (
          <Eye className="w-4 h-4 text-gray-300" />
        ) : (
          <EyeOff className="w-4 h-4 text-gray-500" />
        )}
      </button>
      
      <button
        onClick={handleLockToggle}
        className="p-1 hover:bg-gray-700 rounded"
        title={isLocked ? "Разблокировать трек" : "Заблокировать трек"}
      >
        {isLocked ? (
          <Lock className="w-4 h-4 text-gray-300" />
        ) : (
          <LockOpen className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {!isVideoTrack && (
        <button
          onClick={handleVolumeToggle}
          className="p-1 hover:bg-gray-700 rounded"
          title={isMuted ? "Включить звук" : "Выключить звук"}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-gray-500" />
          ) : (
            <Volume2 className="w-4 h-4 text-gray-300" />
          )}
        </button>
      )}

      <div className="flex-1 text-sm text-gray-300 truncate">
        {isVideoTrack ? `V${track.index}` : `A${track.index}`}
      </div>
    </div>
  )
} 