import { Music } from "lucide-react"
import { memo, useCallback, useEffect, useRef, useState } from "react"
import { LiveAudioVisualizer } from "react-audio-visualize"

import { cn, formatDuration } from "@/lib/utils"
import { MediaFile } from "@/types/media"

import { PreviewTimeline } from ".."
import { AddMediaButton } from "../layout/add-media-button"

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
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percentage = x / rect.width
      const newTime = percentage * (file.duration || 0)
      setHoverTime(newTime)

      if (audioRef.current) {
        audioRef.current.currentTime = newTime
      }
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
    if (audioRef.current && isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }, [isPlaying])

  useEffect(() => {
    const audioElement = audioRef.current
    if (!audioElement) return

    const initAudioContext = () => {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext()
        }

        const audioContext = audioContextRef.current

        if (!sourceRef.current) {
          sourceRef.current = audioContext.createMediaElementSource(audioElement)
        }

        const destination = audioContext.createMediaStreamDestination()
        sourceRef.current.connect(destination)
        sourceRef.current.connect(audioContext.destination)

        const recorder = new MediaRecorder(destination.stream)
        setMediaRecorder(recorder)
        recorder.start()
      } catch (error) {
        console.error("Error initializing audio context:", error)
      }
    }

    setTimeout(initAudioContext, 100)

    return () => {
      if (mediaRecorder) {
        mediaRecorder.stop()
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect()
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  return (
    <div
      className={`group relative h-full flex-shrink-0 bg-gray-200 dark:bg-gray-700`}
      style={{
        height: `${size}px`,
        width: `${(size * dimensions[0]) / dimensions[1]}px`,
      }}
      onMouseMove={handleMouseMove}
      onClick={handlePlayPause}
      onMouseLeave={handleMouseLeave}
    >
      <audio
        ref={audioRef}
        src={file.path}
        preload="auto"
        tabIndex={0}
        className="pointer-events-none absolute inset-0 h-full w-full focus:outline-none"
        onEnded={() => setIsPlaying(false)}
        onLoadedMetadata={() => setIsLoaded(true)}
        onKeyDown={(e) => {
          if (e.code === "Space") {
            e.preventDefault()
            handlePlayPause(e as unknown as React.MouseEvent)
          }
        }}
      />

      {/* Иконка музыки */}
      <div
        className={`absolute ${size > 100 ? "bottom-1 left-1" : "bottom-0.5 left-0.5"} cursor-pointer rounded-xs bg-black/50 p-0.5 text-white`}
      >
        <Music size={size > 100 ? 16 : 12} />
      </div>

      {/* полоса времени */}
      {hoverTime !== null && Number.isFinite(hoverTime) && (
        <PreviewTimeline
          time={hoverTime}
          duration={file.duration || 0}
          videoRef={audioRef.current}
        />
      )}

      {/* Имя файла */}
      {showFileName && (
        <div
          className={`absolute font-medium ${size > 100 ? "top-1" : "top-0.5"} ${
            size > 100 ? "left-1" : "left-0.5"
          } ${
            size > 100 ? "px-[4px] py-[2px]" : "px-[2px] py-0"
          } line-clamp-1 max-w-[calc(60%)] rounded-xs bg-black/50 text-xs leading-[16px] text-white`}
          style={{
            fontSize: size > 100 ? "13px" : "11px",
          }}
        >
          {file.name}
        </div>
      )}

      {/* кнопка добавления */}
      {onAddMedia && isLoaded && (
        <AddMediaButton file={file} onAddMedia={onAddMedia} isAdded={isAdded} size={size} />
      )}

      {/* Аудио визуализация */}
      <div
        className="pointer-events-none absolute top-0 right-0 left-0 select-none"
        style={{
          height: `${size}px`,
          width: `${(size * dimensions[0]) / dimensions[1]}px`,
        }}
      >
        {mediaRecorder && (
          <LiveAudioVisualizer
            mediaRecorder={mediaRecorder}
            width={(size * dimensions[0]) / dimensions[1]}
            height={size}
            barWidth={1}
            gap={0}
            barColor="#35d1c1"
            backgroundColor="transparent"
          />
        )}
      </div>
    </div>
  )
})
