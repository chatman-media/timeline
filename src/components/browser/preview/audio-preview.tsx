import { Music } from "lucide-react"
import { memo, useCallback, useRef, useState } from "react"

import { formatDuration } from "@/lib/utils"
import { MediaFile } from "@/types/media"

import { PreviewTimeline } from ".."
import { AddMediaButton } from "./add-media-button"

interface AudioPreviewProps {
  file: MediaFile
  onAddMedia?: (e: React.MouseEvent, file: MediaFile) => void
  isAdded?: boolean
  size?: number
  showFileName?: boolean
  hideTime?: boolean
  dimensions?: [number, number]
}

/**
 * Предварительный просмотр аудиофайла
 *
 * Функционал:
 * - Отображает превью аудиофайла с поддержкой ленивой загрузки
 * - Адаптивный размер контейнера с соотношением сторон 16:9
 * - Поддерживает два размера UI (стандартный и большой при size > 100)
 * - Опциональное отображение имени файла
 * - Кнопка добавления с состояниями (добавлено/не добавлено)
 * - Темная тема для UI элементов
 *
 * @param file - Объект файла с путем и метаданными
 * @param onAddMedia - Callback для добавления файла
 * @param isAdded - Флаг, показывающий добавлен ли файл
 * @param size - Размер превью в пикселях (по умолчанию 60)
 * @param showFileName - Флаг для отображения имени файла
 * @param hideTime - Флаг для скрытия времени
 * @param dimensions - Соотношение сторон контейнера [ширина, высота], по умолчанию [16, 9]
 */
export const AudioPreview = memo(function AudioPreview({
  file,
  onAddMedia,
  isAdded,
  size = 60,
  showFileName = false,
  hideTime = false,
  dimensions = [16, 9],
}: AudioPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [hoverTime, setHoverTime] = useState<number | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percentage = x / rect.width
      const newTime = percentage * (file.duration || 0)
      setHoverTime(newTime)
    },
    [file.duration],
  )

  const handlePlayPause = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      if (!audioRef.current) return

      if (isPlaying) {
        audioRef.current.pause()
      } else {
        if (hoverTime !== null) {
          audioRef.current.currentTime = hoverTime
        }
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    },
    [isPlaying, hoverTime],
  )

  const handleMouseLeave = useCallback(() => {
    setHoverTime(null)
  }, [])

  return (
    <div
      className={`h-full flex-shrink-0 relative`}
      style={{ height: `${size}px`, width: `${(size * dimensions[0]) / dimensions[1]}px` }}
      onMouseMove={handleMouseMove}
      onClick={handlePlayPause}
      onMouseLeave={handleMouseLeave}
    >
      {!hideTime && (
        <div
          className={`absolute text-xs leading-[16px] ${size > 100 ? "right-1 top-1" : "right-0.5 top-0.5"} text-white bg-black/50 rounded ${size > 100 ? "px-[4px] py-[2px]" : "px-[2px] py-0"}`}
        >
          {formatDuration(file.duration || 0)}
        </div>
      )}

      <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
        <Music className="w-6 h-6 text-gray-500 dark:text-gray-400" />
      </div>

      <audio
        ref={audioRef}
        src={file.path}
        preload="auto"
        tabIndex={0}
        className="absolute inset-0 w-full h-full focus:outline-none pointer-events-none"
        onEnded={() => {
          setIsPlaying(false)
        }}
        onLoadedMetadata={() => {
          setIsLoaded(true)
        }}
        onKeyDown={(e) => {
          if (e.code === "Space") {
            e.preventDefault()
            handlePlayPause(e as unknown as React.MouseEvent)
          }
        }}
        onMouseEnter={(e) => e.currentTarget.focus()}
      />

      <div
        className={`absolute ${size > 100 ? "left-1 bottom-1" : "left-0.5 bottom-0.5"} text-white cursor-pointer bg-black/50 rounded p-0.5`}
      >
        <Music size={size > 100 ? 16 : 12} />
      </div>

      {hoverTime !== null && Number.isFinite(hoverTime) && (
        <PreviewTimeline
          time={hoverTime}
          duration={file.duration || 0}
          videoRef={audioRef.current}
        />
      )}

      {showFileName && (
        <div
          className={`absolute font-medium  ${size > 100 ? "" : "top-0.5 left-0.5"} ${size > 100 ? "px-[4px] py-[2px]" : "px-[2px] py-0"} text-xs bg-black/50 text-white rounded-xs leading-[16px] line-clamp-1 max-w-[calc(60%)]`}
        >
          {file.name}
        </div>
      )}

      {onAddMedia && isLoaded && (
        <AddMediaButton file={file} onAddMedia={onAddMedia} isAdded={isAdded} size={size} />
      )}
    </div>
  )
})
