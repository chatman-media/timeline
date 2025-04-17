import {
  ArrowDownUp,
  ArrowUpDown,
  Check,
  File,
  Filter,
  Folder,
  Grid,
  Grid2x2,
  List,
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
          className="text-xs flex items-center gap-1 cursor-pointer px-1"
          onClick={onImport}
        >
          {/* <Import size={12} /> */}
          <span className="text-xs px-2">Импорт</span>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-500 p-1 rounded-sm"
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
                  className="cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-500 p-1 rounded-sm"
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
          className="text-xs flex items-center gap-1 cursor-pointer px-1"
          onClick={onRecord}
        >
          <span className="text-xs px-2">Запись</span>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-500 p-1 rounded-sm"
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
                  className="cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-500 p-1 rounded-sm"
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
                  className="cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-500 p-1 rounded-sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRecordVoice()
                  }}
                >
                  <Mic size={12} />
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
          <div className="flex rounded-md overflow-hidden mr-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-6 w-6 mr-1 ml-3 cursor-pointer",
                    viewMode === "list" ? "bg-gray-300 dark:bg-gray-700" : "",
                  )}
                  onClick={() => onViewModeChange("list")}
                >
                  <List size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Список</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-6 w-6 mr-1 cursor-pointer",
                    viewMode === "grid" ? "bg-gray-300 dark:bg-gray-700" : "",
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
                    "h-6 w-6 mr-1 cursor-pointer",
                    viewMode === "thumbnails" ? "bg-gray-300 dark:bg-gray-700" : "",
                  )}
                  onClick={() => onViewModeChange("thumbnails")}
                >
                  <Grid2x2 size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Миниатюры</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>

        {/* Кнопки изменения размера */}
        <TooltipProvider>
          <div className="flex rounded-md overflow-hidden mr-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-6 w-6 mr-1 cursor-pointer",
                    !canDecreaseSize && "opacity-50 cursor-not-allowed",
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
                    "h-6 w-6 mr-1 cursor-pointer",
                    !canIncreaseSize && "opacity-50 cursor-not-allowed",
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
                  <Button variant="ghost" size="icon" className="w-6 h-6 cursor-pointer">
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
                <DropdownMenuItem className="h-6 cursor-pointer" onClick={() => handleSort("duration")}>
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
                  <Button variant="ghost" size="icon" className="w-6 h-6 cursor-pointer">
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
                  <Button variant="ghost" size="icon" className="w-6 h-6 cursor-pointer">
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
