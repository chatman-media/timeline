import { useCallback, useEffect, useState } from "react"

// Размеры превью, доступные для выбора
export const PREVIEW_SIZES = [60, 80, 100, 125, 150, 200, 250, 300, 400] as const
export const DEFAULT_SIZE = 100
export const MIN_SIZE = 60

// Ключи для localStorage
export const STORAGE_KEYS = {
  MEDIA: "timeline-media-preview-size",
  TRANSITIONS: "timeline-transitions-preview-size",
  EFFECTS_AND_FILTERS: "timeline-effects-and-filters-preview-size", // Общий ключ для эффектов и фильтров
} as const

// Функция для загрузки сохраненного размера из localStorage
export const getSavedSize = (key: keyof typeof STORAGE_KEYS): number => {
  if (typeof window === "undefined") return DEFAULT_SIZE

  try {
    const savedValue = localStorage.getItem(STORAGE_KEYS[key])
    if (savedValue) {
      const parsedValue = parseInt(savedValue, 10)
      if (PREVIEW_SIZES.includes(parsedValue as (typeof PREVIEW_SIZES)[number])) {
        return parsedValue
      }
    }
  } catch (error) {
    console.error(`[PreviewSizes] Error reading from localStorage for ${key}:`, error)
  }

  return DEFAULT_SIZE
}

// Функция для сохранения размера в localStorage
export const saveSize = (key: keyof typeof STORAGE_KEYS, size: number): void => {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(STORAGE_KEYS[key], size.toString())
  } catch (error) {
    console.error(`[PreviewSizes] Error saving to localStorage for ${key}:`, error)
  }
}

// Хук для управления размером превью
export const usePreviewSize = (key: keyof typeof STORAGE_KEYS) => {
  const [previewSize, setPreviewSize] = useState(DEFAULT_SIZE)
  const [isSizeLoaded, setIsSizeLoaded] = useState(false)

  // Загружаем размер после монтирования компонента
  useEffect(() => {
    setPreviewSize(getSavedSize(key))
    setIsSizeLoaded(true)
  }, [key])

  // Обертка для setPreviewSize, которая также сохраняет размер в localStorage
  const updatePreviewSize = useCallback(
    (size: number) => {
      setPreviewSize(size)
      saveSize(key, size)
    },
    [key],
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
    if (currentIndex > 0 && PREVIEW_SIZES[currentIndex - 1] >= MIN_SIZE) {
      updatePreviewSize(PREVIEW_SIZES[currentIndex - 1])
    }
  }, [previewSize, updatePreviewSize])

  // Проверка возможности увеличения/уменьшения размера
  const canIncreaseSize =
    PREVIEW_SIZES.indexOf(previewSize as (typeof PREVIEW_SIZES)[number]) < PREVIEW_SIZES.length - 1
  const canDecreaseSize =
    PREVIEW_SIZES.indexOf(previewSize as (typeof PREVIEW_SIZES)[number]) > 0 &&
    PREVIEW_SIZES[PREVIEW_SIZES.indexOf(previewSize as (typeof PREVIEW_SIZES)[number]) - 1] >=
      MIN_SIZE

  return {
    previewSize,
    isSizeLoaded,
    handleIncreaseSize,
    handleDecreaseSize,
    canIncreaseSize,
    canDecreaseSize,
  }
}
