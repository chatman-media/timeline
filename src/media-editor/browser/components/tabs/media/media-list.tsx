import { CopyPlus } from "lucide-react"
import { memo, useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import i18n from "@/i18n"
import { cn } from "@/lib/utils"
import {
  FileMetadata,
  getFileType,
  groupFilesByDate,
  MediaPreview,
  MediaToolbar,
  NoFiles,
  StatusBar,
  useMedia,
} from "@/media-editor/browser"
import { CameraCaptureDialog, VoiceRecordDialog } from "@/media-editor/dialogs"
import { useTimeline } from "@/media-editor/timeline/services"
import { FfprobeStream } from "@/types/ffprobe"
import { MediaFile } from "@/types/media"

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

  // console.log(`[MediaFileList] No saved size for mode ${mode}, using default ${defaultSize}`)
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
}) {
  const { t } = useTranslation()
  const {
    isLoading,
    allMediaFiles: media,
    includedFiles,
    includeFiles,
    isFileAdded,
    areAllFilesAdded,
  } = useMedia()

  const { addMediaFiles: timelineAddMediaFiles } = useTimeline()

  const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false)
  const [isVoiceRecordModalOpen, setIsVoiceRecordModalOpen] = useState(false)

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
  const [searchQuery, setSearchQuery] = useState<string>("")

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

  const addFilesToTimeline = useCallback(
    (files: MediaFile[]) => {
      const newFiles = files.filter(
        (file) => !includedFiles.map((file: MediaFile) => file.path).includes(file.path),
      )
      console.log("Adding files to timeline:", {
        allFiles: files,
        newFiles,
        includedFiles: includedFiles.map((file: MediaFile) => file.path),
      })
      if (newFiles.length > 0) {
        // Сначала добавляем в медиа
        includeFiles(newFiles)
        // Затем добавляем на таймлайн
        console.log("Sending files to timeline machine:", newFiles)
        timelineAddMediaFiles(newFiles)
      }
    },
    [includedFiles, includeFiles, timelineAddMediaFiles],
  )

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

    // console.log("[MediaFileList] Initial mount, viewMode:", viewMode)

    // Определяем размер по умолчанию для текущего режима
    let defaultSize = DEFAULT_SIZE
    if (viewMode === "grid") defaultSize = DEFAULT_SIZE_GRID
    else if (viewMode === "thumbnails") defaultSize = DEFAULT_SIZE_THUMBNAILS
    else if (viewMode === "list") defaultSize = DEFAULT_SIZE_LIST

    // Устанавливаем соответствующий размер для текущего режима просмотра из localStorage
    const savedSize = getSavedSize(viewMode, defaultSize)

    // Применяем минимальные ограничения
    if (savedSize < MIN_SIZE) {
      // console.log(
      //   `[MediaFileList] Initial size ${savedSize} is below minimum ${MIN_SIZE}, adjusting`,
      // )
      updatePreviewSize(MIN_SIZE)
    } else {
      // console.log(`[MediaFileList] Setting initial size to ${savedSize} for mode ${viewMode}`)
      updatePreviewSize(savedSize)
    }
  }, []) // Выполняется только при монтировании

  // Эффект для отслеживания изменения режима просмотра
  useEffect(() => {
    // console.log(`[MediaFileList] View mode changed to ${viewMode}`)

    // Определяем размер по умолчанию для нового режима
    let defaultSize = DEFAULT_SIZE
    if (viewMode === "grid") defaultSize = DEFAULT_SIZE_GRID
    else if (viewMode === "thumbnails") defaultSize = DEFAULT_SIZE_THUMBNAILS
    else if (viewMode === "list") defaultSize = DEFAULT_SIZE_LIST

    // При изменении режима просмотра загружаем сохраненный размер
    const savedSize = getSavedSize(viewMode, defaultSize)

    // Применяем минимальные ограничения
    if (savedSize < MIN_SIZE) {
      // console.log(`[MediaFileList] Saved size ${savedSize} is below minimum ${MIN_SIZE}, adjusting`)
      updatePreviewSize(MIN_SIZE)
    } else {
      // console.log(`[MediaFileList] Loading saved size ${savedSize} for mode ${viewMode}`)
      updatePreviewSize(savedSize)
    }
  }, [viewMode, updatePreviewSize])

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

  const handleRecordVoice = () => {
    console.log("Открытие модального окна записи голоса")
    setIsVoiceRecordModalOpen(true)
  }

  const handleRecordedVideo = useCallback((blob: Blob, fileName: string) => {
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
  }, [])

  // Фильтрация и сортировка
  const filteredAndSortedMedia = useMemo(() => {
    // Сначала фильтрация по типу
    let filtered =
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

    // Затем фильтрация по поисковому запросу
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (file) =>
          file.name.toLowerCase().includes(query) ||
          String(file.probeData?.format.tags?.title || "")
            .toLowerCase()
            .includes(query) ||
          String(file.probeData?.format.tags?.artist || "")
            .toLowerCase()
            .includes(query) ||
          String(file.probeData?.format.tags?.album || "")
            .toLowerCase()
            .includes(query)
      )
    }

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
  }, [media, filterType, sortBy, sortOrder, searchQuery])

  // Группируем файлы
  const groupedFiles = useMemo<GroupedMediaFiles[]>(() => {
    // console.log("[groupedFiles] Group by:", groupBy)
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
        .sort(([a], [b]) => {
          if (sortOrder === "asc") {
            return a.localeCompare(b)
          }
          return b.localeCompare(a)
        })
        .map(([type, files]) => ({
          title: type === "video" ? "Видео" : type === "audio" ? "Аудио" : "Изображения",
          files,
        }))
    }

    if (groupBy === "date") {
      const groups: Record<string, MediaFile[]> = {}
      // Получаем текущий язык из i18n
      const currentLanguage = i18n.language || "ru"
      const locale = currentLanguage === "en" ? "en-US" : "ru-RU"
      const noDateText = i18n.t("dates.noDate", { defaultValue: "Без даты" })

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
          ? new Date(timestamp * 1000).toLocaleDateString(locale, {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })
          : noDateText

        if (!groups[date]) {
          groups[date] = []
        }
        groups[date].push(file)
      })

      return Object.entries(groups)
        .sort(([a], [b]) => {
          if (a === noDateText) return 1
          if (b === noDateText) return -1
          const dateA = new Date(a)
          const dateB = new Date(b)
          return sortOrder === "asc"
            ? dateA.getTime() - dateB.getTime()
            : dateB.getTime() - dateA.getTime()
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

      const groupOrder = [
        "noDuration",
        "veryShort",
        "short",
        "medium",
        "long",
        "veryLong",
        "extraLong",
      ]

      return Object.entries(groups)
        .filter(([, files]) => files.length > 0)
        .sort(([a], [b]) => {
          const indexA = groupOrder.indexOf(a)
          const indexB = groupOrder.indexOf(b)
          return sortOrder === "asc" ? indexA - indexB : indexB - indexA
        })
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
  }, [filteredAndSortedMedia, groupBy, sortOrder])

  // Мемоизируем другие вычисления
  const sortedDates = useMemo(() => groupFilesByDate(media), [media])

  // Удаляем импорт rootStore
  // Заменяем все остальные вызовы rootStore.send
  const handleAddAllFiles = useCallback(() => {
    const nonImageFiles = media.filter((file: MediaFile) => !file.isImage)
    if (nonImageFiles.length > 0) {
      addFilesToTimeline(nonImageFiles)
    }
  }, [media, addFilesToTimeline])

  const addDateFiles = useCallback(
    (files: MediaFile[]) => {
      addFilesToTimeline(files)
    },
    [addFilesToTimeline],
  )

  const handleAddAllVideoFiles = useCallback(() => {
    const videoFiles = media.filter((file: MediaFile) =>
      file.probeData?.streams?.some((stream: FfprobeStream) => stream.codec_type === "video"),
    )
    if (videoFiles.length > 0) {
      addFilesToTimeline(videoFiles)
    }
  }, [media, addFilesToTimeline])

  const handleAddAllAudioFiles = useCallback(() => {
    const audioFiles = media.filter(
      (file: MediaFile) =>
        !file.probeData?.streams?.some((stream: FfprobeStream) => stream.codec_type === "video") &&
        file.probeData?.streams?.some((stream: FfprobeStream) => stream.codec_type === "audio"),
    )
    if (audioFiles.length > 0) {
      addFilesToTimeline(audioFiles)
    }
  }, [media, addFilesToTimeline])

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

  const handleAddMedia = useCallback(
    (e: React.MouseEvent, file: MediaFile) => {
      e.stopPropagation()
      console.log("[handleAddMedia] Adding media file:", file.name)

      // Проверяем, не добавлен ли файл уже
      if (isFileAdded(file)) {
        console.log(`[handleAddMedia] Файл ${file.name} уже добавлен в медиафайлы`)
        return
      }

      // Проверяем, является ли файл изображением
      if (file.isImage) {
        console.log("[handleAddMedia] Добавляем изображение только в медиафайлы:", file.name)
        return
      }

      // Добавляем файл на таймлайн
      if (file.path) {
        console.log("[handleAddMedia] Вызываем addFilesToTimeline с файлом:", file)
        addFilesToTimeline([file])
      }
    },
    [addFilesToTimeline, isFileAdded],
  )

  // Мемоизируем функцию рендеринга файла
  const renderFile = useCallback(
    (file: MediaFile) => {
      const fileId = file.id || file.path || file.name
      const isAdded = isFileAdded(file)

      switch (viewMode) {
      case "list":
        return (
          <div
            key={fileId}
            className={cn(
              "group flex h-full items-center border border-transparent p-0",
              "bg-white hover:border-[#38daca71] hover:bg-gray-100 dark:bg-[#25242b] dark:hover:border-[#35d1c1] dark:hover:bg-[#2f2d38]",
              isAdded && "pointer-events-none",
            )}
          >
            <div className="relative mr-3 flex h-full flex-shrink-0 gap-1">
              <MediaPreview
                file={file}
                onAddMedia={handleAddMedia}
                isAdded={isAdded}
                size={previewSize}
                hideTime={true}
                ignoreRatio={true}
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
              "flex h-full w-full flex-col overflow-hidden rounded-xs",
              "border border-transparent bg-white hover:border-[#38dacac3] hover:bg-gray-100 dark:bg-[#25242b] dark:hover:border-[#35d1c1] dark:hover:bg-[#2f2d38]",
              isAdded && "pointer-events-none",
            )}
            style={{
              width: `${((previewSize * 16) / 9).toFixed(0)}px`,
            }}
          >
            <div className="group relative w-full flex-1 flex-grow flex-row">
              <MediaPreview
                file={file}
                onAddMedia={handleAddMedia}
                isAdded={isAdded}
                size={previewSize}
              />
            </div>
            <div
              className="truncate p-1 text-xs"
              style={{
                fontSize: previewSize > 100 ? "13px" : "12px",
              }}
            >
              {file.name}
            </div>
          </div>
        )

      case "thumbnails":
        return (
          <div
            key={fileId}
            className={cn(
              "flex h-full items-center p-0",
              "border border-transparent bg-white hover:border-[#38dacac3] hover:bg-gray-100 dark:bg-[#25242b] dark:hover:border-[#35d1c1] dark:hover:bg-[#2f2d38]",
              isAdded && "pointer-events-none",
            )}
          >
            <div className="group relative w-full flex-1 flex-grow flex-row">
              <MediaPreview
                file={file}
                onAddMedia={handleAddMedia}
                isAdded={isAdded}
                size={previewSize}
                showFileName={true}
                ignoreRatio={true}
              />
            </div>
          </div>
        )
      }
    },
    [viewMode, previewSize, isFileAdded, handleAddMedia],
  )

  // Мемоизируем функцию рендеринга группы
  const renderGroup = useCallback(
    (group: { title: string; files: MediaFile[] }) => {
      // Не показываем группу, если в ней нет файлов
      if (group.files.length === 0) {
        return null
      }

      // Проверяем, все ли файлы в группе уже добавлены
      const allFilesAdded = areAllFilesAdded(group.files)

      if (!group.title || group.title === "") {
        return (
          <div
            key="ungrouped"
            className={
              viewMode === "grid"
                ? "items-left flex flex-wrap gap-3"
                : viewMode === "thumbnails"
                  ? "flex flex-wrap justify-between gap-3"
                  : "space-y-1"
            }
          >
            {group.files.map((file) => renderFile(file))}
          </div>
        )
      }

      return (
        <div key={group.title} className="mb-4">
          <div className="mb-2 flex items-center justify-between px-2">
            <h3 className="text-sm font-medium">{group.title}</h3>
            <Button
              variant="secondary"
              size="sm"
              className={cn(
                "flex h-7 cursor-pointer items-center gap-1 rounded-sm bg-[#dddbdd] px-2 text-xs hover:bg-[#38dacac3] dark:bg-[#45444b] dark:hover:bg-[#35d1c1] dark:hover:text-black",
                allFilesAdded && "cursor-not-allowed opacity-50",
              )}
              onClick={() => {
                // Фильтруем файлы - изображения не добавляем на таймлайн
                const nonImageFiles = group.files.filter((file) => !file.isImage)

                // Добавляем видео и аудио файлы на таймлайн
                if (nonImageFiles.length > 0) {
                  addFilesToTimeline(nonImageFiles)
                }
              }}
              disabled={allFilesAdded}
            >
              <span className="px-1 text-xs">
                {allFilesAdded ? t("browser.media.added") : t("browser.media.add")}
              </span>
              <CopyPlus className="mr-1 h-3 w-3" />
            </Button>
          </div>
          <div
            className={
              viewMode === "grid" || viewMode === "thumbnails"
                ? "items-left flex flex-wrap gap-3"
                : "space-y-1"
            }
          >
            {group.files.map((file) => renderFile(file))}
          </div>
        </div>
      )
    },
    [viewMode, areAllFilesAdded, addFilesToTimeline, renderFile],
  )

  // Функция рендеринга контента
  const renderContent = useCallback(() => {
    if (filteredAndSortedMedia.length === 0) {
      return (
        <div className="p-4 text-center text-gray-400 dark:text-gray-500">Нет медиа-файлов</div>
      )
    }

    return <div className="space-y-4 p-2">{groupedFiles.map((group) => renderGroup(group))}</div>
  }, [filteredAndSortedMedia, groupedFiles, renderGroup])

  if (isLoading || !media || media.length === 0) {
    return (
      <div className="flex flex-col overflow-hidden">
        <div className="flex-1 p-3 pb-1">
          <Skeleton className="h-8 w-full rounded" />
        </div>
        <div className="space-y-4 p-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3 rounded-md p-0 pr-2">
              <div className="h-[100px] w-[170px]">
                <Skeleton className="h-full w-full rounded" />
              </div>
              <div className="h-[90px] flex-1 items-center">
                <Skeleton className="mb-3 h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!isLoading && !media) {
    return <NoFiles />
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      <MediaToolbar
        viewMode={viewMode as ViewMode}
        onViewModeChange={handleViewModeChange}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
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
        onRecordVoice={handleRecordVoice}
        onIncreaseSize={handleIncreaseSize}
        onDecreaseSize={handleDecreaseSize}
        canIncreaseSize={canIncreaseSize}
        canDecreaseSize={canDecreaseSize}
      />
      <div className="scrollbar-hide hover:scrollbar-default min-h-0 flex-1 overflow-y-auto p-0 dark:bg-[#1b1a1f]">
        {renderContent()}
      </div>
      <div className="m-0 flex-shrink-0 py-0.5 transition-all duration-200 ease-in-out">
        <StatusBar
          media={filteredAndSortedMedia}
          onAddAllVideoFiles={handleAddAllVideoFiles}
          onAddAllAudioFiles={handleAddAllAudioFiles}
          onAddDateFiles={addDateFiles}
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
      {isVoiceRecordModalOpen && (
        <VoiceRecordDialog
          isOpen={isVoiceRecordModalOpen}
          onClose={() => setIsVoiceRecordModalOpen(false)}
        />
      )}
    </div>
  )
})
