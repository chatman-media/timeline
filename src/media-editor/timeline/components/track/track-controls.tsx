import { Eye, EyeOff, Lock, LockOpen, Volume2, VolumeX } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { Slider } from "@/components/ui/slider"
import { useTimeline } from "@/media-editor/timeline/services"
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
  const { t } = useTranslation()
  const {
    trackVisibility,
    trackLocked,
    trackVolumes,
    setTrackVisibility,
    setTrackLocked,
    setTrackVolume,
  } = useTimeline()

  // Получаем состояние видимости и блокировки из контекста таймлайна
  const isVisible = trackVisibility[track.id] !== false // По умолчанию видимый
  const isLocked = trackLocked[track.id] === true // По умолчанию разблокированный

  // Получаем громкость из контекста таймлайна или используем значение по умолчанию
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(trackVolumes[track.id] || 100)

  // Обновляем локальное состояние при изменении значений в контексте
  useEffect(() => {
    setVolume(trackVolumes[track.id] || 100)
  }, [trackVolumes, track.id])

  const handleVisibilityToggle = (): void => {
    const newValue = !isVisible
    // Обновляем состояние в контексте таймлайна
    setTrackVisibility(track.id, newValue)
    // Вызываем колбэк для обратной совместимости
    onVisibilityChange?.(newValue)
  }

  const handleLockToggle = (): void => {
    const newValue = !isLocked
    // Обновляем состояние в контексте таймлайна
    setTrackLocked(track.id, newValue)
    // Вызываем колбэк для обратной совместимости
    onLockChange?.(newValue)
  }

  const handleVolumeToggle = (): void => {
    const newValue = !isMuted
    setIsMuted(newValue)
    const newVolume = newValue ? 0 : volume
    // Обновляем громкость в контексте таймлайна
    setTrackVolume(track.id, newVolume)
    // Вызываем колбэк для обратной совместимости
    onVolumeChange?.(newVolume)
  }

  const handleVolumeChange = (value: number[]): void => {
    const newVolume = value[0]
    setVolume(newVolume)
    // Обновляем громкость в контексте таймлайна
    setTrackVolume(track.id, newVolume)
    // Вызываем колбэк для обратной совместимости
    onVolumeChange?.(newVolume)
  }

  // Определяем, является ли трек видео или аудио
  const isVideoTrack = track.videos?.some((video) =>
    video.probeData?.streams?.some((stream) => stream.codec_type === "video"),
  )

  return (
    <div className="flex w-[130px] items-center gap-2 border-r border-gray-800 bg-[#012325] px-2 py-1">
      <button
        onClick={handleVisibilityToggle}
        className="rounded p-1 hover:bg-gray-700"
        title={isVisible ? t("timeline.track.hideTrack") : t("timeline.track.showTrack")}
      >
        {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
      </button>

      <button
        onClick={handleLockToggle}
        className="rounded p-1 hover:bg-gray-700"
        title={isLocked ? t("timeline.track.unlockTrack") : t("timeline.track.lockTrack")}
      >
        {isLocked ? <Lock className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}
      </button>

      {!isVideoTrack && (
        <div className="flex flex-1 items-center gap-2">
          <button
            onClick={handleVolumeToggle}
            className="shrink-0 rounded p-1 hover:bg-gray-700"
            title={isMuted ? t("timeline.track.unmute") : t("timeline.track.mute")}
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
        {isVideoTrack
          ? t("timeline.track.videoTrack", { index: track.index })
          : t("timeline.track.audioTrack", { index: track.index })}
      </div>
    </div>
  )
}
