import { memo, useCallback, useState } from "react"
import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"

import { useEnhancedPreviewSize, UseEnhancedPreviewSizeOptions } from "./use-enhanced-preview-size"

/**
 * Общий интерфейс для элементов, отображаемых в вкладках браузера
 */
export interface BrowserItem {
  id: string
  name?: string
  labels?: {
    ru: string
    en: string
  }
  [key: string]: any
}

/**
 * Интерфейс для пропсов панели инструментов
 */
export interface ToolbarProps<T extends BrowserItem> {
  searchQuery: string
  setSearchQuery: (query: string) => void
  previewSize: number
  handleIncreaseSize: () => void
  handleDecreaseSize: () => void
  canIncreaseSize: boolean
  canDecreaseSize: boolean
  viewMode?: string
  onViewModeChange?: (mode: string) => void
  // Дополнительные пропсы для конкретных панелей инструментов
  [key: string]: any
}

/**
 * Интерфейс для настроек вкладки
 */
export interface BrowserTabSettings {
  /** Режим просмотра (list, grid, thumbnails) */
  viewMode?: string
  /** Группировка (по дате, типу и т.д.) */
  groupBy?: string
  /** Сортировка (по дате, имени и т.д.) */
  sortBy?: string
  /** Порядок сортировки (asc, desc) */
  sortOrder?: "asc" | "desc"
  /** Фильтрация (по типу файла) */
  filterType?: string
  /** Дополнительные настройки */
  [key: string]: any
}

/**
 * Интерфейс для пропсов шаблона вкладки
 */
export interface BrowserTabTemplateProps<T extends BrowserItem> {
  /** Массив элементов для отображения */
  items: T[]
  /** Ключ для хранения настроек в localStorage */
  storageKey: string
  /** Функция для рендеринга элемента */
  renderItem: (item: T, index: number) => React.ReactNode
  /** Функция для рендеринга панели инструментов */
  renderToolbar: (props: ToolbarProps<T>) => React.ReactNode
  /** Функция для фильтрации элементов */
  filterItems?: (items: T[], searchQuery: string, settings?: BrowserTabSettings) => T[]
  /** Функция для группировки элементов */
  groupItems?: (items: T[], settings?: BrowserTabSettings) => Record<string, T[]>
  /** Функция для сортировки элементов */
  sortItems?: (items: T[], settings?: BrowserTabSettings) => T[]
  /** Начальные настройки вкладки */
  initialSettings?: BrowserTabSettings
  /** Функция для сохранения настроек */
  onSettingsChange?: (settings: BrowserTabSettings) => void
  /** Дополнительные классы для контейнера */
  className?: string
  /** Опции для хука useEnhancedPreviewSize */
  options?: UseEnhancedPreviewSizeOptions
  /** Рендерить ли статусную панель */
  renderStatusBar?: (props: any) => React.ReactNode
  /** Дополнительные пропсы */
  [key: string]: any
}

/**
 * Общий шаблон для компонентов вкладок браузера
 * @template T - Тип элементов, отображаемых в вкладке
 */
export const BrowserTabTemplate = memo(function BrowserTabTemplate<T extends BrowserItem>({
  items,
  storageKey,
  renderItem,
  renderToolbar,
  filterItems,
  groupItems,
  sortItems,
  initialSettings = { viewMode: "grid" },
  onSettingsChange,
  className,
  options,
  renderStatusBar,
  ...rest
}: BrowserTabTemplateProps<T>) {
  // Состояние поискового запроса
  const [searchQuery, setSearchQuery] = useState("")
  // Состояние настроек вкладки
  const [settings, setSettings] = useState<BrowserTabSettings>(initialSettings)

  // Хук для управления размером превью
  const {
    previewSize,
    isSizeLoaded,
    handleIncreaseSize,
    handleDecreaseSize,
    canIncreaseSize,
    canDecreaseSize,
  } = useEnhancedPreviewSize(storageKey, options)

  // Обработчик изменения настроек
  const handleSettingsChange = useCallback(
    (newSettings: Partial<BrowserTabSettings>) => {
      const updatedSettings = { ...settings, ...newSettings }
      setSettings(updatedSettings)
      if (onSettingsChange) {
        onSettingsChange(updatedSettings)
      }
    },
    [settings, onSettingsChange],
  )

  // Фильтрация элементов
  const filteredItems = useCallback(() => {
    if (!filterItems) {
      // Базовая фильтрация по умолчанию
      return items.filter((item) => {
        const searchLower = searchQuery.toLowerCase()
        return (
          item.id.toLowerCase().includes(searchLower) ||
          (item.name && item.name.toLowerCase().includes(searchLower)) ||
          (item.labels &&
            (item.labels.ru.toLowerCase().includes(searchLower) ||
              item.labels.en.toLowerCase().includes(searchLower)))
        )
      })
    }
    return filterItems(items, searchQuery, settings)
  }, [items, searchQuery, filterItems, settings])

  // Сортировка элементов
  const sortedItems = useCallback(() => {
    if (!sortItems) {
      // Если функция сортировки не предоставлена, возвращаем отфильтрованные элементы без сортировки
      return filteredItems()
    }
    return sortItems(filteredItems(), settings)
  }, [filteredItems, sortItems, settings])

  // Группировка элементов
  const groupedItems = useCallback(() => {
    if (!groupItems) {
      // Если функция группировки не предоставлена, возвращаем все элементы в одной группе
      return { "": sortedItems() }
    }
    return groupItems(sortedItems(), settings)
  }, [sortedItems, groupItems, settings])

  // Обработчик изменения режима отображения
  const handleViewModeChange = useCallback(
    (mode: string) => {
      handleSettingsChange({ viewMode: mode })
    },
    [handleSettingsChange],
  )

  // Рендеринг содержимого
  const renderContent = useCallback(() => {
    const { t } = useTranslation()
    const grouped = groupedItems()
    const viewMode = settings.viewMode || "grid"

    if (!isSizeLoaded) {
      return <div className="flex h-full items-center justify-center text-gray-500" />
    }

    if (Object.values(grouped).flat().length === 0) {
      return (
        <div className="flex h-full items-center justify-center text-gray-500">
          {t("common.noResults")}
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {Object.entries(grouped).map(([group, groupItems]) => (
          <div key={group} className="mb-4">
            {group && <h3 className="mb-3 text-sm font-medium text-gray-400">{group}</h3>}
            <div
              className={cn("flex flex-wrap gap-4", viewMode === "list" && "flex-col gap-1")}
              style={{ "--preview-size": `${previewSize}px` } as React.CSSProperties}
            >
              {groupItems.map((item, index) => renderItem(item, index))}
            </div>
          </div>
        ))}
      </div>
    )
  }, [groupedItems, isSizeLoaded, previewSize, renderItem, settings.viewMode])

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {renderToolbar({
        searchQuery,
        setSearchQuery,
        previewSize,
        handleIncreaseSize,
        handleDecreaseSize,
        canIncreaseSize,
        canDecreaseSize,
        viewMode: settings.viewMode,
        onViewModeChange: handleViewModeChange,
        settings,
        onSettingsChange: handleSettingsChange,
        ...rest,
      })}
      <div className="scrollbar-hide hover:scrollbar-default min-h-0 flex-1 overflow-y-auto p-3 dark:bg-[#1b1a1f]">
        {renderContent()}
      </div>
      {renderStatusBar && (
        <div className="m-0 flex-shrink-0 py-0.5 transition-all duration-200 ease-in-out">
          {renderStatusBar({
            items: sortedItems(),
            settings,
            onSettingsChange: handleSettingsChange,
            ...rest,
          })}
        </div>
      )}
    </div>
  )
})
