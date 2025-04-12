import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"

import { MediaToolbar } from "@/components/browser/layout/media-toolbar"
import { CameraCaptureModal } from "@/components/modals/camera-capture-modal"
import { useRootStore } from "@/hooks/use-root-store"
import { useVideoPlayer } from "@/hooks/use-video-player"
import { cn, formatDuration, formatFileSize } from "@/lib/utils"
import { rootStore } from "@/stores/root-store"
import { MediaFile } from "@/types/videos"
import { calculateRealDimensions, getFileType, groupFilesByDate } from "@/utils/media-utils"

import { Skeleton } from "../../ui/skeleton"
import { FileInfo, MediaPreview, StatusBar } from ".."

// Создаем глобальные переменные для кэширования видео и их состояния загрузки
// Это позволит сохранять состояние между переключениями вкладок и режимов отображения
const globalVideoCache = new Map<string, HTMLVideoElement | null>()
const globalLoadedVideosCache = new Map<string, boolean>()

// Оборачиваем в memo для предотвращения ненужных рендеров
export const MediaFileList = memo(function MediaFileList({
  viewMode: initialViewMode = "list",
}: { viewMode?: "list" | "grid" | "thumbnails" | "metadata" }) {
  const { media, isLoading, addNewTracks, addedFiles, hasFetched } = useRootStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false)

  // Используем локальный ref для избежания повторных запросов в текущей сессии браузера
  const localDataFetchedRef = useRef(false)

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
    hasFetched,
    localFetched: localDataFetchedRef.current,
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
    const input = document.createElement("input")
    input.type = "file"
    input.multiple = true
    input.accept = "video/*,audio/*,image/*"

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
    const input = document.createElement("input")
    input.type = "file"
    input.multiple = true
    input.accept = "video/*,audio/*,image/*"

    input.onchange = () => {
      console.log("Файлы выбраны, закрываем диалог")
      // Тут просто закрываем диалог, не обрабатываем файлы
    }

    input.click()
  }

  const handleImportFolder = () => {
    console.log("Импорт папки")
    // Показываем диалог выбора папки
    const input = document.createElement("input")
    input.type = "file"
    // Используем setAttribute для webkitdirectory, так как это нестандартный атрибут
    input.setAttribute("webkitdirectory", "")
    input.setAttribute("directory", "")

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
    console.log("Открытие модального окна записи с веб-камеры")
    setIsRecordingModalOpen(true)
  }

  const handleRecordScreen = () => {
    console.log("Запись экрана")
    // В будущем здесь будет логика для записи экрана
  }

  const handleRecordVoice = () => {
    console.log("Запись голоса")
    // В будущем здесь будет логика для записи голоса
  }

  const handleRecordedVideo = useCallback(
    (blob: Blob, fileName: string) => {
      console.log(`Получена запись видео: ${fileName}, размер: ${blob.size} байт`)

      // Создаем медиафайл из записанного блоба
      const file = new File([blob], fileName, { type: "video/webm" })

      // Создаем объект URL для просмотра видео
      const fileUrl = URL.createObjectURL(file)

      // Получаем длительность видео
      const videoElement = document.createElement("video")
      videoElement.src = fileUrl

      videoElement.onloadedmetadata = () => {
        const duration = videoElement.duration

        // Создаем новый MediaFile объект
        const newMediaFile: MediaFile = {
          id: `recorded-${Date.now()}`,
          name: fileName,
          path: fileUrl,
          size: blob.size,
          startTime: 0,
          duration: duration,
          probeData: {
            format: {
              duration: duration,
              filename: fileName,
              format_name: "webm",
              size: blob.size,
            },
            streams: [
              {
                codec_type: "video",
                codec_name: "vp9",
                width: videoElement.videoWidth,
                height: videoElement.videoHeight,
                r_frame_rate: "30/1",
                index: 0,
              },
            ],
            chapters: [],
          },
        }

        // Добавляем видео в медиатеку с правильным типом события
        rootStore.send({
          type: "setMedia",
          media: [...media, newMediaFile],
        })

        // Очищаем URL
        URL.revokeObjectURL(fileUrl)
      }
    },
    [media],
  )

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
    // Проверяем локальный флаг и глобальный флаг
    if (!localDataFetchedRef.current && !hasFetched && media.length === 0) {
      console.log("[MediaFileList] First render, fetching media...")
      localDataFetchedRef.current = true

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
              // Отправляем событие setMedia
              rootStore.send({
                type: "setMedia",
                media: data.media,
              })

              // Отдельно устанавливаем hasFetched
              rootStore.send({
                type: "setLoadingState",
                isLoading: false,
              })
            }
          }
        } catch (error) {
          console.error("[MediaFileList] Ошибка запроса:", error)
        }
      }

      directFetch()
    }
  }, [media.length, hasFetched])

  // Используем реф для хранения ссылок на элементы видео
  const videoRefsObj = useRef<Record<string, HTMLVideoElement | null>>({})

  // Создаем проксированный объект, который будет проксировать обращения к глобальному кэшу
  const videoRefs = useMemo(() => {
    return {
      current: new Proxy({} as Record<string, HTMLVideoElement | null>, {
        get: (_, key: string) => {
          return globalVideoCache.get(key) || null
        },
        set: (_, key: string, value: HTMLVideoElement | null) => {
          if (value) {
            globalVideoCache.set(key, value)
          }
          return true
        },
      }),
    }
  }, [])

  // Создаем проксированный объект для loadedVideos
  const [loadedVideosObj, setLoadedVideosObj] = useState<Record<string, boolean>>({})

  // Проксируем доступ к loadedVideos через глобальный кэш
  const loadedVideos = useMemo(() => {
    return new Proxy({} as Record<string, boolean>, {
      get: (_, key: string) => {
        return globalLoadedVideosCache.get(key as string) || false
      },
      set: (_, key: string, value: boolean) => {
        globalLoadedVideosCache.set(key as string, value)
        return true
      },
      ownKeys: () => {
        return Array.from(globalLoadedVideosCache.keys())
      },
      getOwnPropertyDescriptor: (_, key) => {
        return {
          enumerable: true,
          configurable: true,
          value: globalLoadedVideosCache.get(key as string) || false,
        }
      },
    })
  }, [])

  // Создаем функцию для обновления loadedVideos
  const setLoadedVideos = useCallback((updater: React.SetStateAction<Record<string, boolean>>) => {
    if (typeof updater === "function") {
      // Если передана функция, создаем текущий снимок состояния
      const currentState: Record<string, boolean> = {}
      globalLoadedVideosCache.forEach((value, key) => {
        currentState[key] = value
      })

      // Вызываем функцию с текущим состоянием
      const newState = updater(currentState)

      // Обновляем кэш
      Object.entries(newState).forEach(([key, value]) => {
        globalLoadedVideosCache.set(key, value)
      })

      // Обновляем React-состояние для вызова ререндера
      setLoadedVideosObj((prev) => ({ ...prev }))
    } else {
      // Если передан объект напрямую
      Object.entries(updater).forEach(([key, value]) => {
        globalLoadedVideosCache.set(key, value)
      })

      // Обновляем React-состояние для вызова ререндера
      setLoadedVideosObj((prev) => ({ ...prev }))
    }
  }, [])

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
                    "flex items-center p-[2px] h-full",
                    "bg-white dark:bg-[#25242b] hover:bg-gray-100 dark:hover:bg-[#2f2d38]",
                    isAdded && "opacity-50 pointer-events-none",
                  )}
                >
                  <div className="relative h-full flex-shrink-0 flex gap-1 mr-3">
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
                      size={100}
                    />
                  </div>
                  <FileInfo file={file} size={100} />
                </div>
              )
            })}
          </div>
        )

      case "grid":
        return (
          <div className="flex flex-wrap gap-3 justify-between">
            {filteredAndSortedMedia.map((file) => {
              const fileId = getFileId(file)
              const duration = file.probeData?.format.duration || 1
              const isAudio = getFileType(file) === "audio"
              const isAdded = Boolean(file.path && addedFiles.has(file.path))

              return (
                <div
                  key={fileId}
                  className={cn(
                    "flex flex-col h-full rounded-sm overflow-hidden",
                    "",
                    isAdded && "opacity-50 pointer-events-none",
                  )}
                  style={{
                    width: (() => {
                      if (isAudio) return "60px"
                      const stream = file.probeData?.streams?.[0]
                      if (!stream?.width || !stream?.height) return "107px"

                      const videoStream = {
                        codec_type: "video",
                        width: stream.width,
                        height: stream.height,
                        rotation: stream.rotation?.toString(),
                      }
                      const dimensions = calculateRealDimensions(videoStream)
                      return `${60 * (dimensions.width / dimensions.height)}px`
                    })(),
                  }}
                >
                  <div className="relative flex-1 flex-col flex-grow">
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
                  <div className="text-xs w-full px-1 pt-1 flex-shrink-0">
                    <div className="marquee-container">
                      {file.name.length > 20 ? (
                        <div className="marquee-content">{file.name}</div>
                      ) : (
                        <div className="marquee-text">{file.name}</div>
                      )}
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
          <div className="flex flex-wrap gap-3 justify-between">
            {filteredAndSortedMedia.map((file) => {
              const fileId = getFileId(file)
              const duration = file.probeData?.format.duration || 1
              const isAudio = getFileType(file) === "audio"
              const isAdded = Boolean(file.path && addedFiles.has(file.path))

              return (
                <div
                  key={fileId}
                  className={cn(
                    "flex items-center p-[2px] h-full",
                    "bg-white dark:bg-[#25242b] hover:bg-gray-100 dark:hover:bg-[#2f2d38]",
                    isAdded && "opacity-50 pointer-events-none",
                  )}
                >
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
                    size={100}
                    showFileName={true}
                  />
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
      <div className="flex-1 p-0 min-h-0 overflow-y-auto scrollbar-hide hover:scrollbar-default">
        {renderContent()}
      </div>
      <div className="flex-shrink-0 transition-all duration-200 ease-in-out">
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
      {isRecordingModalOpen && (
        <CameraCaptureModal
          isOpen={isRecordingModalOpen}
          onClose={() => setIsRecordingModalOpen(false)}
          onVideoRecorded={handleRecordedVideo}
        />
      )}
    </div>
  )
})
