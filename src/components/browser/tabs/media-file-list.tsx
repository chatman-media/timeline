import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"

import { useRootStore } from "@/hooks/use-root-store"
import { useVideoPlayer } from "@/hooks/use-video-player"
import { formatDuration, formatFileSize, cn } from "@/lib/utils"
import { rootStore } from "@/stores/root-store"
import { MediaFile } from "@/types/videos"
import { getFileType, groupFilesByDate } from "@/utils/media-utils"

import { Skeleton } from "../../ui/skeleton"
import { FileInfo, MediaPreview, StatusBar } from ".."
import { MediaToolbar } from "@/components/browser/layout/media-toolbar"

// Оборачиваем в memo для предотвращения ненужных рендеров
export const MediaFileList = memo(function MediaFileList({
  viewMode: initialViewMode = "list",
}: { viewMode?: "list" | "grid" | "thumbnails" | "metadata" }) {
  const { media, isLoading, addNewTracks, addedFiles } = useRootStore()
  const [searchQuery, setSearchQuery] = useState("")
  const dataFetchedRef = useRef(false) // Для отслеживания, выполнялся ли уже запрос

  // Состояние для режима отображения
  const [viewMode, setViewMode] = useState<"list" | "grid" | "thumbnails" | "metadata">(
    initialViewMode,
  )

  // Состояние для сортировки и фильтрации
  const [sortBy, setSortBy] = useState<string>("date")
  const [filterType, setFilterType] = useState<string>("all")

  console.log("[MediaFileList] Rendering with:", {
    mediaCount: media.length,
    isLoading,
    hasAddedFiles: addedFiles.size > 0,
    viewMode,
  })

  // Обработчики для MediaToolbar
  const handleViewModeChange = useCallback((mode: "list" | "grid" | "thumbnails" | "metadata") => {
    setViewMode(mode)
  }, [])

  const handleImport = useCallback(() => {
    // Создаем меню импорта с несколькими опциями
    console.log("[MediaFileList] Import menu requested")
    
    // Можно показать модальное окно с опциями импорта, которое предложит различные варианты
    // Для примера просто вызовем импорт файлов
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.accept = 'video/*,audio/*,image/*'
    
    input.onchange = () => {
      console.log("Файлы выбраны из общего меню импорта, закрываем диалог")
      // Тут просто закрываем диалог, не обрабатываем файлы
    }
    
    input.click()
  }, [])

  const handleSort = useCallback((newSortBy: string) => {
    setSortBy(newSortBy)
  }, [])

  const handleFilter = useCallback((newFilterType: string) => {
    setFilterType(newFilterType)
  }, [])

  const handleImportFile = () => {
    console.log("Импорт файла")
    // Показываем диалог выбора файлов
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.accept = 'video/*,audio/*,image/*'
    
    input.onchange = () => {
      console.log("Файлы выбраны, закрываем диалог")
      // Тут просто закрываем диалог, не обрабатываем файлы
    }
    
    input.click()
  }

  const handleImportFolder = () => {
    console.log("Импорт папки")
    // Показываем диалог выбора папки
    const input = document.createElement('input')
    input.type = 'file'
    // Используем setAttribute для webkitdirectory, так как это нестандартный атрибут
    input.setAttribute('webkitdirectory', '')
    input.setAttribute('directory', '')
    
    input.onchange = () => {
      console.log("Папка выбрана, закрываем диалог")
      // Тут просто закрываем диалог, не обрабатываем файлы
    }
    
    input.click()
  }

  // Обработчики для кнопок записи
  const handleRecord = () => {
    console.log("Открыть меню записи")
    // В будущем здесь можно добавить логику открытия модального окна с опциями записи
  }

  const handleRecordCamera = () => {
    console.log("Запись с веб-камеры")
    // В будущем здесь будет логика для записи с веб-камеры
  }

  const handleRecordScreen = () => {
    console.log("Запись экрана")
    // В будущем здесь будет логика для записи экрана
  }

  const handleRecordVoice = () => {
    console.log("Запись голоса")
    // В будущем здесь будет логика для записи голоса
  }

  // Используем useMemo для сортировки медиафайлов, чтобы не пересортировывать при каждом рендере
  // Фильтрация и сортировка
  const filteredAndSortedMedia = useMemo(() => {
    // Сначала фильтрация
    const filtered =
      filterType === "all"
        ? media
        : media.filter((file) => {
            if (filterType === "video" && file.probeData?.streams?.[0]?.codec_type === "video")
              return true
            if (filterType === "audio" && file.probeData?.streams?.[0]?.codec_type === "audio")
              return true
            if (filterType === "image" && file.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i))
              return true
            return false
          })

    // Затем сортировка
    return [...filtered].sort((a, b) => {
      if (sortBy === "name") return (a.name || "").localeCompare(b.name || "")
      if (sortBy === "size") return (b.size || 0) - (a.size || 0)
      if (sortBy === "duration") return (b.duration || 0) - (a.duration || 0)
      // По умолчанию сортируем по дате
      const timeA = a.startTime || 0
      const timeB = b.startTime || 0
      return timeB - timeA
    })
  }, [media, filterType, sortBy])

  // Мемоизируем другие вычисления
  const sortedDates = useMemo(() => groupFilesByDate(media), [media])

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
    const videoFiles = media.filter((file) =>
      file.probeData?.streams?.some((stream) => stream.codec_type === "video"),
    )
    addNewTracks(videoFiles)

    const filePaths = videoFiles.filter((file) => file.path).map((file) => file.path as string)
    if (filePaths.length > 0) {
      rootStore.send({
        type: "addToAddedFiles",
        filePaths,
      })
    }
  }, [media, addNewTracks])

  const handleAddAllAudioFiles = useCallback(() => {
    const audioFiles = media.filter(
      (file) =>
        !file.probeData?.streams?.some((stream) => stream.codec_type === "video") &&
        file.probeData?.streams?.some((stream) => stream.codec_type === "audio"),
    )
    addNewTracks(audioFiles)

    const filePaths = audioFiles.filter((file) => file.path).map((file) => file.path as string)
    if (filePaths.length > 0) {
      rootStore.send({
        type: "addToAddedFiles",
        filePaths,
      })
    }
  }, [media, addNewTracks])

  if (isLoading) {
    return (
      <div className="flex flex-col h-[calc(50vh-82px)]">
        <div className="p-4 space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
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

  // Функция для отображения различных стилей просмотра
  const renderContent = () => {
    // Если нет данных или идет загрузка
    if (filteredAndSortedMedia.length === 0) {
      return (
        <div className="p-4 text-center text-gray-400 dark:text-gray-500">
          Нет медиа-файлов для отображения
        </div>
      )
    }

    // Выбираем стиль отображения в зависимости от viewMode
    switch (viewMode) {
      case "list":
        return (
          <div className="space-y-1 px-0 py-0 pt-0">
            {filteredAndSortedMedia.map((file) => {
              const fileId = getFileId(file)
              const duration = file.probeData?.format.duration || 1
              const isAudio = getFileType(file) === "audio"
              const isAdded = Boolean(file.path && addedFiles.has(file.path))

              return (
                <div
                  key={fileId}
                  className={cn(
                    "flex items-center p-2",
                    "bg-white dark:bg-[#25242b] hover:bg-gray-100 dark:hover:bg-[#2f2d38]",
                    isAdded && "opacity-50 pointer-events-none",
                  )}
                >
                  <div className="relative flex-shrink-0 flex gap-1 mr-3">
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
                  <div className="flex-1 min-w-0">
                    <FileInfo file={file} onAddMedia={handleAddMedia} isAdded={isAdded} />
                  </div>
                </div>
              )
            })}
          </div>
        )

      case "grid":
        return (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredAndSortedMedia.map((file) => {
              const fileId = getFileId(file)
              const duration = file.probeData?.format.duration || 1
              const isAudio = getFileType(file) === "audio"
              const isAdded = Boolean(file.path && addedFiles.has(file.path))

              return (
                <div
                  key={fileId}
                  className={cn(
                    "flex flex-col border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden",
                    "bg-white dark:bg-[#25242b] hover:bg-gray-100 dark:hover:bg-[#2f2d38]",
                    isAdded && "opacity-50 pointer-events-none",
                  )}
                >
                  <div className="relative h-32 flex items-center justify-center">
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
                  <div className="p-2">
                    <div className="text-sm font-medium truncate">{file.name}</div>
                    <div className="flex justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span>{formatFileSize(file.size || 0)}</span>
                      <span>{formatDuration(file.duration || 0)}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )

      case "metadata":
        return (
          <div className="space-y-3">
            {filteredAndSortedMedia.map((file) => {
              const fileId = getFileId(file)
              const isAdded = Boolean(file.path && addedFiles.has(file.path))

              return (
                <div
                  key={fileId}
                  className={cn(
                    "border border-gray-200 dark:border-gray-700 rounded-md p-3",
                    "bg-white dark:bg-[#25242b] hover:bg-gray-100 dark:hover:bg-[#2f2d38]",
                    isAdded && "opacity-50 pointer-events-none",
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-sm font-medium">{file.name}</div>
                    <button
                      className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      onClick={(e) => handleAddMedia(e, file)}
                      disabled={isAdded}
                    >
                      {isAdded ? "Добавлено" : "Добавить"}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-gray-500 dark:text-gray-400">Тип:</div>
                    <div>{file.probeData?.streams?.[0]?.codec_type || "Неизвестно"}</div>

                    <div className="text-gray-500 dark:text-gray-400">Кодек:</div>
                    <div>{file.probeData?.streams?.[0]?.codec_name || "Неизвестно"}</div>

                    {file.probeData?.streams?.[0]?.width &&
                      file.probeData?.streams?.[0]?.height && (
                        <>
                          <div className="text-gray-500 dark:text-gray-400">Разрешение:</div>
                          <div>
                            {file.probeData.streams[0].width}×{file.probeData.streams[0].height}
                          </div>
                        </>
                      )}

                    <div className="text-gray-500 dark:text-gray-400">Размер:</div>
                    <div>{formatFileSize(file.size || 0)}</div>

                    <div className="text-gray-500 dark:text-gray-400">Длительность:</div>
                    <div>{formatDuration(file.duration || 0)}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )

      case "thumbnails":
      default:
        return (
          <div className="space-y-3">
            {filteredAndSortedMedia.map((file) => {
              const fileId = getFileId(file)
              const duration = file.probeData?.format.duration || 1
              const isAudio = getFileType(file) === "audio"
              const isAdded = Boolean(file.path && addedFiles.has(file.path))

              return (
                <div
                  key={fileId}
                  className={`flex items-center gap-3 p-0 pb-0 pr-1 pl-1 group w-full overflow-hidden
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
        )
    }
  }

  console.log("[MediaFileList] Rendering media list with:", {
    mediaCount: media.length,
    filteredCount: filteredAndSortedMedia.length,
  })

  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden">
      <MediaToolbar
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        onImport={handleImport}
        onImportFile={handleImportFile}
        onImportFolder={handleImportFolder}
        onSort={handleSort}
        onFilter={handleFilter}
        onRecord={handleRecord}
        onRecordCamera={handleRecordCamera}
        onRecordScreen={handleRecordScreen}
        onRecordVoice={handleRecordVoice}
      />
      <div className="flex-1 space-y-1 p-0 overflow-y-auto min-h-0">
        {renderContent()}
      </div>
      {/* Статус-бар как обычный flex-элемент */}
      <div className="flex-shrink-0 bg-background border-t transition-all duration-200 ease-in-out">
        <StatusBar
          media={filteredAndSortedMedia}
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
