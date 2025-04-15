import { CopyPlus } from "lucide-react"
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"

import { MediaToolbar } from "@/components/browser/layout/media-toolbar"
import { Button } from "@/components/ui/button"
import { useRootStore } from "@/hooks/use-root-store"
import { useVideoPlayer } from "@/hooks/use-video-player"
import { cn } from "@/lib/utils"
import { useModalContext } from "@/providers/modal-provider"
import { rootStore } from "@/stores/root-store"
import { MediaFile } from "@/types/videos"
import { getFileType, groupFilesByDate } from "@/utils/media-utils"

import { Skeleton } from "../../../ui/skeleton"
import { FileMetadata, MediaPreview, StatusBar } from "../.."
import { FilterType, GroupBy, MediaSettings, SortBy, SortOrder, ViewMode } from "./types"

// Создаем глобальные переменные для кэширования видео и их состояния загрузки
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
const STORAGE_KEYS = {
  PREFIX: "timeline-preview-size-",
  GRID: "timeline-preview-size-grid",
  THUMBNAILS: "timeline-preview-size-thumbnails",
  LIST: "timeline-preview-size-list",
  VIEW_MODE: "timeline-view-mode",
  GROUP_BY: "timeline-group-by",
  SORT_BY: "timeline-sort-by",
  SORT_ORDER: "timeline-sort-order",
  FILTER_TYPE: "timeline-filter-type",
} as const

// Функция для работы с localStorage
const storage = {
  get: <T,>(key: string, defaultValue: T): T => {
    if (typeof window === "undefined") return defaultValue
    try {
      const value = localStorage.getItem(key)
      if (!value) return defaultValue

      // Если значение - строка, возвращаем как есть
      if (typeof defaultValue === "string") {
        return value as T
      }

      // Для остальных типов пытаемся распарсить JSON
      return JSON.parse(value)
    } catch (error) {
      console.error(`[MediaFileList] Error reading from localStorage:`, error)
      return defaultValue
    }
  },

  set: (key: string, value: any): void => {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`[MediaFileList] Error saving to localStorage:`, error)
    }
  },

  remove: (key: string): void => {
    if (typeof window === "undefined") return
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error(`[MediaFileList] Error removing from localStorage:`, error)
    }
  },
}

// Функция для загрузки сохраненного размера из localStorage
const getSavedSize = (mode: ViewMode, defaultSize: number): number => {
  const key =
    STORAGE_KEYS[mode.toUpperCase() as keyof typeof STORAGE_KEYS] || `${STORAGE_KEYS.PREFIX}${mode}`
  const savedValue = storage.get(key, defaultSize)
  return PREVIEW_SIZES.includes(savedValue) ? savedValue : defaultSize
}

// Функция для загрузки сохраненных настроек
const loadSavedSettings = (): MediaSettings => {
  return {
    viewMode: storage.get(STORAGE_KEYS.VIEW_MODE, "grid") as ViewMode,
    groupBy: storage.get(STORAGE_KEYS.GROUP_BY, "date") as GroupBy,
    sortBy: storage.get(STORAGE_KEYS.SORT_BY, "date") as SortBy,
    sortOrder: storage.get(STORAGE_KEYS.SORT_ORDER, "asc") as SortOrder,
    filterType: storage.get(STORAGE_KEYS.FILTER_TYPE, "all") as FilterType,
  }
}

// Функция для сохранения настроек
const saveSettings = (settings: MediaSettings): void => {
  Object.entries(settings).forEach(([key, value]) => {
    storage.set(STORAGE_KEYS[key.toUpperCase() as keyof typeof STORAGE_KEYS], value)
  })
}

interface GroupedMediaFiles {
  title: string
  files: MediaFile[]
}

// Оборачиваем в memo для предотвращения ненужных рендеров
export const MediaFileList = memo(function MediaFileList({
  viewMode: initialViewMode = "list",
}: { viewMode?: ViewMode }) {
  const { media, isLoading, addNewTracks, addedFiles, hasFetched } = useRootStore()
  const [searchQuery, setSearchQuery] = useState("")

  // Используем локальный ref для избежания повторных запросов в текущей сессии браузера
  const localDataFetchedRef = useRef(false)

  // Ref для отслеживания первого рендера при смене режима
  const initialRenderRef = useRef(true)

  // Загружаем сохраненные настройки
  const savedSettings = loadSavedSettings()

  // Инициализируем состояние с сохраненными настройками
  const [viewMode, setViewMode] = useState<ViewMode>(
    (savedSettings?.viewMode as ViewMode) || initialViewMode,
  )
  const [sortBy, setSortBy] = useState<SortBy>(savedSettings?.sortBy || "date")
  const [filterType, setFilterType] = useState<FilterType>(savedSettings?.filterType || "all")
  const [groupBy, setGroupBy] = useState<GroupBy>(savedSettings?.groupBy || "none")
  const [sortOrder, setSortOrder] = useState<SortOrder>(
    (savedSettings?.sortOrder as SortOrder) || "desc",
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

  const { handleOpenModal } = useModalContext()
  const openRecordModal = () => handleOpenModal("record")

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
      console.log(`[MediaFileList] Loading saved size ${savedSize} for mode ${viewMode}`)
      updatePreviewSize(savedSize)
    }
  }, [viewMode, updatePreviewSize])

  console.log("[MediaFileList] Rendering with:", {
    mediaCount: media.length,
    isLoading,
    hasAddedFiles: addedFiles.size > 0,
    viewMode,
    hasFetched,
    localFetched: localDataFetchedRef.current,
    previewSize,
  })

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

  const handleSort = useCallback((newSortBy: SortBy) => {
    setSortBy(newSortBy)
  }, [])

  const handleFilter = useCallback((newFilterType: FilterType) => {
    setFilterType(newFilterType)
  }, [])

  const handleGroupBy = useCallback((newGroupBy: GroupBy) => {
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
    openRecordModal()
  }

  const handleRecordCamera = () => {
    console.log("Открытие модального окна записи с веб-камеры")
    openRecordModal()
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

      // Останавливаем все видео в текущей группе
      const fileId = getFileId(file)
      const videoElement = videoRefs.current[`${fileId}-0`]
      if (videoElement) {
        videoElement.pause()
        videoElement.currentTime = 0
      }

      // Проверяем, является ли файл изображением
      if (file.isImage) {
        console.log("[handleAddMedia] Добавляем изображение только в медиафайлы:", file.name)

        // Только отмечаем файл как добавленный, но не добавляем на таймлайн
        if (file.path) {
          rootStore.send({
            type: "addToAddedFiles",
            filePaths: [file.path],
          })
        }
        return
      }

      // Для видео и аудио добавляем на таймлайн
      addNewTracks([file])

      // Отмечаем файл как добавленный
      if (file.path) {
        rootStore.send({
          type: "addToAddedFiles",
          filePaths: [file.path],
        })
      }
    },
    [addNewTracks, addedFiles, getFileId, videoRefs],
  )

  const handleAddAllFiles = useCallback(() => {
    // Фильтруем файлы - изображения не добавляем на таймлайн
    const nonImageFiles = media.filter((file) => !file.isImage)
    const imageFiles = media.filter((file) => file.isImage)

    // Добавляем видео и аудио файлы на таймлайн
    if (nonImageFiles.length > 0) {
      addNewTracks(nonImageFiles)
    }

    // Отмечаем все файлы как добавленные
    const filePaths = media.filter((file) => file.path).map((file) => file.path as string)

    if (filePaths.length > 0) {
      rootStore.send({
        type: "addToAddedFiles",
        filePaths,
      })
    }

    // Логируем информацию о добавленных файлах
    if (imageFiles.length > 0) {
      console.log(
        `[handleAddAllFiles] Изображений добавлено только в медиафайлы: ${imageFiles.length}`,
      )
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

  // Функция для сохранения выбранного размера в localStorage
  const saveSize = (mode: string, size: number): void => {
    if (typeof window === "undefined") return // Проверка на SSR

    // Выбираем правильный ключ на основе режима
    let storageKey
    if (mode === "grid") storageKey = STORAGE_KEYS.GRID
    else if (mode === "thumbnails") storageKey = STORAGE_KEYS.THUMBNAILS
    else if (mode === "list") storageKey = STORAGE_KEYS.LIST
    else storageKey = `${STORAGE_KEYS.PREFIX}${mode}` // Запасной вариант

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
      localStorage.removeItem(STORAGE_KEYS.GRID)
      localStorage.removeItem(STORAGE_KEYS.THUMBNAILS)
      localStorage.removeItem(STORAGE_KEYS.LIST)
      console.log("[MediaFileList] Cleared all saved sizes from localStorage")
    } catch (error) {
      console.error("[MediaFileList] Error clearing localStorage:", error)
    }
  }

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
      const fileId = getFileId(file)
      const duration = file.probeData?.format.duration || 1
      const isAudio = getFileType(file) === "audio"
      const isAdded = Boolean(file.path && addedFiles.has(file.path))

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
                  addNewTracks(nonImageFiles)
                }

                // Отмечаем все файлы как добавленные
                const filePaths = group.files
                  .filter((file) => file.path)
                  .map((file) => file.path as string)

                if (filePaths.length > 0) {
                  rootStore.send({
                    type: "addToAddedFiles",
                    filePaths,
                  })
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
        currentSize={previewSize}
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
          addedFiles={addedFiles}
        />
      </div>
    </div>
  )
})
