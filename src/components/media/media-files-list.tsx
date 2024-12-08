import { Plus, PlusSquare } from "lucide-react"
import { nanoid } from "nanoid"
import { useRef, useState, useMemo, useCallback } from "react"

import { useMedia } from "@/hooks/use-media"
import {
  formatFileSize,
  formatTime,
  formatTimeWithMilliseconds,
  parseFileNameDateTime,
} from "@/lib/utils"
import { MediaFile } from "@/types/videos"
import { calculateTimeRanges } from "@/utils/videoUtils"

import { Button } from "../ui/button"

interface TimelineProps {
  time: number
  duration: number
}

const Timeline = ({ time, duration }: TimelineProps) => {
  return (
    <>
      <div
        className="absolute top-0 bottom-0 w-[2px] bg-red-500 pointer-events-none"
        style={{
          left: `${(time / duration) * 100}%`,
          zIndex: 20,
        }}
      />
      <div
        className="absolute bottom-0 text-xs bg-black/75 text-white px-1 rounded pointer-events-none"
        style={{
          left: `${(time / duration) * 100}%`,
          fontSize: "10px",
          transform: "translateX(-50%)",
          zIndex: 21,
        }}
      >
        {formatTime(time, true)}
      </div>
    </>
  )
}

// Обновляем функцию для расчета реальных размеров
const calculateRealDimensions = (stream: any) => {
  const rotation = stream.rotation ? parseInt(stream.rotation) : 0
  const width = stream.width
  const height = stream.height

  // Если поворот на 90 или 270 градусов, меняем местами ширину и высоту
  // и не применяем поворот, чтобы видео всегда было горизонтальным
  if (Math.abs(rotation) === 90 || Math.abs(rotation) === 270) {
    return {
      width: height,
      height: width,
      style: "", // Убираем поворот
    }
  }

  // Для остальных случаев оставляем как есть
  return {
    width: width,
    height: height,
    style: "",
  }
}

// Функция для определения последовательных записей
const getSequentialGroups = (files: MediaFile[]) => {
  const groups: { [key: string]: MediaFile[] } = {}

  files.forEach((file) => {
    const match = file.name.match(/(.+?)(?:_(\d+))?\.([^.]+)$/)
    if (match) {
      const baseName = match[1]
      if (!groups[baseName]) {
        groups[baseName] = []
      }
      groups[baseName].push(file)
    }
  })

  // Группируем по количеству файлов в последовательности
  const groupsBySize = Object.values(groups)
    .filter((files) => files.length > 1)
    .reduce((acc, files) => {
      const count = files.length
      acc[count] = (acc[count] || 0) + 1
      return acc
    }, {} as Record<number, number>)

  // Формируем строку описания
  return Object.entries(groupsBySize)
    .map(([size, count]) => `${count} серии по ${size} видео`)
    .join(", ")
}

// Add this helper function near the top of the file
const isHorizontalVideo = (width: number, height: number, rotation?: number) => {
  // If rotation is 90 or 270 degrees, swap width and height
  if (rotation && (Math.abs(rotation) === 90 || Math.abs(rotation) === 270)) {
    return height > width
  }
  return width > height
}

export function MediaFilesList() {
  const { media, isLoading, setTracks, tracks } = useMedia()
  const [playingFileId, setPlayingFileId] = useState<string | null>(null)
  const [hoverTimes, setHoverTimes] = useState<Record<string, { [streamIndex: number]: number }>>({})
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({})

  const groupedSequences = useMemo(() => getSequentialGroups(media), [media])

  const handlePlayPause = useCallback(async (e: React.MouseEvent, fileId: string) => {
    e.stopPropagation()
    const mediaElement = videoRefs.current[fileId]

    if (mediaElement) {
      try {
        if (playingFileId === fileId) {
          await mediaElement.pause()
          setPlayingFileId(null)
        } else {
          if (playingFileId && videoRefs.current[playingFileId]) {
            await videoRefs.current[playingFileId]?.pause()
          }

          await mediaElement.play()
          setPlayingFileId(fileId)
        }
      } catch (error) {
        console.error("Playback error:", error)
        setPlayingFileId(null)
      }
    }
  }, [playingFileId])

  const handleAddAllFiles = () => {
    // Group files by camera/track
    const groupedFiles = media.reduce((acc, file) => {
      const trackId = file.id || file.name

      if (!acc[trackId]) {
        acc[trackId] = []
      }
      acc[trackId].push(file)
      return acc
    }, {} as Record<string, typeof media>)

    // Create tracks for each group
    const tracks = Object.entries(groupedFiles).map(([trackId, files], index) => ({
      id: trackId,
      index: index + 1,
      isActive: false,
      combinedDuration: files.reduce(
        (sum, file) => sum + (file.probeData?.format.duration || 0),
        0,
      ),
      videos: files,
      timeRanges: calculateTimeRanges(files),
    }))

    // Update the store with new tracks
    setTracks(tracks)
  }

  const handleMouseMove = useCallback((
    e: React.MouseEvent<HTMLDivElement>,
    fileId: string,
    duration: number,
    streamIndex: number
  ) => {
    const mediaElement = e.currentTarget.querySelector(`[data-stream="${streamIndex}"]`)?.parentElement
    if (!mediaElement) return

    const rect = mediaElement.getBoundingClientRect()

    if (e.clientX < rect.left || e.clientX > rect.right) {
      setHoverTimes((prev) => ({
        ...prev,
        [fileId]: {
          ...(prev[fileId] || {}),
          [streamIndex]: null as any
        }
      }))
      return
    }

    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left))
    const percentage = x / rect.width
    const time = percentage * duration

    if (Number.isFinite(time)) {
      setHoverTimes((prev) => ({
        ...prev,
        [fileId]: {
          ...(prev[fileId] || {}),
          [streamIndex]: time
        }
      }))
      const videoElement = videoRefs.current[`${fileId}-${streamIndex}`]
      if (videoElement) {
        videoElement.currentTime = time
      }
    }
  }, [])

  if (isLoading) {
    return (
      <div className="p-4">
        <p className="text-sm text-gray-500">Загрузка файлов...</p>
      </div>
    )
  }

  if (!media?.length) {
    return (
      <div className="p-4">
        <p className="text-sm text-gray-500">Нет доступных файлов</p>
      </div>
    )
  }

  const handleAddMedia = (e: React.MouseEvent, file: MediaFile) => {
    e.stopPropagation()
    // Создаем новый трек с одним видео
    const newTrack = {
      id: nanoid(), // Используем уникальный ID
      index: tracks.length + 1, // Увеличиваем индекс
      isActive: false, // По умолчанию не активный
      combinedDuration: file.probeData?.format.duration || 0,
      videos: [file],
      timeRanges: calculateTimeRanges([file]),
    }

    // Проверяем существование трека
    const trackExists = tracks.some((t) => t.videos.some((v) => v.id === file.id))
    if (!trackExists) {
      setTracks([...tracks, newTrack])
    }
  }

  return (
    <>
      <div className="px-0 h-[calc(50vh-10px)] overflow-y-auto">
        <div className="space-y-2 bg-gray-50 dark:bg-gray-900">
          {media.map((file) => {
            const fileId = file.id || file.name
            const duration = file.probeData?.format.duration || 1
            const isAudio = file.probeData?.streams?.[0]?.codec_type === "audio"

            return (
              <div
                key={file.name}
                className="flex items-center gap-3 p-0 pr-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 group"
              >
                <div className="relative flex gap-1">
                  {isAudio ? (
                    <div className="w-15 h-15 flex-shrink-0 relative">
                      <div className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-gray-500 dark:text-gray-400"
                        >
                          <path d="M9 18V5l12-2v13" />
                          <circle cx="6" cy="18" r="3" />
                          <circle cx="18" cy="16" r="3" />
                        </svg>
                      </div>
                      <audio
                        ref={(el) => videoRefs.current[fileId] = el}
                        src={file.path}
                        preload="auto"
                        loop
                        onPlay={(e) => {
                          const audio = e.currentTarget
                          const currentTime = hoverTimes[fileId]
                          if (currentTime !== undefined && currentTime !== null) {
                            audio.currentTime = currentTime
                          }
                        }}
                      />
                      {hoverTimes[fileId] !== undefined &&
                        hoverTimes[fileId] !== null &&
                        Number.isFinite(hoverTimes[fileId]) && (
                        <Timeline
                          time={hoverTimes[fileId] as number}
                          duration={duration}
                        />
                      )}
                    </div>
                  ) : (
                    file.probeData?.streams
                      ?.filter(stream => stream.codec_type === "video")
                      .map((stream, index) => (
                        <div
                          key={index}
                          className="h-15 flex-shrink-0 relative"
                          style={{
                            width: (() => {
                              const dimensions = calculateRealDimensions(stream)
                              return `${60 * (dimensions.width / dimensions.height)}px`
                            })(),
                          }}
                          onMouseMove={(e) => handleMouseMove(e, fileId, duration, index)}
                        >
                          <div className="relative w-full h-full">
                            <video
                              data-stream={index}
                              onClick={(e) => handlePlayPause(e, `${fileId}-${index}`)}
                              ref={(el) => videoRefs.current[`${fileId}-${index}`] = el}
                              src={file.path}
                              className="w-full h-full object-cover rounded"
                              loop
                              playsInline
                              preload="metadata"
                              onLoadedMetadata={(e) => {
                                const video = e.currentTarget;
                                video.currentTime = 0;
                              }}
                              onPlay={(e) => {
                                const video = e.currentTarget
                                const currentTime = hoverTimes[fileId]?.[index]
                                if (currentTime !== undefined && currentTime !== null) {
                                  video.currentTime = currentTime
                                }
                              }}
                              onError={(e) => {
                                console.error("Video error:", e)
                                setPlayingFileId(null)
                              }}
                            />
                            {file.probeData?.streams.filter(s => s.codec_type === "video").length > 1 && (
                              <div className={`absolute ${
                                isHorizontalVideo(stream.width, stream.height, parseInt(stream.rotation || '0'))
                                  ? 'left-[calc(50%-8px)] top-[2px]'
                                  : 'left-1/2 top-[2px] -translate-x-1/2'
                              } text-white bg-black/50 rounded-full w-4 h-4 flex items-center justify-center text-xs`}>
                                {index + 1}
                              </div>
                            )}
                            {file.probeData?.streams?.some(stream => stream.codec_type === "audio") && (
                              <div className={`absolute ${
                                isHorizontalVideo(stream.width, stream.height, parseInt(stream.rotation || '0')) 
                                  ? 'left-1 bottom-1' 
                                  : 'left-1/2 bottom-1 -translate-x-1/2'
                              } text-white bg-black/50 rounded p-[3px]`}>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M9 18V5l12-2v13" />
                                  <circle cx="6" cy="18" r="3" />
                                  <circle cx="18" cy="16" r="3" />
                                </svg>
                              </div>
                            )}
                            {hoverTimes[fileId]?.[index] !== undefined &&
                              hoverTimes[fileId]?.[index] !== null &&
                              Number.isFinite(hoverTimes[fileId]?.[index]) && (
                              <Timeline
                                time={hoverTimes[fileId][index]}
                                duration={duration}
                              />
                            )}
                          </div>
                        </div>
                      ))
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium truncate text-gray-900 dark:text-gray-100 mb-3">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-900 dark:text-gray-100 min-w-12 text-right">
                      {file.probeData?.format.size && (
                        <span className="text-gray-500 dark:text-gray-400">
                          {formatFileSize(file.probeData.format.size)}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {!file.probeData?.format.creation_time
                        ? (parseFileNameDateTime(file.name)
                          ? formatTimeWithMilliseconds(
                              (parseFileNameDateTime(file.name) as Date).getTime() / 1000,
                            true,
                            true,
                            false,
                          )
                          : "-")
                        : formatTimeWithMilliseconds(
                          (file.probeData.format.creation_time as Date).getTime() / 1000,
                          true,
                          true,
                          false,
                        )}
                    </span>

                    <p className="text-xs">
                      {file.isVideo && file.probeData?.streams?.[0] && (
                        <span>
                          <span className="ml-2 text-gray-500 dark:text-gray-400">
                            {file.probeData.streams[0].width}x{file.probeData.streams[0].height}
                          </span>
                          {file.probeData?.streams[0].codec_name && (
                            <span className="ml-2 text-gray-500 dark:text-gray-400">
                              {file.probeData.streams[0].codec_name}
                            </span>
                          )}
                        </span>
                      )}
                      {file.probeData?.format.duration && (
                        <span className="text-gray-500 dark:text-gray-400 ml-4">
                          {formatTime(file.probeData.format.duration, false)}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <button
                  className="p-1 mr-2 ml-2 rounded bg-gray-500 hover:bg-gray-800 border border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-800 dark:border-gray-600 hover:dark:border-gray-300 transition-all duration-200 cursor-pointer text-white hover:text-white dark:text-gray-500 dark:hover:text-gray-200"
                  title="Добавить"
                  onClick={(e) => handleAddMedia(e, file)}
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            )
          })}
        </div>
      </div>
      {/* строка состояния и кнопка добавления всех файлов в трек */}
      <div className="flex justify-between items-center p-0 text-sm m-1">
        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          <span className="px-2">
            {media.filter((file) => file.probeData?.streams?.[0]?.codec_type === "video").length}
            {" "}
            видео
            {groupedSequences && (
              ` [ ${groupedSequences} ]`
            )}
          </span>
          <span className="px-1">
            {media.filter((file) => file.probeData?.streams?.[0]?.codec_type === "audio").length}
            {" "}
            аудио
          </span>
        </div>
        <div className="flex items-center gap-2 group cursor-pointer" onClick={handleAddAllFiles}>
          <span className="text-xs text-gray-500 dark:text-gray-400 opacity-50 group-hover:opacity-100 transition-opacity">
            Добавить все
          </span>
          <Button
            variant="secondary"
            size="icon"
            className="w-4 h-4 hover:bg-background/90 border-0 bg-transparent rounded flex items-center cursor-pointer group inset-0 text-sm text-gray-400 hover:text-gray-800 dark:hover:text-gray-100"
            onClick={handleAddAllFiles}
          >
            <PlusSquare />
          </Button>
        </div>
      </div>
    </>
  )
}
