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
  getSequentialFiles 
} from "@/utils/media-utils"

import { Skeleton } from "../../ui/skeleton"
import { FileInfo, MediaPreview, StatusBar } from ".."
import { MediaToolbar } from "./media-toolbar"

// Helper function to group files by duration
const groupFilesByDuration = (files: MediaFile[]) => {
  const groups = {
    "less1min": { label: "Менее 1 минуты", files: [] },
    "1to5min": { label: "1-5 минут", files: [] },
    "5to30min": { label: "5-30 минут", files: [] },
    "more30min": { label: "Более 30 минут", files: [] },
  }

  files.forEach(file => {
    const duration = file.probeData?.format?.duration || 0
    
    if (duration < 60) {
      groups.less1min.files.push(file)
    } else if (duration < 300) {
      groups["1to5min"].files.push(file)
    } else if (duration < 1800) {
      groups["5to30min"].files.push(file)
    } else {
      groups.more30min.files.push(file)
    }
  })

  return Object.entries(groups)
    .filter(([_, group]) => group.files.length > 0)
    .map(([key, group]) => ({
      key,
      label: group.label,
      files: group.files
    }))
}

// Helper function to group files by type
const groupFilesByType = (files: MediaFile[]) => {
  const groups = {
    "video": { label: "Видео", files: [] },
    "audio": { label: "Аудио", files: [] },
    "image": { label: "Изображения", files: [] },
    "other": { label: "Другое", files: [] },
  }

  files.forEach(file => {
    const fileType = getFileType(file)
    if (groups[fileType]) {
      groups[fileType].files.push(file)
    } else {
      groups.other.files.push(file)
    }
  })

  return Object.entries(groups)
    .filter(([_, group]) => group.files.length > 0)
    .map(([key, group]) => ({
      key,
      label: group.label,
      files: group.files
    }))
}

// Helper function to group files by import date
const groupFilesByImportDate = (files: MediaFile[]) => {
  const dateGroups: Record<string, MediaFile[]> = {}
  
  files.forEach(file => {
    const importDate = file.importDate ? new Date(file.importDate * 1000).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }) : "Неизвестно"
    
    if (!dateGroups[importDate]) {
      dateGroups[importDate] = []
    }
    dateGroups[importDate].push(file)
  })

  return Object.entries(dateGroups).map(([date, files]) => ({
    key: date,
    label: date,
    files
  }))
}

// Оборачиваем в memo для предотвращения ненужных рендеров
export const MediaFileList = memo(function MediaFileList({
  viewMode: initialViewMode = "thumbnails",
}: { viewMode?: "list" | "grid" | "thumbnails" | "metadata" }) {
  const { media, isLoading, addNewTracks, addedFiles } = useRootStore()
  const [searchQuery, setSearchQuery] = useState("")
  const dataFetchedRef = useRef(false) // Для отслеживания, выполнялся ли уже запрос
  const [viewMode, setViewMode] = useState<"list" | "grid" | "thumbnails" | "metadata">(initialViewMode)
  const [sortBy, setSortBy] = useState<string>("creationDate")
  const [filterType, setFilterType] = useState<string>("all")
  const [groupBy, setGroupBy] = useState<string>("none")

  console.log("[MediaFileList] Rendering with:", {
    mediaCount: media.length,
    isLoading,
    hasAddedFiles: addedFiles.size > 0,
    viewMode,
  })

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

  const sequentialFiles = useMemo(() => getSequentialFiles(media), [media])
  const sortedDates = useMemo(() => groupFilesByDate(media), [media])
  const [fileGroups, setFileGroups] = useState<Record<string, FileGroup>>({})

  // Фильтрация медиафайлов
  // Для начала отредактируем функцию filteredMedia для полноценной поддержки поиска
const filteredMedia = useMemo(() => {
  return media.filter((file) => {
    // Сначала применяем фильтр по поисковому запросу
    if (searchQuery && !file.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Затем применяем фильтр по типу
    if (filterType === "all") return true;

    const fileType = getFileType(file);

    if (filterType === "video" && fileType === "video") return true;
    if (filterType === "audio" && fileType === "audio") return true;
    if (filterType === "image" && fileType === "image") return true;
    if (filterType === "favorites" && file.isFavorite) return true;

    return false;
  });
}, [media, filterType, searchQuery]);

  // Сортировка медиафайлов
  const sortedMedia = useMemo(() => {
    const sorted = [...filteredMedia].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "duration":
          const durationA = a.probeData?.format?.duration || 0
          const durationB = b.probeData?.format?.duration || 0
          return durationB - durationA
        case "type":
          const typeA = getFileType(a)
          const typeB = getFileType(b)
          return typeA.localeCompare(typeB)
        case "importDate":
          const importTimeA = a.importDate || 0
          const importTimeB = b.importDate || 0
          return importTimeB - importTimeA
        case "creationDate":
        default:
          const timeA = a.startTime || 0
          const timeB = b.startTime || 0
          return timeB - timeA
      }
    })
    
    console.log("[MediaFileList] Rendering media list with:", {
      mediaCount: media.length,
      sortedMediaCount: sorted.length,
    })
    
    return sorted
  }, [filteredMedia, sortBy])

  // Группировка медиафайлов
  const groupedMedia = useMemo(() => {
    switch (groupBy) {
      case "type":
        return groupFilesByType(sortedMedia)
      case "creationDate":
        return sortedDates.map(date => ({
          key: date.date,
          label: date.date,
          files: date.files.filter(file => sortedMedia.includes(file))
        }))
      case "duration":
        return groupFilesByDuration(sortedMedia)
      case "importDate":
        return groupFilesByImportDate(sortedMedia)
      case "none":
      default:
        return [{ key: "all", label: "", files: sortedMedia }]
    }
  }, [sortedMedia, groupBy, sortedDates])

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
    handleAddByIds(fileGroups.videos?.fileIds || [])
  }, [fileGroups])

  const handleAddAllAudioFiles = useCallback(() => {
    handleAddByIds(fileGroups.audio?.fileIds || [])
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

  const handleImport = useCallback(() => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "video/*, audio/*"
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || [])
      addNewTracks(files as unknown as MediaFile[])
    }
    input.click()
  }, [addNewTracks])

  const handleSort = useCallback((sortBy: string) => {
    setSortBy(sortBy)
  }, [])

  const handleFilter = useCallback((filterType: string) => {
    setFilterType(filterType)
  }, [])

  const handleGroup = useCallback((groupType: string) => {
    setGroupBy(groupType)
  }, [])

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

  const renderGroupHeader = (label: string, filesCount: number) => {
    if (!label) return null
    
    return (
      <div className="sticky top-0 z-10 bg-gray-100 dark:bg-gray-800 px-3 py-1 font-medium text-sm flex justify-between items-center">
        <span>{label}</span>
        <span className="text-xs text-gray-500">({filesCount})</span>
      </div>
    )
  }

  console.log("[MediaFileList] Rendering media list with:", {
    mediaCount: media.length,
    sortedMediaCount: sortedMedia.length,
  })

  return (
    <div className="flex flex-col h-full">
      <MediaToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onImport={handleImport}
        onSort={handleSort}
        onFilter={handleFilter}
        onGroup={handleGroup}
        currentSort={sortBy}
        currentGroup={groupBy}
        currentFilter={filterType}
      />
      <div className="space-y-1 p-3 pr-1 pl-1 pb-[24px]">
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
          <>
            {groupedMedia.map((group) => (
              <div key={group.key} className="mb-4">
                {renderGroupHeader(group.label, group.files.length)}
                <table className="w-full border-collapse">
                  {(
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
                  )}
                  <tbody>
                    {group.files.map((file) => {
                      const fileId = getFileId(file)
                      const isAdded = file.path && addedFiles.has(file.path)
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
              </div>
            ))}
          </>
        ) : (
          <>
            {groupedMedia.map((group) => (
              <div key={group.key} className="mb-4">
                {renderGroupHeader(group.label, group.files.length)}
                <div className="space-y-3">
                  {group.files.map((file) => {
                    const fileId = getFileId(file)
                    const duration = file.probeData?.format.duration || 1
                    const isAudio = getFileType(file) === "audio"
                    const isAdded = file.path && addedFiles.has(file.path)

                    return (
                      <div
                        key={fileId}
                        className={`flex items-center gap-3 p-0 pb-0 pr-2 pl-3 rounded-md group w-full overflow-hidden
                          ${isAdded ? "opacity-50 pointer-events-none" : ""}`}
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
              </div>
            ))}
          </>
        )}
      </div>
      <div className="flex-shrink-0 h-[24px] w-full absolute bottom-0 left-0 right-0 z-10">
        <StatusBar
          media={filteredMedia}
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