import { Pause, Play, Plus } from "lucide-react"
import Image from "next/image"

import { Button } from "@/components/ui/button"

interface AudioPlayerProps {
  title: string
  duration: string
  coverUrl?: string
  isPlaying?: boolean
  onPlay?: () => void
  onPause?: () => void
  onAdd?: () => void
}

/**
 * Компонент для воспроизведения аудиофайла
 *
 * @param title - Заголовок аудиофайла
 * @param duration - Длительность аудиофайла
 * @param coverUrl - URL обложки аудиофайла
 * @param isPlaying - Флаг, указывающий на то, воспроизводится ли аудиофайл
 * @param onPlay - Callback для воспроизведения аудиофайла
 * @param onPause - Callback для паузы аудиофайла
 * @param onAdd - Callback для добавления аудиофайла в список
 */
export function AudioPlayer({
  title,
  duration,
  coverUrl,
  isPlaying = false,
  onPlay,
  onPause,
  onAdd,
}: AudioPlayerProps) {
  const handlePlayPause = () => {
    if (isPlaying) {
      onPause?.()
    } else {
      onPlay?.()
    }
  }

  return (
    <div className="bg-background border-border flex w-full max-w-md items-center rounded-md border p-2">
      {/* Обложка */}
      <div className="relative mr-3 h-12 w-12 flex-shrink-0 overflow-hidden rounded">
        {coverUrl ? (
          <Image src={coverUrl} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-blue-800">
            <div className="transform-origin-center absolute h-0.5 w-full rotate-45 bg-yellow-400" />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="absolute inset-0 bg-black/20 text-white hover:bg-black/30"
          onClick={handlePlayPause}
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </Button>
      </div>

      {/* Информация и контролы */}
      <div className="min-w-0 flex-1">
        {/* Визуализация */}
        <div className="flex h-5 items-center justify-between">
          <span className="absolute right-14 text-xs text-gray-500">{duration}</span>
        </div>
      </div>
    </div>
  )
}
