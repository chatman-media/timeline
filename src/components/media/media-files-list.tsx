import { Plus, PlusSquare } from "lucide-react"
import { nanoid } from "nanoid"
import { useCallback, useMemo, useRef, useState } from "react"

import { useMedia } from "@/hooks/use-media"
import { formatDuration, formatFileSize, formatTimeWithMilliseconds } from "@/lib/utils"
import { MediaFile } from "@/types/videos"
import { getGroupedFiles, getSequentialGroups } from "@/utils/mediaUtils"
import { calculateTimeRanges } from "@/utils/videoUtils"

import { Button } from "../ui/button"
import { Skeleton } from "../ui/skeleton"
import { MediaPreview } from "./media-preview"

export function MediaFilesList() {
  const { media, isLoading, setTracks, tracks } = useMedia()
  const [playingFileId, setPlayingFileId] = useState<string | null>(null)
  const [hoverTimes, setHoverTimes] = useState<Record<string, { [streamIndex: number]: number }>>(
    {},
  )
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({})
  const [loadedVideos, setLoadedVideos] = useState<Record<string, boolean>>({})

  const groupedSequences = useMemo(() => getSequentialGroups(media), [media])
  const getFileId = useCallback((file: MediaFile) => {
    return file.id || file.path || file.name // Используем более надежную цепочку идентификаторов
  }, [])

  const handlePlayPause = useCallback(
    async (e: React.MouseEvent, file: MediaFile, streamIndex: number) => {
      e.stopPropagation()
      const fileId = getFileId(file)
      const videoKey = `${fileId}-${streamIndex}`
      const mediaElement = videoRefs.current[videoKey]

      if (mediaElement) {
        try {
          if (playingFileId === fileId) {
            await mediaElement.pause()
            setPlayingFileId(null)
          } else {
            if (playingFileId) {
              Object.entries(videoRefs.current).forEach(([key, player]) => {
                if (key.startsWith(playingFileId) && player) {
                  player.pause()
                }
              })
            }

            await mediaElement.play()
            setPlayingFileId(fileId)
          }
        } catch (error) {
          console.error("Playback error:", error)
          setPlayingFileId(null)
        }
      }
    },
    [playingFileId, getFileId],
  )

  const handleAddAllFiles = useCallback(() => {
    // Группируем видео по первым символам имени файла
    const groupedVideos = media.reduce((groups: Record<string, MediaFile[]>, file) => {
      if (file.probeData?.streams?.[0]?.codec_type !== "video") return groups

      const groupKey = file.name.slice(0, 2) // Используем первые 2 символа как ключ группы
      if (!groups[groupKey]) groups[groupKey] = []
      groups[groupKey].push(file)
      return groups
    }, {})
    // Create tracks for each sequence group
    const newTracks = Object.entries(groupedVideos).map(([groupKey, groupFiles], index) => {
      // Check if this sequence already has a track
      const existingTrack = tracks.find((track) =>
        track.videos.some((video) => video.name.startsWith(groupKey))
      )

      if (existingTrack) {
        // Update existing track with new videos
        return {
          ...existingTrack,
          videos: [...new Set([...existingTrack.videos, ...groupFiles])],
          combinedDuration: groupFiles.reduce(
            (total, file) => total + (file.probeData?.format.duration || 0),
            0,
          ),
          timeRanges: calculateTimeRanges(groupFiles),
        }
      }

      // Create new track
      return {
        id: nanoid(),
        index: tracks.length + index + 1,
        isActive: false,
        videos: groupFiles,
        startTime: groupFiles[0].startTime || 0,
        endTime: (groupFiles[groupFiles.length - 1].startTime || 0) +
          (groupFiles[groupFiles.length - 1].duration || 0),
        combinedDuration: groupFiles.reduce(
          (total, file) => total + (file.probeData?.format.duration || 0),
          0,
        ),
        timeRanges: calculateTimeRanges(groupFiles),
      }
    })

    // Update tracks state, filtering out duplicates
    setTracks([
      ...tracks,
      ...(newTracks.filter((t) => !(new Set(tracks.map((t) => t.id))).has(t.id))),
    ])
  }, [media, tracks, setTracks])

  const handleMouseMove = useCallback((
    e: React.MouseEvent<HTMLDivElement>,
    fileId: string,
    duration: number,
    streamIndex: number = 0, // По умолчанию 0 для аудио
  ) => {
    const mediaElement = e.currentTarget.querySelector(`[data-stream="${streamIndex}"]`)
      ?.parentElement || e.currentTarget // Fallback для аудио
    if (!mediaElement) return

    const rect = mediaElement.getBoundingClientRect()

    if (e.clientX < rect.left || e.clientX > rect.right) {
      setHoverTimes((prev) => ({
        ...prev,
        [fileId]: {
          ...(prev[fileId] || {}),
          [streamIndex]: null as any,
        },
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
          [streamIndex]: time,
        },
      }))
      const videoElement = videoRefs.current[`${fileId}-${streamIndex}`]
      if (videoElement) {
        videoElement.currentTime = time
      }
    }
  }, [])

  const handleMouseLeave = useCallback(async (fileId: string) => {
    const baseFileId = fileId.split("-")[0]
    if (playingFileId === baseFileId) {
      // Находим и останавливаем все активные плееры для файла
      Object.entries(videoRefs.current).forEach(([key, player]) => {
        if (key.startsWith(baseFileId) && player) {
          player.pause()
        }
      })
      setPlayingFileId(null)
    }
  }, [playingFileId])

  const handleAddDateFiles = useCallback((targetDate: string) => {
    const dateFiles = media.filter((file) => {
      if (!file.startTime) return false
      const fileDate = new Date(file.startTime * 1000).toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
      return fileDate === targetDate
    })

    const newTrack = {
      id: nanoid(),
      index: tracks.length + 1,
      isActive: false,
      videos: dateFiles,
      startTime: dateFiles[0]?.startTime || 0,
      endTime: (dateFiles[dateFiles.length - 1]?.startTime || 0) +
        (dateFiles[dateFiles.length - 1]?.duration || 0),
      combinedDuration: dateFiles.reduce(
        (total, file) => total + (file.probeData?.format.duration || 0),
        0,
      ),
      timeRanges: calculateTimeRanges(dateFiles),
    }

    setTracks([...tracks, newTrack])
  }, [media])

  if (isLoading) {
    return (
      <div className="px-0 h-[calc(50vh-10px)] overflow-y-auto">
        <div className="space-y-2 bg-gray-50 dark:bg-gray-900">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
            <div key={index} className="flex items-center gap-3 p-0 pr-2 rounded-md">
              <div className="h-[60px] w-[80px]">
                <Skeleton className="h-full w-full rounded" />
              </div>
              <div className="flex-1">
                <Skeleton className="h-4 w-3/4 mb-3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-7 w-7 rounded" />
            </div>
          ))}
        </div>
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
      startTime: file.startTime || 0,
      endTime: file.endTime || 0,
    }

    // Проверяем существование трека
    const trackExists = tracks.some((t) => t.videos.some((v) => v.id === file.id))
    if (!trackExists) {
      setTracks([...tracks, newTrack])
    }
  }

  const { maxFiles, maxDate } = media.reduce((acc, file) => {
    if (!file.startTime) return acc

    const date = new Date(file.startTime * 1000).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })

    // Count files per date and track maximum
    const currentCount = (acc.filesPerDate[date] || 0) + 1
    acc.filesPerDate[date] = currentCount

    // Update max if current count is higher
    if (currentCount > acc.maxFiles) {
      acc.maxFiles = currentCount
      acc.maxDate = date
    }

    return acc
  }, {
    filesPerDate: {} as Record<string, number>,
    maxFiles: 0,
    maxDate: "",
  })

  return (
    <>
      <div className="px-0 h-[calc(50vh-10px)] overflow-y-auto">
        <div className="space-y-2 bg-gray-50 dark:bg-gray-900">
          {media.map((file) => {
            const fileId = getFileId(file)
            const duration = file.probeData?.format.duration || 1
            const isAudio = file.probeData?.streams?.[0]?.codec_type === "audio"

            return (
              <div
                key={fileId}
                className="flex items-center gap-3 p-0 pr-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 group"
              >
                <div className="relative flex gap-1">
                  <MediaPreview
                    file={file}
                    fileId={fileId}
                    duration={duration}
                    isAudio={isAudio}
                    videoRefs={videoRefs}
                    loadedVideos={loadedVideos}
                    setLoadedVideos={setLoadedVideos}
                    hoverTimes={hoverTimes}
                    handleMouseMove={handleMouseMove}
                    handlePlayPause={handlePlayPause}
                    handleMouseLeave={handleMouseLeave}
                    setPlayingFileId={setPlayingFileId}
                  />
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
                      {formatTimeWithMilliseconds(
                        file.startTime || 0,
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
                          {formatDuration(file.probeData.format.duration)}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <button
                  className="p-1 mr-1 rounded bg-gray-500 hover:bg-gray-800 border border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-800 dark:border-gray-600 hover:dark:border-gray-300 transition-all duration-200 cursor-pointer text-white hover:text-white dark:text-gray-500 dark:hover:text-gray-200"
                  title="Добавить"
                  onClick={(e) => handleAddMedia(e, file)}
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>
            )
          })}
        </div>
      </div>
      {/* строка состояния и кнопка добавления всех файлов в трек */}
      <div className="flex justify-between items-start p-0 text-sm m-1">
        <div className="flex flex-col items-start gap-0 text-xs text-gray-500 dark:text-gray-500">
          <span className="px-1">
            {media.filter((f) => f.probeData?.streams?.[0]?.codec_type === "video").length} видео и
            {"  "}{media.filter((f) => f.probeData?.streams?.[0]?.codec_type === "audio").length}
            {" "}
            аудио
          </span>
          <span className="px-1">
            {groupedSequences && `${groupedSequences}`}
          </span>
        </div>
        <div className="flex flex-col items-start gap-0 text-xs text-gray-400 dark:text-gray-400">
          <span
            className="px-1 relative group cursor-pointer text-gray-500 hover:text-gray-800 dark:hover:text-gray-100 flex items-center gap-1"
            onClick={() => maxFiles > 1 && handleAddDateFiles(maxDate)}
            title={maxFiles > 1 ? "Добавить файлы за эту дату" : ""}
          >
            {maxFiles > 1 ? `${maxFiles} файлов ${maxDate}` : ""}
            {maxFiles > 1 && (
              <PlusSquare className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 group-hover:text-gray-800 dark:group-hover:text-gray-100" />
            )}
          </span>
        </div>
        <div className="flex items-center gap-2 group cursor-pointer" onClick={handleAddAllFiles}>
          <span className="text-xs text-gray-900 dark:text-gray-400 opacity-50 group-hover:opacity-100 hover:text-gray-800 dark:hover:text-gray-100 transition-opacity flex items-center gap-1">
            Добавить все
            <PlusSquare className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </span>
        </div>
      </div>
    </>
  )
}
