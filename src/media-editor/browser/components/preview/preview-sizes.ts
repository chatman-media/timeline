import { useCallback, useEffect, useState } from "react"

// Размеры превью, доступные для выбора
export const PREVIEW_SIZES = [60, 80, 100, 125, 150, 200, 250, 300, 400] as const
export const DEFAULT_SIZE = 100

// Минимальные размеры для разных типов превью
export const MIN_SIZE = 60
export const MIN_SIZE_TEMPLATES = 100
export const MIN_SIZE_TRANSITIONS = 80
export const MIN_SIZE_SUBTITLES = 80

// Объект с минимальными размерами для каждого типа превью
export const MIN_SIZES = {
  MEDIA: MIN_SIZE,
  TRANSITIONS: MIN_SIZE_TRANSITIONS,
  EFFECTS_AND_FILTERS: MIN_SIZE,
  SUBTITLES: MIN_SIZE_SUBTITLES,
  TEMPLATES: MIN_SIZE_TEMPLATES,
} as const

// Ключи для localStorage
export const STORAGE_KEYS = {
  MEDIA: "timeline-media-preview-size",
  TRANSITIONS: "timeline-transitions-preview-size",
  EFFECTS_AND_FILTERS: "timeline-effects-and-filters-preview-size", // Общий ключ для эффектов и фильтров
  SUBTITLES: "timeline-subtitles-preview-size",
  TEMPLATES: "timeline-templates-preview-size",
} as const

// Функция для загрузки сохраненного размера из localStorage
export const getSavedSize = (key: keyof typeof STORAGE_KEYS): number => {
  if (typeof window === "undefined") return DEFAULT_SIZE

  try {
    const savedValue = localStorage.getItem(STORAGE_KEYS[key])
    if (savedValue) {
      const parsedValue = parseInt(savedValue, 10)
      // Проверяем, что значение входит в допустимый диапазон и не меньше минимального для данного типа
      if (PREVIEW_SIZES.includes(parsedValue as (typeof PREVIEW_SIZES)[number]) &&
          parsedValue >= MIN_SIZES[key]) {
        return parsedValue
      }
    }
  } catch (error) {
    console.error(`[PreviewSizes] Error reading from localStorage for ${key}:`, error)
  }

  // Если нет сохраненного значения или оно некорректно, возвращаем значение по умолчанию,
  // но не меньше минимального для данного типа
  return Math.max(DEFAULT_SIZE, MIN_SIZES[key])
}

// Функция для сохранения размера в localStorage
export const saveSize = (key: keyof typeof STORAGE_KEYS, size: number): void => {
  if (typeof window === "undefined") return

  try {
    // Проверяем, что размер не меньше минимального для данного типа
    const validSize = Math.max(size, MIN_SIZES[key])
    localStorage.setItem(STORAGE_KEYS[key], validSize.toString())
  } catch (error) {
    console.error(`[PreviewSizes] Error saving to localStorage for ${key}:`, error)
  }
}

// Хук для управления размером превью
export const usePreviewSize = (key: keyof typeof STORAGE_KEYS) => {
  const [previewSize, setPreviewSize] = useState(DEFAULT_SIZE)
  const [isSizeLoaded, setIsSizeLoaded] = useState(false)

  // Получаем минимальный размер для данного типа превью
  const minSize = MIN_SIZES[key]

  // Загружаем размер после монтирования компонента
  useEffect(() => {
    setPreviewSize(getSavedSize(key))
    setIsSizeLoaded(true)
  }, [key])

  // Обертка для setPreviewSize, которая также сохраняет размер в localStorage
  const updatePreviewSize = useCallback(
    (size: number) => {
      // Проверяем, что размер не меньше минимального для данного типа
      const validSize = Math.max(size, minSize)
      setPreviewSize(validSize)
      saveSize(key, validSize)
    },
    [key, minSize],
  )

  // Обработчики для изменения размера превью
  const handleIncreaseSize = useCallback(() => {
    const currentIndex = PREVIEW_SIZES.indexOf(previewSize as (typeof PREVIEW_SIZES)[number])
    if (currentIndex < PREVIEW_SIZES.length - 1) {
      updatePreviewSize(PREVIEW_SIZES[currentIndex + 1])
    }
  }, [previewSize, updatePreviewSize])

  const handleDecreaseSize = useCallback(() => {
    const currentIndex = PREVIEW_SIZES.indexOf(previewSize as (typeof PREVIEW_SIZES)[number])
    if (currentIndex > 0 && PREVIEW_SIZES[currentIndex - 1] >= minSize) {
      updatePreviewSize(PREVIEW_SIZES[currentIndex - 1])
    }
  }, [previewSize, updatePreviewSize, minSize])

  // Проверка возможности увеличения/уменьшения размера
  const canIncreaseSize =
    PREVIEW_SIZES.indexOf(previewSize as (typeof PREVIEW_SIZES)[number]) < PREVIEW_SIZES.length - 1
  const canDecreaseSize =
    PREVIEW_SIZES.indexOf(previewSize as (typeof PREVIEW_SIZES)[number]) > 0 &&
    PREVIEW_SIZES[PREVIEW_SIZES.indexOf(previewSize as (typeof PREVIEW_SIZES)[number]) - 1] >=
      minSize

  return {
    previewSize,
    isSizeLoaded,
    handleIncreaseSize,
    handleDecreaseSize,
    canIncreaseSize,
    canDecreaseSize,
  }
}
