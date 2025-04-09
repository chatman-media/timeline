import { Sliders } from "lucide-react"
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"

import { useRootStore } from "@/hooks/use-root-store"
import { useVideoPlayer } from "@/hooks/use-video-player"
import { formatDuration, formatFileSize } from "@/lib/utils"
import { rootStore } from "@/stores/root-store"
import { FileGroup, MediaFile } from "@/types/videos"
import {
  getFileType,
  groupFilesByDate,
  prepareFileGroups,
} from "@/utils/media-utils"

import { Skeleton } from "../../ui/skeleton"
import { FileInfo, MediaPreview, StatusBar } from ".."

// Оборачиваем в memo для предотвращения ненужных рендеров
export const MediaFileList = memo(function MediaFileList({
  viewMode = "thumbnails",
}: { viewMode?: "list" | "grid" | "thumbnails" }) {
  const { media, isLoading, addNewTracks, addedFiles } = useRootStore()
  const [searchQuery, setSearchQuery] = useState("")
  const dataFetchedRef = useRef(false) // Для отслеживания, выполнялся ли уже запрос

  console.log("[MediaFileList] Rendering with:", {
    mediaCount: media.length,
    isLoading,
    hasAddedFiles: addedFiles.size > 0,
    viewMode,
  })

  // Используем useMemo для сортировки медиафайлов, чтобы не пересортировывать при каждом рендере
  const sortedMedia = useMemo(() => {
    const sorted = [...media].sort((a, b) => {
      const timeA = a.startTime || 0
      const timeB = b.startTime || 0
      return timeB - timeA
    })
    console.log("[MediaFileList] Rendering media list with:", {
      mediaCount: media.length,
      sortedMediaCount: sorted.length,
    })
    return sorted
  }, [media])

  // Мемоизируем другие вычисления
  const sortedDates = useMemo(() => groupFilesByDate(media), [media])
  const [fileGroups, setFileGroups] = useState<Record<string, FileGroup>>({})

  // Убираем прямой запрос к API и оставляем только fetchVideos при первой загрузке
  useEffect(() => {
    if (!dataFetchedRef.current && media.length === 0) {
      console.log("[MediaFileList] First render, fetching media...")
      dataFetchedRef.current = true

      // Делаем прямой запрос к API только если нет существующих данных
      const directFetch = async () => {
        try {
          console.log("[MediaFileList] Прямой запрос к /api/media...")
          const response = await fetch("/api/media")
          if (!response.ok) {
            console.error("[MediaFileList] Ошибка запроса:", response.statusText)
            return
          }

          const data = await response.json()
          console.log("[MediaFileList] Получены данные:", data)

          if (data && data.media && Array.isArray(data.media)) {
            console.log("[MediaFileList] Найдены медиафайлы:", data.media.length)

            if (data.media.length > 0) {
              // Отправляем событие setMedia вместо addNewTracks
              rootStore.send({
                type: "setMedia",
                media: data.media,
              })
            }
          }
        } catch (error) {
          console.error("[MediaFileList] Ошибка запроса:", error)
        }
      }

      directFetch()
    }
  }, [media.length])

  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({})
  const [loadedVideos, setLoadedVideos] = useState<Record<string, boolean>>({})
  const [hoverTimes, setHoverTimes] = useState<Record<string, { [streamIndex: number]: number }>>(
    {},
  )

  const { setPlayingFileId, handlePlayPause, handleMouseLeave } = useVideoPlayer({
    videoRefs,
  })

  const getFileId = useCallback((file: MediaFile) => {
    return file.id || file.path || file.name
  }, [])

  const handleMouseMove = useCallback(
    (
      e: React.MouseEvent<HTMLDivElement>,
      fileId: string,
      duration: number,
      streamIndex: number = 0,
    ) => {
      const mediaElement =
        e.currentTarget.querySelector(`[data-stream="${streamIndex}"]`)?.parentElement ||
        e.currentTarget
      if (!mediaElement) return

      const rect = mediaElement.getBoundingClientRect()

      if (e.clientX < rect.left || e.clientX > rect.right) {
        setHoverTimes((prev: Record<string, { [streamIndex: number]: number }>) => ({
          ...prev,
          [fileId]: {
            ...(prev[fileId] || {}),
            // deno-lint-ignore no-explicit-any
            [streamIndex]: null as any,
          },
        }))
        return
      }

      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left))
      const percentage = x / rect.width
      const time = percentage * duration

      if (Number.isFinite(time)) {
        setHoverTimes((prev: Record<string, { [streamIndex: number]: number }>) => ({
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
    },
    [],
  )

  const handleAddMedia = useCallback(
    (e: React.MouseEvent, file: MediaFile) => {
      e.stopPropagation()
      if (!file.path || addedFiles.has(file.path)) return

      // Добавляем файл на таймлайн
      addNewTracks([file])

      // Отмечаем файл как добавленный
      if (file.path) {
        rootStore.send({
          type: "addToAddedFiles",
          filePaths: [file.path],
        })
      }
    },
    [addNewTracks, addedFiles],
  )

  const handleAddAllFiles = useCallback(() => {
    // Добавляем все файлы на таймлайн
    addNewTracks(media)

    // Отмечаем все файлы как добавленные
    const filePaths = media.filter((file) => file.path).map((file) => file.path as string)

    if (filePaths.length > 0) {
      rootStore.send({
        type: "addToAddedFiles",
        filePaths,
      })
    }
  }, [media, addNewTracks])

  const handleAddDateFiles = useCallback(
    (targetDate: string) => {
      const dateFiles = media.filter((file) => {
        if (!file.startTime) return false
        const fileDate = new Date(file.startTime * 1000).toLocaleDateString("ru-RU", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
        return fileDate === targetDate && file.probeData?.streams?.[0]?.codec_type === "video"
      })

      // Добавляем файлы на таймлайн
      addNewTracks(dateFiles)

      // Отмечаем файлы как добавленные
      const filePaths = dateFiles.filter((file) => file.path).map((file) => file.path as string)

      if (filePaths.length > 0) {
        rootStore.send({
          type: "addToAddedFiles",
          filePaths,
        })
      }
    },
    [media, addNewTracks],
  )

  const handleAddAllVideoFiles = useCallback(() => {
    handleAddByIds(fileGroups.videos.fileIds)
  }, [fileGroups])

  const handleAddAllAudioFiles = useCallback(() => {
    handleAddByIds(fileGroups.audio.fileIds)
  }, [fileGroups])

  useEffect(() => {
    if (media.length) {
      console.log("[MediaFileList] Media changed, count:", media.length)
      setFileGroups(prepareFileGroups(media))
    }
  }, [media])

  const handleAddByIds = useCallback(
    (fileIds: string[]) => {
      const filesToAdd = media.filter((file) => fileIds.includes(file.id))

      // Добавляем файлы на таймлайн
      addNewTracks(filesToAdd)

      // Отмечаем файлы как добавленные
      const filePaths = filesToAdd.filter((file) => file.path).map((file) => file.path as string)

      if (filePaths.length > 0) {
        rootStore.send({
          type: "addToAddedFiles",
          filePaths,
        })
      }
    },
    [media, addNewTracks],
  )

  if (isLoading) {
    console.log("[MediaFileList] Rendering loading skeleton")
    return (
      <div className="px-0 h-full overflow-y-auto">
        <div className="space-y-2 dark:bg-[#1b1a1f]">
          {[...Array(8)].map((_, index) => (
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
    console.log("[MediaFileList] No media available")
    return (
      <div className="p-4">
        <p className="text-sm text-gray-500">Нет доступных файлов</p>
      </div>
    )
  }

  console.log("[MediaFileList] Rendering media list with:", {
    mediaCount: media.length,
    sortedMediaCount: sortedMedia.length,
  })

  return (
    <div className="flex flex-col h-full">
      <div className="space-y-1 p-3">
        <div className="flex items-center justify-between mb-4">
          <div className="relative w-[50%]">
            <input
              type="text"
              placeholder="Поиск..."
              className="w-full px-3 py-1 text-sm bg-transparent border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Sliders className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>

        {viewMode === "list" ? (
          <table className="w-full border-collapse">
            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
              <tr>
                <th className="px-4 py-1 text-left text-xs font-medium text-gray-500 uppercase">
                  Название
                </th>
                <th className="px-4 py-1 text-left text-xs font-medium text-gray-500 uppercase">
                  Начало
                </th>
                <th className="px-4 py-1 text-left text-xs font-medium text-gray-500 uppercase">
                  Длительность
                </th>
                <th className="px-4 py-1 text-left text-xs font-medium text-gray-500 uppercase">
                  Разрешение
                </th>
                <th className="px-4 py-1 text-left text-xs font-medium text-gray-500 uppercase">
                  Кодек
                </th>
                <th className="px-4 py-1 text-left text-xs font-medium text-gray-500 uppercase">
                  Битрейт
                </th>
                <th className="px-4 py-1 text-left text-xs font-medium text-gray-500 uppercase">
                  Размер
                </th>
                <th className="px-4 py-1"></th>
              </tr>
            </thead>
            <tbody>
              {sortedMedia.map((file) => {
                const fileId = getFileId(file)
                const isAdded = Boolean(file.path && addedFiles.has(file.path))
                const videoStream = file.probeData?.streams?.find((s) => s.codec_type === "video")
                const startTime = file.startTime
                  ? new Date(file.startTime * 1000).toLocaleString("ru-RU", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })
                  : "-"
                const duration = file.probeData?.format.duration
                  ? formatDuration(file.probeData.format.duration)
                  : "-"
                const resolution = videoStream ? `${videoStream.width}x${videoStream.height}` : "-"
                const codec = videoStream?.codec_name?.toUpperCase() || "-"
                const bitrate = file.probeData?.format.bit_rate
                  ? `${Math.round(file.probeData.format.bit_rate / 1000)} Kbps`
                  : "-"
                const fileSize = formatFileSize(file.probeData?.format.size || 0)

                return (
                  <tr
                    key={fileId}
                    className={`border-b dark:border-gray-700 ${
                      isAdded
                        ? "opacity-50 pointer-events-none"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    <td className="px-3 py-0 text-[12px] whitespace-nowrap">{file.name}</td>
                    <td className="px-3 py-0 text-[12px] whitespace-nowrap">{startTime}</td>
                    <td className="px-3 py-0 text-[12px] whitespace-nowrap">{duration}</td>
                    <td className="px-3 py-0 text-[12px] whitespace-nowrap">{resolution}</td>
                    <td className="px-3 py-0 text-[12px] whitespace-nowrap">{codec}</td>
                    <td className="px-3 py-0 text-[12px] whitespace-nowrap">{bitrate}</td>
                    <td className="px-3 py-0 text-[12px] whitespace-nowrap">{fileSize}</td>
                    <td className="px-3 py-0">
                      <button
                        onClick={(e) => handleAddMedia(e, file)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                      >
                        +
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <div className="space-y-2">
            {sortedMedia.map((file) => {
              const fileId = getFileId(file)
              const duration = file.probeData?.format.duration || 1
              const isAudio = getFileType(file) === "audio"
              const isAdded = Boolean(file.path && addedFiles.has(file.path))

              return (
                <div
                  key={fileId}
                  className={`flex items-center gap-3 p-0 pr-2 rounded-md group w-full overflow-hidden
                    ${
                isAdded
                  ? "opacity-50 pointer-events-none"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
                  style={{ maxWidth: "100%" }}
                >
                  <div className="relative flex-shrink-0 flex gap-1">
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
                      onAddMedia={handleAddMedia}
                      isAdded={isAdded}
                    />
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <FileInfo file={file} onAddMedia={handleAddMedia} isAdded={isAdded} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <div className="flex-shrink-0 h-[24px] w-full absolute bottom-0 left-0 right-0 z-10">
        <StatusBar
          media={sortedMedia}
          onAddAllVideoFiles={handleAddAllVideoFiles}
          onAddAllAudioFiles={handleAddAllAudioFiles}
          onAddDateFiles={handleAddDateFiles}
          onAddAllFiles={handleAddAllFiles}
          sortedDates={sortedDates}
          addedFiles={addedFiles}
        />
      </div>
    </div>
  )
})
