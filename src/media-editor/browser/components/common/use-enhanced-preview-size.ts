import { useCallback, useEffect, useState } from "react"

import { storageService } from "@/media-editor/browser/services"

// Размеры превью, доступные для выбора
export const PREVIEW_SIZES = [60, 80, 100, 125, 150, 200, 250, 300, 400] as const
export const DEFAULT_SIZE = 100

// Минимальные размеры для разных типов превью
export const MIN_SIZE = 60
export const MIN_SIZE_TEMPLATES = 100
export const MIN_SIZE_TRANSITIONS = 100
export const MIN_SIZE_EFFECTS = 100
export const MIN_SIZE_FILTERS = 100
export const MIN_SIZE_SUBTITLES = 80

// Максимальные размеры для разных типов превью
export const MAX_SIZE = 400
export const MAX_SIZE_TEMPLATES = 300
export const MAX_SIZE_TRANSITIONS = 400
export const MAX_SIZE_EFFECTS = 400
export const MAX_SIZE_FILTERS = 400
export const MAX_SIZE_SUBTITLES = 250

// Префикс для ключей localStorage
export const STORAGE_PREFIX = "timeline-preview-size-"

/**
 * Интерфейс для опций хука useEnhancedPreviewSize
 */
export interface UseEnhancedPreviewSizeOptions {
  /** Минимальный размер превью */
  minSize?: number
  /** Максимальный размер превью */
  maxSize?: number
  /** Размер по умолчанию */
  defaultSize?: number
  /** Синхронизировать размер с другими вкладками */
  syncWithOtherTabs?: boolean
  /** Список вкладок для синхронизации */
  syncTabs?: string[]
}

/**
 * Улучшенный хук для управления размером превью
 * @param key - Ключ для хранения размера в localStorage
 * @param options - Опции для настройки поведения хука
 */
export const useEnhancedPreviewSize = (
  key: string,
  options: UseEnhancedPreviewSizeOptions = {}
) => {
  const {
    minSize = MIN_SIZE,
    maxSize = MAX_SIZE,
    defaultSize = DEFAULT_SIZE,
    syncWithOtherTabs = false,
    syncTabs = [],
  } = options

  const [previewSize, setPreviewSize] = useState(defaultSize)
  const [isSizeLoaded, setIsSizeLoaded] = useState(false)

  // Функция для загрузки сохраненного размера из localStorage
  const getSavedSize = useCallback((): number => {
    const storageKey = `${STORAGE_PREFIX}${key}`
    const savedValue = storageService.get<string>(storageKey, "")

    if (savedValue) {
      const parsedValue = parseInt(savedValue, 10)
      // Проверяем, что значение входит в допустимый диапазон
      if (
        PREVIEW_SIZES.includes(parsedValue as (typeof PREVIEW_SIZES)[number]) &&
        parsedValue >= minSize &&
        parsedValue <= maxSize
      ) {
        return parsedValue
      }
    }

    // Если нет сохраненного значения или оно некорректно, возвращаем значение по умолчанию,
    // но в пределах минимального и максимального
    return Math.min(Math.max(defaultSize, minSize), maxSize)
  }, [key, minSize, maxSize, defaultSize])

  // Функция для сохранения размера в localStorage
  const saveSize = useCallback(
    (size: number): void => {
      // Проверяем, что размер находится в пределах минимального и максимального
      const validSize = Math.min(Math.max(size, minSize), maxSize)
      const storageKey = `${STORAGE_PREFIX}${key}`
      storageService.set(storageKey, validSize.toString())

      // Если включена синхронизация с другими вкладками, сохраняем размер и для них
      if (syncWithOtherTabs && syncTabs.length > 0) {
        syncTabs.forEach((tabKey) => {
          const tabStorageKey = `${STORAGE_PREFIX}${tabKey}`
          storageService.set(tabStorageKey, validSize.toString())
        })
      }
    },
    [key, minSize, maxSize, syncWithOtherTabs, syncTabs]
  )

  // Загружаем размер после монтирования компонента
  useEffect(() => {
    setPreviewSize(getSavedSize())
    setIsSizeLoaded(true)
  }, [getSavedSize])

  // Обертка для setPreviewSize, которая также сохраняет размер в localStorage
  const updatePreviewSize = useCallback(
    (size: number) => {
      // Проверяем, что размер находится в пределах минимального и максимального
      const validSize = Math.min(Math.max(size, minSize), maxSize)
      setPreviewSize(validSize)
      saveSize(validSize)
    },
    [minSize, maxSize, saveSize]
  )

  // Обработчики для изменения размера превью
  const handleIncreaseSize = useCallback(() => {
    const currentIndex = PREVIEW_SIZES.indexOf(previewSize as (typeof PREVIEW_SIZES)[number])
    if (currentIndex < PREVIEW_SIZES.length - 1 && PREVIEW_SIZES[currentIndex + 1] <= maxSize) {
      updatePreviewSize(PREVIEW_SIZES[currentIndex + 1])
    }
  }, [previewSize, updatePreviewSize, maxSize])

  const handleDecreaseSize = useCallback(() => {
    const currentIndex = PREVIEW_SIZES.indexOf(previewSize as (typeof PREVIEW_SIZES)[number])
    if (currentIndex > 0 && PREVIEW_SIZES[currentIndex - 1] >= minSize) {
      updatePreviewSize(PREVIEW_SIZES[currentIndex - 1])
    }
  }, [previewSize, updatePreviewSize, minSize])

  // Проверка возможности увеличения/уменьшения размера
  const canIncreaseSize =
    PREVIEW_SIZES.indexOf(previewSize as (typeof PREVIEW_SIZES)[number]) < PREVIEW_SIZES.length - 1 &&
    PREVIEW_SIZES[PREVIEW_SIZES.indexOf(previewSize as (typeof PREVIEW_SIZES)[number]) + 1] <= maxSize

  const canDecreaseSize =
    PREVIEW_SIZES.indexOf(previewSize as (typeof PREVIEW_SIZES)[number]) > 0 &&
    PREVIEW_SIZES[PREVIEW_SIZES.indexOf(previewSize as (typeof PREVIEW_SIZES)[number]) - 1] >= minSize

  return {
    previewSize,
    isSizeLoaded,
    handleIncreaseSize,
    handleDecreaseSize,
    canIncreaseSize,
    canDecreaseSize,
    updatePreviewSize,
  }
}
