import { Grid, LayoutDashboard, LayoutList, ZoomIn, ZoomOut } from "lucide-react"
import { ChangeEvent, ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

import { BrowserItem, BrowserTabSettings, ToolbarProps } from "./browser-tab-template"

/**
 * Интерфейс для пропсов компонента BrowserToolbar
 */
export interface BrowserToolbarProps<T extends BrowserItem> extends ToolbarProps<T> {
  /** Дополнительные элементы слева от поиска */
  leftSlot?: ReactNode
  /** Дополнительные элементы справа от поиска */
  rightSlot?: ReactNode
  /** Дополнительные элементы справа от кнопок изменения размера */
  rightEndSlot?: ReactNode
  /** Показывать ли кнопки переключения режима отображения */
  showViewModes?: boolean
  /** Доступные режимы отображения */
  availableViewModes?: ("list" | "grid" | "thumbnails")[]
  /** Плейсхолдер для поля поиска */
  searchPlaceholder?: string
  /** Обработчик изменения поискового запроса */
  onSearchChange?: (e: ChangeEvent<HTMLInputElement>) => void
  /** Текущие настройки вкладки */
  settings?: BrowserTabSettings
  /** Обработчик изменения настроек */
  onSettingsChange?: (settings: Partial<BrowserTabSettings>) => void
}

/**
 * Общий компонент для панелей инструментов
 * @template T - Тип элементов, отображаемых в вкладке
 */
export function BrowserToolbar<T extends BrowserItem>({
  searchQuery,
  setSearchQuery,
  previewSize,
  handleIncreaseSize,
  handleDecreaseSize,
  canIncreaseSize,
  canDecreaseSize,
  viewMode = "grid",
  onViewModeChange,
  leftSlot,
  rightSlot,
  rightEndSlot,
  showViewModes = true,
  availableViewModes = ["list", "grid", "thumbnails"],
  searchPlaceholder = "Поиск",
  onSearchChange,
  settings,
  onSettingsChange,
  ...rest
}: BrowserToolbarProps<T>) {
  // Обработчик изменения поискового запроса
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (onSearchChange) {
      onSearchChange(e)
    } else {
      setSearchQuery(e.target.value)
    }
  }

  // Обработчик изменения настроек
  const handleSettingsChange = (newSettings: Partial<BrowserTabSettings>) => {
    if (onSettingsChange) {
      onSettingsChange(newSettings)
    }
  }

  return (
    <div className="flex items-center justify-between p-1">
      <div className="flex items-center gap-2">
        {leftSlot}
        <Input
          type="search"
          placeholder={searchPlaceholder}
          className="mr-5 h-7 w-full max-w-[400px] rounded-sm border border-gray-300 bg-transparent text-xs outline-none focus:border-gray-400 focus:ring-0 focus-visible:ring-0 dark:border-gray-600 dark:focus:border-gray-500"
          value={searchQuery}
          onChange={handleSearchChange}
        />
        {rightSlot}
      </div>
      <div className="flex items-center gap-1">
        {/* Кнопки переключения режимов просмотра */}
        {showViewModes && onViewModeChange && (
          <TooltipProvider>
            <div className="mr-2 flex overflow-hidden rounded-md">
              {availableViewModes.includes("grid") && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "mr-0 ml-3 h-6 w-6 cursor-pointer",
                        viewMode === "grid" ? "bg-[#dddbdd] dark:bg-[#45444b]" : "",
                      )}
                      onClick={() => onViewModeChange("grid")}
                    >
                      <Grid size={16} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Сетка</TooltipContent>
                </Tooltip>
              )}

              {availableViewModes.includes("thumbnails") && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "mr-0 h-6 w-6 cursor-pointer",
                        viewMode === "thumbnails" ? "bg-[#dddbdd] dark:bg-[#45444b]" : "",
                      )}
                      onClick={() => onViewModeChange("thumbnails")}
                    >
                      <LayoutDashboard size={16} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Миниатюры</TooltipContent>
                </Tooltip>
              )}

              {availableViewModes.includes("list") && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "mr-1 h-6 w-6 cursor-pointer",
                        viewMode === "list" ? "bg-[#dddbdd] dark:bg-[#45444b]" : "",
                      )}
                      onClick={() => onViewModeChange("list")}
                    >
                      <LayoutList size={16} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Список</TooltipContent>
                </Tooltip>
              )}
            </div>
          </TooltipProvider>
        )}

        {/* Кнопки изменения размера превью */}
        <TooltipProvider>
          <div className="mr-2 flex overflow-hidden rounded-md">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "mr-1 h-6 w-6 cursor-pointer",
                    !canDecreaseSize && "cursor-not-allowed opacity-50",
                  )}
                  onClick={handleDecreaseSize}
                  disabled={!canDecreaseSize}
                >
                  <ZoomOut size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Уменьшить превью</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "mr-1 h-6 w-6 cursor-pointer",
                    !canIncreaseSize && "cursor-not-allowed opacity-50",
                  )}
                  onClick={handleIncreaseSize}
                  disabled={!canIncreaseSize}
                >
                  <ZoomIn size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Увеличить превью</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
        {rightEndSlot}
      </div>
    </div>
  )
}
