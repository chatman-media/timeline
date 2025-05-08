import { ReactNode } from "react"

import { cn } from "@/lib/utils"

import { BrowserItem } from "./browser-tab-template"

/**
 * Интерфейс для пропсов компонента BrowserItemView
 */
export interface BrowserItemViewProps<T extends BrowserItem> {
  /** Элемент для отображения */
  item: T
  /** Режим отображения (list, grid, thumbnails) */
  viewMode: "list" | "grid" | "thumbnails"
  /** Размер превью */
  previewSize: number
  /** Флаг, указывающий, что элемент добавлен/выбран */
  isSelected?: boolean
  /** Функция для рендеринга превью */
  renderPreview: (item: T, size: number) => ReactNode
  /** Функция для рендеринга метаданных (для режима list) */
  renderMetadata?: (item: T, size: number) => ReactNode
  /** Обработчик клика по элементу */
  onClick?: (item: T) => void
  /** Дополнительные классы */
  className?: string
}

/**
 * Общий компонент для отображения элемента в разных режимах просмотра
 * @template T - Тип элемента
 */
export function BrowserItemView<T extends BrowserItem>({
  item,
  viewMode,
  previewSize,
  isSelected = false,
  renderPreview,
  renderMetadata,
  onClick,
  className,
}: BrowserItemViewProps<T>) {
  const handleClick = () => {
    if (onClick) {
      onClick(item)
    }
  }

  // Получаем отображаемое имя элемента
  const displayName = item.name || (item.labels && item.labels.ru) || item.id

  switch (viewMode) {
    case "list":
      return (
        <div
          className={cn(
            "group flex h-full items-center border border-transparent p-0",
            "bg-white hover:border-[#38daca71] hover:bg-gray-100 dark:bg-[#25242b] dark:hover:border-[#35d1c1] dark:hover:bg-[#2f2d38]",
            isSelected && "pointer-events-none",
            className
          )}
          onClick={handleClick}
        >
          <div className="relative mr-3 flex h-full flex-shrink-0 gap-1">
            {renderPreview(item, previewSize)}
          </div>
          {renderMetadata && renderMetadata(item, previewSize)}
        </div>
      )

    case "grid":
      return (
        <div
          className={cn(
            "flex h-full w-full flex-col overflow-hidden rounded-xs",
            "border border-transparent bg-white hover:border-[#38dacac3] hover:bg-gray-100 dark:bg-[#25242b] dark:hover:border-[#35d1c1] dark:hover:bg-[#2f2d38]",
            isSelected && "pointer-events-none",
            className
          )}
          style={{
            width: `${((previewSize * 16) / 9).toFixed(0)}px`,
          }}
          onClick={handleClick}
        >
          <div className="group relative w-full flex-1 flex-grow flex-row">
            {renderPreview(item, previewSize)}
          </div>
          <div
            className="truncate p-1 text-xs"
            style={{
              fontSize: previewSize > 100 ? "13px" : "12px",
            }}
          >
            {displayName}
          </div>
        </div>
      )

    case "thumbnails":
      return (
        <div
          className={cn(
            "flex h-full items-center p-0",
            "border border-transparent bg-white hover:border-[#38dacac3] hover:bg-gray-100 dark:bg-[#25242b] dark:hover:border-[#35d1c1] dark:hover:bg-[#2f2d38]",
            isSelected && "pointer-events-none",
            className
          )}
          onClick={handleClick}
        >
          <div className="group relative w-full flex-1 flex-grow flex-row">
            {renderPreview(item, previewSize)}
          </div>
        </div>
      )

    default:
      return null
  }
}
