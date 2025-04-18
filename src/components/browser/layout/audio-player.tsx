import { Pause, Play, Plus } from "lucide-react"

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
    <div className="flex items-center p-2 bg-background border border-border rounded-md w-full max-w-md">
      {/* Обложка */}
      <div className="relative h-12 w-12 mr-3 rounded overflow-hidden flex-shrink-0">
        {coverUrl ? (
          <img src={coverUrl} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-blue-800 flex items-center justify-center">
            <div className="absolute w-full h-0.5 bg-yellow-400 rotate-45 transform-origin-center" />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="absolute inset-0 bg-black/20 hover:bg-black/30 text-white"
          onClick={handlePlayPause}
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </Button>
      </div>

      {/* Информация и контролы */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium truncate">{title}</h3>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onAdd}>
              <Plus size={16} />
            </Button>
          </div>
        </div>

        {/* Визуализация */}
        <div className="h-5 flex items-center justify-between">
          <div className="w-full pr-12">
            <div className="h-5 flex items-center gap-[2px]">
              {Array.from({ length: 40 }).map((_, i) => (
                <div
                  key={i}
                  className="w-[2px] bg-gray-300 dark:bg-gray-600"
                  style={{ height: `${Math.random() * 100}%` }}
                />
              ))}
            </div>
          </div>
          <span className="text-xs text-gray-500 absolute right-14">{duration}</span>
        </div>
      </div>
    </div>
  )
}
