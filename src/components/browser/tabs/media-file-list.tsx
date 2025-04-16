import { CopyPlus } from "lucide-react"
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { JSX } from "react"

import { MediaToolbar } from "@/components/browser/layout/media-toolbar"
import { CameraCaptureDialog } from "@/components/dialogs/camera-capture-dialog"
import { Button } from "@/components/ui/button"
import { useVideoPlayer } from "@/hooks/use-video-player"
import { cn } from "@/lib/utils"
import { useMediaContext } from "@/providers/media-provider"
import { FfprobeStream } from "@/types/ffprobe"
import { MediaFile } from "@/types/media"
import { getFileType, groupFilesByDate } from "@/utils/media-utils"

import { Skeleton } from "../../ui/skeleton"
import { FileMetadata, MediaPreview, StatusBar } from ".."
import { useTimelineContext } from "@/providers"

// Создаем глобальные переменные для кэширования видео и их состояния загрузки
// Это позволит сохранять состояние между переключениями вкладок и режимов отображения
const globalVideoCache = new Map<string, HTMLVideoElement | null>()
const globalLoadedVideosCache = new Map<string, boolean>()

// Размеры превью, доступные для выбора
const PREVIEW_SIZES = [60, 80, 100, 125, 150, 200, 250, 300, 400]
const DEFAULT_SIZE = 100
const MIN_SIZE = 60
const MIN_SIZE_THUMBNAILS = 100

// Определяем размеры по умолчанию для разных режимов
const DEFAULT_SIZE_GRID = 60
const DEFAULT_SIZE_THUMBNAILS = 125
const DEFAULT_SIZE_LIST = 80

// Ключи для localStorage
const STORAGE_KEY_PREFIX = "timeline-preview-size-"
const STORAGE_KEY_GRID = `${STORAGE_KEY_PREFIX}grid`
const STORAGE_KEY_THUMBNAILS = `${STORAGE_KEY_PREFIX}thumbnails`
const STORAGE_KEY_LIST = `${STORAGE_KEY_PREFIX}list`

// Ключи для настроек
const STORAGE_KEY_VIEW_MODE = "timeline-view-mode"
const STORAGE_KEY_GROUP_BY = "timeline-group-by"
const STORAGE_KEY_SORT_BY = "timeline-sort-by"
const STORAGE_KEY_SORT_ORDER = "timeline-sort-order"
const STORAGE_KEY_FILTER_TYPE = "timeline-filter-type"

// Функция для загрузки сохраненного размера из localStorage
const getSavedSize = (mode: string, defaultSize: number): number => {
  if (typeof window === "undefined") return defaultSize // Проверка на SSR

  // Выбираем правильный ключ на основе режима
  let storageKey
  if (mode === "grid") storageKey = STORAGE_KEY_GRID
  else if (mode === "thumbnails") storageKey = STORAGE_KEY_THUMBNAILS
  else if (mode === "list") storageKey = STORAGE_KEY_LIST
  else storageKey = `${STORAGE_KEY_PREFIX}${mode}` // Запасной вариант

  try {
    const savedValue = localStorage.getItem(storageKey)

    if (savedValue) {
      const parsedValue = parseInt(savedValue, 10)
      // Проверяем, что значение входит в допустимый диапазон
      if (PREVIEW_SIZES.includes(parsedValue)) {
        // console.log(
        //   `[MediaFileList] Loading saved size ${parsedValue} for mode ${mode} from key ${storageKey}`,
        // )
        return parsedValue
      }
    }
  } catch (error) {
    console.error("[MediaFileList] Error reading from localStorage:", error)
  }

  console.log(`[MediaFileList] No saved size for mode ${mode}, using default ${defaultSize}`)
  return defaultSize
}

// Функция для загрузки сохраненных настроек
const loadSavedSettings = () => {
  if (typeof window === "undefined") return null

  try {
    const viewMode = localStorage.getItem(STORAGE_KEY_VIEW_MODE) || "grid"
    const groupBy = localStorage.getItem(STORAGE_KEY_GROUP_BY) || "date"
    const sortBy = localStorage.getItem(STORAGE_KEY_SORT_BY) || "date"
    const sortOrder = localStorage.getItem(STORAGE_KEY_SORT_ORDER) || "asc"
    const filterType = localStorage.getItem(STORAGE_KEY_FILTER_TYPE) || "all"

    return {
      viewMode,
      groupBy,
      sortBy,
      sortOrder,
      filterType,
    }
  } catch (error) {
    console.error("[MediaFileList] Error loading settings:", error)
    return null
  }
}

// Функция для сохранения настроек
const saveSettings = (settings: {
  viewMode: string
  groupBy: string
  sortBy: string
  sortOrder: string
  filterType: string
}) => {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(STORAGE_KEY_VIEW_MODE, settings.viewMode)
    localStorage.setItem(STORAGE_KEY_GROUP_BY, settings.groupBy)
    localStorage.setItem(STORAGE_KEY_SORT_BY, settings.sortBy)
    localStorage.setItem(STORAGE_KEY_SORT_ORDER, settings.sortOrder)
    localStorage.setItem(STORAGE_KEY_FILTER_TYPE, settings.filterType)
  } catch (error) {
    console.error("[MediaFileList] Error saving settings:", error)
  }
}

interface GroupedMediaFiles {
  title: string
  files: MediaFile[]
}

// Обновляем тип для viewMode
type ViewMode = "list" | "grid" | "thumbnails"

// Оборачиваем в memo для предотвращения ненужных рендеров
export const MediaFileList = memo(function MediaFileList({
  viewMode: initialViewMode = "list",
}: {
  viewMode?: ViewMode
}): JSX.Element {
  const { isLoading, includeFiles, includedFiles, allMediaFiles: media } = useMediaContext()
  const { addMediaFiles } = useTimelineContext()
  const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false)

  // Используем локальный ref для избежания повторных запросов в текущей сессии браузера
  const localDataFetchedRef = useRef(false)

  // Ref для отслеживания первого рендера при смене режима
  const initialRenderRef = useRef(true)

  // Загружаем сохраненные настройки
  const savedSettings = loadSavedSettings()

  // Инициализируем состояние с сохраненными настройками
  const [viewMode, setViewMode] = useState<"list" | "grid" | "thumbnails">(
    (savedSettings?.viewMode as any) || initialViewMode,
  )
  const [sortBy, setSortBy] = useState<string>(savedSettings?.sortBy || "date")
  const [filterType, setFilterType] = useState<string>(savedSettings?.filterType || "all")
  const [groupBy, setGroupBy] = useState<string>(savedSettings?.groupBy || "none")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(
    (savedSettings?.sortOrder as "asc" | "desc") || "desc",
  )

  // Сохраняем настройки при их изменении
  useEffect(() => {
    saveSettings({
      viewMode,
      groupBy,
      sortBy,
      sortOrder,
      filterType,
    })
  }, [viewMode, groupBy, sortBy, sortOrder, filterType])

  // Определяем начальный размер для текущего режима
  let initialSize = DEFAULT_SIZE
  if (initialViewMode === "grid") initialSize = DEFAULT_SIZE_GRID
  else if (initialViewMode === "thumbnails") initialSize = DEFAULT_SIZE_THUMBNAILS
  else if (initialViewMode === "list") initialSize = DEFAULT_SIZE_LIST

  // Пытаемся загрузить сохраненный размер
  const savedInitialSize = getSavedSize(initialViewMode, initialSize)
  const actualInitialSize = savedInitialSize < MIN_SIZE ? MIN_SIZE : savedInitialSize

  // Состояние для размера превью с учетом режима просмотра
  const [previewSize, setPreviewSize] = useState<number>(actualInitialSize)

  // Обертка для setPreviewSize, которая также сохраняет размер в localStorage
  const updatePreviewSize = useCallback(
    (sizeOrUpdater: number | ((prevSize: number) => number)) => {
      if (typeof sizeOrUpdater === "function") {
        setPreviewSize((prevSize) => {
          const newSize = sizeOrUpdater(prevSize)
          saveSize(viewMode, newSize)
          return newSize
        })
      } else {
        setPreviewSize(sizeOrUpdater)
        saveSize(viewMode, sizeOrUpdater)
      }
    },
    [viewMode],
  )

  // Эффект для установки правильных размеров при первом рендере
  useEffect(() => {
    // Очистим localStorage для тестирования
    // clearAllSavedSizes(); // Раскомментировать для сброса всех сохраненных размеров

    console.log("[MediaFileList] Initial mount, viewMode:", viewMode)

    // Определяем размер по умолчанию для текущего режима
    let defaultSize = DEFAULT_SIZE
    if (viewMode === "grid") defaultSize = DEFAULT_SIZE_GRID
    else if (viewMode === "thumbnails") defaultSize = DEFAULT_SIZE_THUMBNAILS
    else if (viewMode === "list") defaultSize = DEFAULT_SIZE_LIST

    // Устанавливаем соответствующий размер для текущего режима просмотра из localStorage
    const savedSize = getSavedSize(viewMode, defaultSize)

    // Применяем минимальные ограничения
    if (savedSize < MIN_SIZE) {
      console.log(
        `[MediaFileList] Initial size ${savedSize} is below minimum ${MIN_SIZE}, adjusting`,
      )
      updatePreviewSize(MIN_SIZE)
    } else {
      console.log(`[MediaFileList] Setting initial size to ${savedSize} for mode ${viewMode}`)
      updatePreviewSize(savedSize)
    }
  }, []) // Выполняется только при монтировании

  // Эффект для отслеживания изменения режима просмотра
  useEffect(() => {
    // Пропускаем первый рендер (обрабатывается в эффекте выше)
    if (initialRenderRef.current) {
      initialRenderRef.current = false
      return
    }

    console.log(`[MediaFileList] View mode changed to ${viewMode}`)

    // Определяем размер по умолчанию для нового режима
    let defaultSize = DEFAULT_SIZE
    if (viewMode === "grid") defaultSize = DEFAULT_SIZE_GRID
    else if (viewMode === "thumbnails") defaultSize = DEFAULT_SIZE_THUMBNAILS
    else if (viewMode === "list") defaultSize = DEFAULT_SIZE_LIST

    // При изменении режима просмотра загружаем сохраненный размер
    const savedSize = getSavedSize(viewMode, defaultSize)

    // Применяем минимальные ограничения
    if (savedSize < MIN_SIZE) {
      console.log(`[MediaFileList] Saved size ${savedSize} is below minimum ${MIN_SIZE}, adjusting`)
      updatePreviewSize(MIN_SIZE)
    } else {
      // console.log(`[MediaFileList] Loading saved size ${savedSize} for mode ${viewMode}`)
      updatePreviewSize(savedSize)
    }
  }, [viewMode, updatePreviewSize])

  // console.log("[MediaFileList] Rendering with:", {
  //   mediaCount: media.length,
  //   isLoading,
  //   hasAddedFiles: includedFiles.length > 0,
  //   viewMode,
  //   hasFetched: media.length > 0,
  //   localFetched: localDataFetchedRef.current,
  //   previewSize,
  // })

  // Обработчики для MediaToolbar
  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode)
  }, [])

  // Функция для получения текущего минимального размера на основе режима
  const getMinSizeForCurrentMode = useCallback(() => {
    if (viewMode === "thumbnails") return MIN_SIZE_THUMBNAILS
    return MIN_SIZE
  }, [viewMode])

  // Обработчики для изменения размера превью
  const handleIncreaseSize = useCallback(() => {
    updatePreviewSize((currentSize: number) => {
      const currentIndex = PREVIEW_SIZES.indexOf(currentSize)
      if (currentIndex < PREVIEW_SIZES.length - 1) {
        return PREVIEW_SIZES[currentIndex + 1]
      }
      return currentSize
    })
  }, [updatePreviewSize])

  const handleDecreaseSize = useCallback(() => {
    updatePreviewSize((currentSize: number) => {
      const currentIndex = PREVIEW_SIZES.indexOf(currentSize)
      const minSize = getMinSizeForCurrentMode()

      if (currentIndex > 0 && PREVIEW_SIZES[currentIndex - 1] >= minSize) {
        return PREVIEW_SIZES[currentIndex - 1]
      }
      return currentSize
    })
  }, [getMinSizeForCurrentMode, updatePreviewSize])

  // Проверка возможности увеличения/уменьшения размера
  const canIncreaseSize = useMemo(() => {
    return PREVIEW_SIZES.indexOf(previewSize) < PREVIEW_SIZES.length - 1
  }, [previewSize])

  const canDecreaseSize = useMemo(() => {
    const minSize = getMinSizeForCurrentMode()
    const currentIndex = PREVIEW_SIZES.indexOf(previewSize)
    return currentIndex > 0 && PREVIEW_SIZES[currentIndex - 1] >= minSize
  }, [previewSize, getMinSizeForCurrentMode])

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

  const handleGroupBy = useCallback((newGroupBy: string) => {
    setGroupBy(newGroupBy)
  }, [])

  const handleChangeOrder = useCallback(() => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
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
          },
        }

        // Заменяем rootStore.send на handleSetMedia
        // handleAddFiles([newMediaFile])

        // Очищаем URL
        URL.revokeObjectURL(fileUrl)
      }
    },
    [media],
  )

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
    })
  }, [])

  const setLoadedVideos = useCallback((updater: React.SetStateAction<Record<string, boolean>>) => {
    if (typeof updater === "function") {
      const currentState: Record<string, boolean> = {}
      globalLoadedVideosCache.forEach((value, key) => {
        currentState[key] = value
      })
      const newState = updater(currentState)
      Object.entries(newState).forEach(([key, value]) => {
        globalLoadedVideosCache.set(key, value)
      })
      setLoadedVideosObj((prev) => ({ ...prev }))
    } else {
      Object.entries(updater).forEach(([key, value]) => {
        globalLoadedVideosCache.set(key, value)
      })
      setLoadedVideosObj((prev) => ({ ...prev }))
    }
  }, [])

  const [hoverTimes, setHoverTimes] = useState<Record<string, { [streamIndex: number]: number }>>(
    {},
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, fileId: string, duration: number, streamIndex = 0) => {
      const mediaElement =
        e.currentTarget.querySelector(`[data-stream="${streamIndex}"]`)?.parentElement ||
        e.currentTarget
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
    },
    [videoRefs],
  )

  const { setPlayingFileId, handlePlayPause, handleMouseLeave } = useVideoPlayer({
    videoRefs,
  })

  // Используем useMemo для сортировки медиафайлов, чтобы не пересортировывать при каждом рендере
  // Фильтрация и сортировка
  const filteredAndSortedMedia = useMemo(() => {
    // Сначала фильтрация
    const filtered =
      filterType === "all"
        ? media
        : media.filter((file: MediaFile) => {
            if (filterType === "video" && file.probeData?.streams?.[0]?.codec_type === "video")
              return true
            if (filterType === "audio" && file.probeData?.streams?.[0]?.codec_type === "audio")
              return true
            if (filterType === "image" && file.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i))
              return true
            return false
          })

    // Затем сортировка
    return [...filtered].sort((a: MediaFile, b: MediaFile) => {
      // Определяем множитель для направления сортировки
      const orderMultiplier = sortOrder === "asc" ? 1 : -1

      if (sortBy === "name") {
        return orderMultiplier * (a.name || "").localeCompare(b.name || "")
      }

      if (sortBy === "size") {
        // Получаем размер из метаданных или из поля size
        const getSizeValue = (file: MediaFile): number => {
          // Приоритетно используем размер из метаданных, если он доступен
          if (file.probeData?.format?.size !== undefined) {
            return file.probeData.format.size
          }

          // Иначе используем поле size (с конвертацией, если нужно)
          if (file.size !== undefined) {
            if (typeof file.size === "number") return file.size
            if (typeof file.size === "string") {
              // Если размер представлен строкой с единицами измерения (например, "1.5 GB")
              const sizeStr = file.size as string // явное приведение типа для линтера
              const match = sizeStr.match(/^([\d.]+)\s*([KMGT]?B)?$/i)
              if (match) {
                const value = parseFloat(match[1])
                const unit = (match[2] || "").toUpperCase()

                if (unit === "KB") return value * 1024
                if (unit === "MB") return value * 1024 * 1024
                if (unit === "GB") return value * 1024 * 1024 * 1024
                if (unit === "TB") return value * 1024 * 1024 * 1024 * 1024
                return value // Просто байты
              }
              return parseFloat(sizeStr) || 0
            }
          }

          return 0
        }

        return orderMultiplier * (getSizeValue(b) - getSizeValue(a))
      }

      if (sortBy === "duration") {
        // Преобразуем duration в секунды, если это строка формата "00:00:00" или другого формата
        const getDurationInSeconds = (duration: any): number => {
          if (!duration) return 0
          if (typeof duration === "number") return duration
          if (typeof duration === "string") {
            // Если формат "01:23:45"
            const parts = duration.split(":").map(Number)
            if (parts.length === 3) {
              return parts[0] * 3600 + parts[1] * 60 + parts[2]
            }
            // Если формат "01:23"
            else if (parts.length === 2) {
              return parts[0] * 60 + parts[1]
            }
            // Если только число
            return parseFloat(duration) || 0
          }
          return 0
        }

        return (
          orderMultiplier * (getDurationInSeconds(b.duration) - getDurationInSeconds(a.duration))
        )
      }

      // По умолчанию сортируем по дате
      const timeA = a.startTime || 0
      const timeB = b.startTime || 0
      return orderMultiplier * (timeB - timeA)
    })
  }, [media, filterType, sortBy, sortOrder])

  // Группируем файлы
  const groupedFiles = useMemo<GroupedMediaFiles[]>(() => {
    if (groupBy === "none") {
      return [{ title: "", files: filteredAndSortedMedia }]
    }

    if (groupBy === "type") {
      const groups: Record<string, MediaFile[]> = {
        video: [],
        audio: [],
        image: [],
      }

      filteredAndSortedMedia.forEach((file) => {
        const fileType = getFileType(file)
        if (fileType === "video") {
          groups.video.push(file)
        } else if (fileType === "audio") {
          groups.audio.push(file)
        } else if (fileType === "image") {
          groups.image.push(file)
        }
      })

      return Object.entries(groups)
        .filter(([, files]) => files.length > 0)
        .map(([type, files]) => ({
          title: type === "video" ? "Видео" : type === "audio" ? "Аудио" : "Изображения",
          files,
        }))
    }

    if (groupBy === "date") {
      const groups: Record<string, MediaFile[]> = {}

      filteredAndSortedMedia.forEach((file) => {
        // Для изображений используем дату создания файла, если она доступна
        let timestamp = file.startTime
        if (!timestamp && file.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          // Пробуем получить дату из метаданных
          timestamp = file.probeData?.format?.tags?.creation_time
            ? new Date(file.probeData.format.tags.creation_time).getTime() / 1000
            : 0
        }

        const date = timestamp
          ? new Date(timestamp * 1000).toLocaleDateString("ru-RU", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })
          : "Без даты"

        if (!groups[date]) {
          groups[date] = []
        }
        groups[date].push(file)
      })

      return Object.entries(groups)
        .sort(([a], [b]) => {
          if (a === "Без даты") return 1
          if (b === "Без даты") return -1
          return new Date(b).getTime() - new Date(a).getTime()
        })
        .map(([date, files]) => ({
          title: date,
          files,
        }))
    }

    if (groupBy === "duration") {
      const groups: Record<string, MediaFile[]> = {
        noDuration: [], // файлы без длительности (изображения)
        veryShort: [], // до 1 минуты
        short: [], // 1-5 минут
        medium: [], // 5-30 минут
        long: [], // 30-60 минут
        veryLong: [], // 1-3 часа
        extraLong: [], // 3+ часа
      }

      filteredAndSortedMedia.forEach((file) => {
        // Для изображений используем специальную логику
        if (file.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          groups.noDuration.push(file)
          return
        }

        const duration = file.probeData?.format?.duration || 0
        if (duration < 60) {
          // до 1 минуты
          groups.veryShort.push(file)
        } else if (duration < 300) {
          // 1-5 минут
          groups.short.push(file)
        } else if (duration < 1800) {
          // 5-30 минут
          groups.medium.push(file)
        } else if (duration < 3600) {
          // 30-60 минут
          groups.long.push(file)
        } else if (duration < 10800) {
          // 1-3 часа
          groups.veryLong.push(file)
        } else {
          // 3+ часа
          groups.extraLong.push(file)
        }
      })

      return Object.entries(groups)
        .filter(([, files]) => files.length > 0)
        .map(([type, files]) => ({
          title:
            type === "noDuration"
              ? "Файлы без длительности"
              : type === "veryShort"
                ? "Очень короткие (до 1 минуты)"
                : type === "short"
                  ? "Короткие (1-5 минут)"
                  : type === "medium"
                    ? "Средние (5-30 минут)"
                    : type === "long"
                      ? "Длинные (30-60 минут)"
                      : type === "veryLong"
                        ? "Очень длинные (1-3 часа)"
                        : "Сверхдлинные (более 3 часов)",
          files,
        }))
    }

    return [{ title: "", files: filteredAndSortedMedia }]
  }, [filteredAndSortedMedia, groupBy])

  // Мемоизируем другие вычисления
  const sortedDates = useMemo(() => groupFilesByDate(media), [media])

  // Удаляем импорт rootStore
  // Заменяем все остальные вызовы rootStore.send
  const handleAddAllFiles = useCallback(() => {
    const nonImageFiles = media.filter((file: MediaFile) => !file.isImage)
    const imageFiles = media.filter((file: MediaFile) => !file.isImage)

    if (nonImageFiles.length > 0) {
      includeFiles(nonImageFiles)
    }

    const files = media.filter((file: MediaFile) => file.path)
    if (files.length > 0) {
      includeFiles(files)
    }
  }, [media, includeFiles])

  const handleAddDateFiles = useCallback(
    (targetDate: string) => {
      const dateFiles = media.filter((file: MediaFile) => {
        if (!file.startTime) return false
        const fileDate = new Date(file.startTime * 1000).toLocaleDateString("ru-RU", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })
        return fileDate === targetDate
      })

      if (dateFiles.length > 0) {
        includeFiles(dateFiles)
      }

      const files = dateFiles.filter((file: MediaFile) => file.path)
      if (files.length > 0) {
        includeFiles(files)
      }
    },
    [media, includeFiles],
  )

  const handleAddAllVideoFiles = useCallback(() => {
    const videoFiles = media.filter((file: MediaFile) =>
      file.probeData?.streams?.some((stream: FfprobeStream) => stream.codec_type === "video"),
    )

    if (videoFiles.length > 0) {
      includeFiles(videoFiles)
    }

    const files = videoFiles.filter((file: MediaFile) => file.path)
    if (files.length > 0) {
      includeFiles(files)
    }
  }, [media, includeFiles])

  const handleAddAllAudioFiles = useCallback(() => {
    const audioFiles = media.filter(
      (file: MediaFile) =>
        !file.probeData?.streams?.some((stream: FfprobeStream) => stream.codec_type === "video") &&
        file.probeData?.streams?.some((stream: FfprobeStream) => stream.codec_type === "audio"),
    )

    if (audioFiles.length > 0) {
      includeFiles(audioFiles)
    }

    const files = audioFiles.filter((file: MediaFile) => file.path)
    if (files.length > 0) {
      includeFiles(files)
    }
  }, [media, includeFiles])

  // Функция для сохранения выбранного размера в localStorage
  const saveSize = (mode: string, size: number): void => {
    if (typeof window === "undefined") return // Проверка на SSR

    // Выбираем правильный ключ на основе режима
    let storageKey
    if (mode === "grid") storageKey = STORAGE_KEY_GRID
    else if (mode === "thumbnails") storageKey = STORAGE_KEY_THUMBNAILS
    else if (mode === "list") storageKey = STORAGE_KEY_LIST
    else storageKey = `${STORAGE_KEY_PREFIX}${mode}` // Запасной вариант

    try {
      localStorage.setItem(storageKey, size.toString())
      console.log(`[MediaFileList] Saved size ${size} for mode ${mode} to key ${storageKey}`)
    } catch (error) {
      console.error("[MediaFileList] Error saving to localStorage:", error)
    }
  }

  // Функция для очистки всех сохраненных размеров
  const clearAllSavedSizes = (): void => {
    if (typeof window === "undefined") return // Проверка на SSR

    try {
      // Удаляем все сохраненные размеры
      localStorage.removeItem(STORAGE_KEY_GRID)
      localStorage.removeItem(STORAGE_KEY_THUMBNAILS)
      localStorage.removeItem(STORAGE_KEY_LIST)
      console.log("[MediaFileList] Cleared all saved sizes from localStorage")
    } catch (error) {
      console.error("[MediaFileList] Error clearing localStorage:", error)
    }
  }

  const handleAddMedia = useCallback(
    (e: React.MouseEvent, file: MediaFile) => {
      e.stopPropagation()
      console.log("[handleAddMedia] Adding media file:", file.name)

      // Проверяем, не добавлен ли файл уже в addedFiles
      if (!file.path || includedFiles.map((f) => f.path).includes(file.path)) {
        console.log(`[handleAddMedia] Файл ${file.name} уже добавлен в медиафайлы`)
        return
      }

      // Останавливаем все видео в текущей группе
      const fileId = file.id || file.path || file.name
      console.log("[handleAddMedia] File ID:", fileId)

      // Проверяем, является ли файл изображением
      if (file.isImage) {
        console.log("[handleAddMedia] Добавляем изображение только в медиафайлы:", file.name)
        return
      }

      // Для видео и аудио добавляем на таймлайн
      includeFiles([file])
      addMediaFiles([file])

      // Отмечаем файл как добавленный
      if (file.path) {
        includeFiles([file])
      }
    },
    [media, includeFiles, videoRefs],
  )

  if (isLoading) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex-1 p-3 pb-1">
          <Skeleton className="w-full h-8 rounded" />
        </div>
        <div className="p-4 space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3 p-0 pr-2 rounded-md">
              <div className="h-[100px] w-[170px]">
                <Skeleton className="h-full w-full rounded" />
              </div>
              <div className="flex-1 h-[90px] items-center">
                <Skeleton className="h-4 w-3/4 mb-3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
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
        <div className="p-4 text-center text-gray-400 dark:text-gray-500">Нет медиа-файлов</div>
      )
    }

    const renderFile = (file: MediaFile) => {
      const fileId = file.id || file.path || file.name
      const duration = file.probeData?.format.duration || 1
      const isAudio = getFileType(file) === "audio"
      const isAdded = Boolean(file.path && includedFiles.map((f) => f.path).includes(file.path))

      switch (viewMode) {
        case "list":
          return (
            <div
              key={fileId}
              className={cn(
                "flex items-center p-0 h-full",
                "bg-white dark:bg-[#25242b] hover:bg-gray-100 dark:hover:bg-[#2f2d38]",
                isAdded && "pointer-events-none",
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
                  size={previewSize}
                  hideTime={true}
                />
              </div>
              <FileMetadata file={file} size={previewSize} />
            </div>
          )

        case "grid":
          return (
            <div
              key={fileId}
              className={cn(
                "flex flex-col h-full w-full rounded-sm overflow-hidden",
                isAdded && "pointer-events-none",
              )}
              style={{
                width: `${((previewSize * 16) / 9).toFixed(0)}px`,
              }}
            >
              <div className="relative flex-1 flex-col w-full flex-grow">
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
                  size={previewSize}
                />
              </div>
              <div className="p-1 text-xs truncate">{file.name}</div>
            </div>
          )

        case "thumbnails":
          return (
            <div
              key={fileId}
              className={cn(
                "flex items-center p-0 h-full",
                "bg-white dark:bg-[#25242b] hover:bg-gray-100 dark:hover:bg-[#2f2d38]",
                isAdded && "pointer-events-none",
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
                size={previewSize}
                showFileName={true}
              />
            </div>
          )
      }
    }

    const renderGroup = (group: { title: string; files: MediaFile[] }) => {
      // Не показываем группу, если в ней нет файлов
      if (group.files.length === 0) {
        return null
      }

      // Если нет заголовка и есть файлы, показываем их без группы
      if (!group.title) {
        return (
          <div
            key="ungrouped"
            className={
              viewMode === "grid"
                ? "flex flex-wrap gap-3 items-left"
                : viewMode === "thumbnails"
                  ? "flex flex-wrap gap-3 justify-between"
                  : "space-y-1"
            }
          >
            {group.files.map((file) => renderFile(file))}
          </div>
        )
      }

      return (
        <div key={group.title} className="mb-4">
          <div className="flex items-center justify-between mb-2 px-2">
            <h3 className="text-sm font-medium">{group.title}</h3>
            <Button
              variant="outline"
              size="sm"
              className="text-xs flex items-center gap-1 cursor-pointer px-1 h-7"
              onClick={() => {
                // Фильтруем файлы - изображения не добавляем на таймлайн
                const nonImageFiles = group.files.filter((file) => !file.isImage)
                const imageFiles = group.files.filter((file) => file.isImage)

                // Добавляем видео и аудио файлы на таймлайн
                if (nonImageFiles.length > 0) {
                  includeFiles(nonImageFiles)
                }

                // Отмечаем все файлы как добавленные
                const files = group.files.filter((file) => file.path)
                if (files.length > 0) {
                  includeFiles(files)
                }
              }}
            >
              <span className="text-xs px-1">Добавить все</span>
              <CopyPlus className="h-3 w-3 mr-1" />
            </Button>
          </div>
          <div
            className={
              viewMode === "grid" || viewMode === "thumbnails"
                ? "flex flex-wrap gap-3 items-left"
                : "space-y-1"
            }
          >
            {group.files.map((file) => renderFile(file))}
          </div>
        </div>
      )
    }

    return <div className="space-y-4">{groupedFiles.map((group, index) => renderGroup(group))}</div>
  }

  // console.log("[MediaFileList] Rendering media list with:", {
  //   mediaCount: media.length,
  //   filteredCount: filteredAndSortedMedia.length,
  // })

  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden">
      <MediaToolbar
        viewMode={viewMode as ViewMode}
        onViewModeChange={handleViewModeChange}
        onImport={handleImport}
        onImportFile={handleImportFile}
        onImportFolder={handleImportFolder}
        onSort={handleSort}
        onFilter={handleFilter}
        onGroupBy={handleGroupBy}
        onChangeOrder={handleChangeOrder}
        sortOrder={sortOrder}
        currentSortBy={sortBy}
        currentFilterType={filterType}
        currentGroupBy={groupBy}
        onRecord={handleRecord}
        onRecordCamera={handleRecordCamera}
        onRecordScreen={handleRecordScreen}
        onRecordVoice={handleRecordVoice}
        onIncreaseSize={handleIncreaseSize}
        onDecreaseSize={handleDecreaseSize}
        canIncreaseSize={canIncreaseSize}
        canDecreaseSize={canDecreaseSize}
      />
      <div className="flex-1 p-0 min-h-0 overflow-y-auto scrollbar-hide hover:scrollbar-default">
        {renderContent()}
      </div>
      <div className="flex-shrink-0 transition-all duration-200 ease-in-out p-0 m-0">
        <StatusBar
          media={filteredAndSortedMedia}
          onAddAllVideoFiles={handleAddAllVideoFiles}
          onAddAllAudioFiles={handleAddAllAudioFiles}
          onAddDateFiles={handleAddDateFiles}
          onAddAllFiles={handleAddAllFiles}
          sortedDates={sortedDates}
          addedFiles={includedFiles}
        />
      </div>
      {isRecordingModalOpen && (
        <CameraCaptureDialog
          isOpen={isRecordingModalOpen}
          onClose={() => setIsRecordingModalOpen(false)}
          onVideoRecorded={handleRecordedVideo}
        />
      )}
    </div>
  )
})
