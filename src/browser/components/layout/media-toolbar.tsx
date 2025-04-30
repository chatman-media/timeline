import {
  ArrowDownUp,
  ArrowUpDown,
  Check,
  File,
  Filter,
  Folder,
  Grid,
  LayoutDashboard,
  LayoutList,
  ListFilterPlus,
  Mic,
  Monitor,
  SortDesc,
  Webcam,
  ZoomIn,
  ZoomOut,
} from "lucide-react"
import React, { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface MediaToolbarProps {
  viewMode: "list" | "grid" | "thumbnails"
  onViewModeChange: (mode: "list" | "grid" | "thumbnails") => void
  onImport: () => void
  onImportFile: () => void
  onImportFolder: () => void
  onSort: (sortBy: string) => void
  onFilter: (filterType: string) => void
  onGroupBy: (groupBy: string) => void
  onChangeOrder?: () => void
  sortOrder?: "asc" | "desc"
  currentSortBy?: string
  currentFilterType?: string
  currentGroupBy?: string
  onRecord?: () => void
  onRecordCamera?: () => void
  onRecordScreen?: () => void
  onRecordVoice?: () => void
  onIncreaseSize?: () => void
  onDecreaseSize?: () => void
  canIncreaseSize?: boolean
  canDecreaseSize?: boolean
}

/**
 * Компонент для управления медиа-инструментами
 *
 * @param viewMode - Режим просмотра (список, сетка, миниатюры)
 * @param onViewModeChange - Callback для изменения режима просмотра
 * @param onImport - Callback для импорта файлов
 * @param onImportFile - Callback для импорта файлов
 * @param onImportFolder - Callback для импорта папок
 * @param onSort - Callback для сортировки
 * @param onFilter - Callback для фильтрации
 * @param onGroupBy - Callback для группировки
 * @param onChangeOrder - Callback для изменения порядка сортировки
 * @param sortOrder - Порядок сортировки (возрастание, убывание)
 * @param currentSortBy - Текущий параметр сортировки
 * @param currentFilterType - Текущий тип фильтра
 * @param currentGroupBy - Текущий параметр группировки
 * @param onRecord - Callback для записи
 * @param onRecordCamera - Callback для записи с веб-камеры
 * @param onRecordScreen - Callback для записи экрана
 * @param onRecordVoice - Callback для записи голоса
 * @param onIncreaseSize - Callback для увеличения размера превью
 * @param onDecreaseSize - Callback для уменьшения размера превью
 * @param canIncreaseSize - Флаг, указывающий на возможность увеличения размера превью
 * @param canDecreaseSize - Флаг, указывающий на возможность уменьшения размера превью
 */
export function MediaToolbar({
  viewMode = "thumbnails",
  onViewModeChange,
  onImport,
  onImportFile,
  onImportFolder,
  onSort,
  onFilter,
  onGroupBy,
  onChangeOrder = () => {},
  sortOrder = "desc",
  currentSortBy = "date",
  currentFilterType = "all",
  currentGroupBy = "none",
  onRecord = () => {},
  onRecordCamera = () => {},
  onRecordScreen = () => {},
  onRecordVoice = () => {},
  onIncreaseSize = () => {},
  onDecreaseSize = () => {},
  canIncreaseSize = true,
  canDecreaseSize = true,
}: MediaToolbarProps) {
  // Внутренний стейт для управления текущим выбором
  const [internalSortBy, setInternalSortBy] = useState(currentSortBy)
  const [internalFilterType, setInternalFilterType] = useState(currentFilterType)
  const [internalGroupBy, setInternalGroupBy] = useState(currentGroupBy)
  // Синхронизация внутреннего стейта с пропсами
  useEffect(() => {
    setInternalSortBy(currentSortBy)
  }, [currentSortBy])

  useEffect(() => {
    setInternalFilterType(currentFilterType)
  }, [currentFilterType])

  // Обработчики для обновления стейта и вызова колбэков
  const handleSort = (sortBy: string) => {
    setInternalSortBy(sortBy)
    onSort(sortBy)
  }

  const handleFilter = (filterType: string) => {
    setInternalFilterType(filterType)
    onFilter(filterType)
  }

  const handleGroupBy = (groupBy: string) => {
    setInternalGroupBy(groupBy)
    onGroupBy(groupBy)
  }

  return (
    <div className="flex items-center justify-between px-2 py-2">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex cursor-pointer items-center gap-1 bg-[#dddbdd] px-1 text-xs hover:bg-[#d1d1d1] dark:bg-[#45444b] dark:hover:bg-[#dddbdd]/25"
          onClick={onImport}
        >
          <span className="px-2 text-xs">Импорт</span>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="cursor-pointer rounded-sm p-1 hover:bg-[#efefef] dark:hover:bg-[#dddbdd]/25"
                  onClick={(e) => {
                    e.stopPropagation()
                    onImportFile()
                  }}
                >
                  <File size={12} />
                </div>
              </TooltipTrigger>
              <TooltipContent>Добавить файлы</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="cursor-pointer rounded-sm p-1 hover:bg-[#efefef] dark:hover:bg-[#dddbdd]/25"
                  onClick={(e) => {
                    e.stopPropagation()
                    onImportFolder()
                  }}
                >
                  <Folder size={12} />
                </div>
              </TooltipTrigger>
              <TooltipContent>Добавить папку</TooltipContent>
            </Tooltip>
          </div>
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="flex cursor-pointer items-center gap-1 bg-[#dddbdd] px-1 text-xs hover:bg-[#d1d1d1] dark:bg-[#45444b] dark:hover:bg-[#dddbdd]/25"
          onClick={onRecord}
        >
          <span className="px-2 text-xs">Запись</span>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="cursor-pointer rounded-sm p-1 hover:bg-[#efefef] dark:hover:bg-[#dddbdd]/25"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRecordCamera()
                  }}
                >
                  <Webcam size={12} />
                </div>
              </TooltipTrigger>
              <TooltipContent>Запись с веб-камеры</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="cursor-pointer rounded-sm p-1 hover:bg-[#efefef] dark:hover:bg-[#dddbdd]/25"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRecordScreen()
                  }}
                >
                  <Monitor size={12} />
                </div>
              </TooltipTrigger>
              <TooltipContent>Запись экрана</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="cursor-pointer rounded-sm p-1 hover:bg-[#efefef] dark:hover:bg-[#dddbdd]/25"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRecordVoice()
                  }}
                >
                  <Mic size={12} className="" />
                </div>
              </TooltipTrigger>
              <TooltipContent>Запись голоса</TooltipContent>
            </Tooltip>
          </div>
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        {/* Кнопки переключения режимов просмотра */}
        <TooltipProvider>
          <div className="mr-2 flex overflow-hidden rounded-md">
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
          </div>
        </TooltipProvider>

        {/* Кнопки изменения размера 
        TODO: Добавить анимацию при наведении
        */}
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
                  onClick={onDecreaseSize}
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
                  onClick={onIncreaseSize}
                  disabled={!canIncreaseSize}
                >
                  <ZoomIn size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Увеличить превью</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>

        {/* Sort Dropdown */}
        <TooltipProvider>
          <Tooltip>
            <DropdownMenu>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-6 w-6 cursor-pointer",
                      internalSortBy !== "name" ? "bg-[#dddbdd] dark:bg-[#45444b]" : "",
                    )}
                  >
                    <SortDesc size={16} />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Сортировка</TooltipContent>
              <DropdownMenuContent className="space-y-1" align="end">
                <DropdownMenuItem className="h-6 cursor-pointer" onClick={() => handleSort("name")}>
                  <div className="flex items-center gap-2">
                    {internalSortBy === "name" && <Check className="h-4 w-4" />}
                    <span>По имени</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem className="h-6 cursor-pointer" onClick={() => handleSort("date")}>
                  <div className="flex items-center gap-2">
                    {internalSortBy === "date" && <Check className="h-4 w-4" />}
                    <span>По дате</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem className="h-6 cursor-pointer" onClick={() => handleSort("size")}>
                  <div className="flex items-center gap-2">
                    {internalSortBy === "size" && <Check className="h-4 w-4" />}
                    <span>По размеру</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="h-6 cursor-pointer"
                  onClick={() => handleSort("duration")}
                >
                  <div className="flex items-center gap-2">
                    {internalSortBy === "duration" && <Check className="h-4 w-4" />}
                    <span>По длительности</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </Tooltip>
        </TooltipProvider>

        {/* Filter Dropdown */}
        <TooltipProvider>
          <Tooltip>
            <DropdownMenu>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-6 w-6 cursor-pointer",
                      internalFilterType !== "all" ? "bg-[#dddbdd] dark:bg-[#45444b]" : "",
                    )}
                  >
                    <Filter size={16} />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Фильтры</TooltipContent>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleFilter("all")}>
                  <div className="flex items-center gap-2">
                    {internalFilterType === "all" && <Check className="h-4 w-4" />}
                    <span>Все файлы</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleFilter("video")}>
                  <div className="flex items-center gap-2">
                    {internalFilterType === "video" && <Check className="h-4 w-4" />}
                    <span>Видео</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFilter("audio")}>
                  <div className="flex items-center gap-2">
                    {internalFilterType === "audio" && <Check className="h-4 w-4" />}
                    <span>Аудио</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFilter("image")}>
                  <div className="flex items-center gap-2">
                    {internalFilterType === "image" && <Check className="h-4 w-4" />}
                    <span>Изображения</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </Tooltip>
        </TooltipProvider>

        {/* Group Dropdown */}
        <TooltipProvider>
          <Tooltip>
            <DropdownMenu>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-6 w-6 cursor-pointer",
                      internalGroupBy !== "none" ? "bg-[#dddbdd] dark:bg-[#45444b]" : "",
                    )}
                  >
                    <ListFilterPlus size={16} />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Группировка</TooltipContent>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleGroupBy("none")}>
                  <div className="flex items-center gap-2">
                    {internalGroupBy === "none" && <Check className="h-4 w-4" />}
                    <span>Не группировать</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleGroupBy("type")}>
                  <div className="flex items-center gap-2">
                    {internalGroupBy === "type" && <Check className="h-4 w-4" />}
                    <span>Тип</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleGroupBy("date")}>
                  <div className="flex items-center gap-2">
                    {internalGroupBy === "date" && <Check className="h-4 w-4" />}
                    <span>По дате создания</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleGroupBy("duration")}>
                  <div className="flex items-center gap-2">
                    {internalGroupBy === "duration" && <Check className="h-4 w-4" />}
                    <span>По длительности</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </Tooltip>
        </TooltipProvider>

        {/* Кнопка изменения порядка сортировки */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 cursor-pointer"
                onClick={onChangeOrder}
              >
                {sortOrder === "asc" ? <ArrowDownUp size={16} /> : <ArrowUpDown size={16} />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {sortOrder === "asc" ? "По убыванию" : "По возрастанию"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )
}
