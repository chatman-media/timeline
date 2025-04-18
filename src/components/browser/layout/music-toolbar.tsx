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
  SortDesc,
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

interface MusicToolbarProps {
  viewMode: "list" | "grid" | "thumbnails"
  onViewModeChange: (mode: "list" | "grid" | "thumbnails") => void
  onImport: () => void
  onImportFile: () => void
  onImportFolder: () => void
  onSort: (sortBy: string) => void
  onFilter: (filterType: string) => void
  onChangeOrder?: () => void
  sortOrder?: "asc" | "desc"
  currentSortBy?: string
  currentFilterType?: string
}

/**
 * Компонент для управления музыкальными инструментами
 *
 * @param viewMode - Режим просмотра (список, сетка, миниатюры)
 * @param onViewModeChange - Callback для изменения режима просмотра
 * @param onImport - Callback для импорта файлов
 * @param onImportFile - Callback для импорта файлов
 * @param onImportFolder - Callback для импорта папок
 * @param onSort - Callback для сортировки
 * @param onFilter - Callback для фильтрации
 * @param onChangeOrder - Callback для изменения порядка сортировки
 * @param sortOrder - Порядок сортировки (возрастание, убывание)
 * @param currentSortBy - Текущий параметр сортировки
 * @param currentFilterType - Текущий тип фильтра
 */
export function MusicToolbar({
  viewMode = "thumbnails",
  onViewModeChange,
  onImport,
  onImportFile,
  onImportFolder,
  onSort,
  onFilter,
  onChangeOrder = () => {},
  sortOrder = "desc",
  currentSortBy = "date",
  currentFilterType = "all",
}: MusicToolbarProps) {
  // Внутренний стейт для управления текущим выбором
  const [internalViewMode, setInternalViewMode] = useState(viewMode)
  const [internalSortBy, setInternalSortBy] = useState(currentSortBy)
  const [internalFilterType, setInternalFilterType] = useState(currentFilterType)

  // Обновляем внутренний стейт, если пропсы изменились
  useEffect(() => {
    setInternalViewMode(viewMode)
  }, [viewMode])

  useEffect(() => {
    setInternalSortBy(currentSortBy)
  }, [currentSortBy])

  useEffect(() => {
    setInternalFilterType(currentFilterType)
  }, [currentFilterType])

  // Функции для обработки изменений
  const handleViewModeChange = (mode: "list" | "grid" | "thumbnails") => {
    setInternalViewMode(mode)
    onViewModeChange(mode)
  }

  const handleSort = (sortBy: string) => {
    setInternalSortBy(sortBy)
    onSort(sortBy)
  }

  const handleFilter = (filterType: string) => {
    setInternalFilterType(filterType)
    onFilter(filterType)
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
      </div>

      <div className="flex items-end gap-2">
        {/* Кнопки режима отображения */}
        <TooltipProvider>
          <div className="flex rounded-md overflow-hidden">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-6 w-6 mr-1 cursor-pointer",
                    internalViewMode === "list" && "bg-secondary text-secondary-foreground",
                  )}
                  onClick={() => handleViewModeChange("list")}
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
                    internalViewMode === "grid" && "bg-secondary text-secondary-foreground",
                  )}
                  onClick={() => handleViewModeChange("grid")}
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
                    internalViewMode === "thumbnails" && "bg-secondary text-secondary-foreground",
                  )}
                  onClick={() => handleViewModeChange("thumbnails")}
                >
                  <Grid2x2 size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Предпросмотр</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>

        {/* Sort Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="w-6 h-6 mr-1 cursor-pointer">
              <SortDesc size={16} />
            </Button>
          </DropdownMenuTrigger>
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

        {/* Filter Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="w-6 h-6 cursor-pointer">
              <Filter size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleFilter("all")}>
              <div className="flex items-center gap-2">
                {internalFilterType === "all" && <Check className="h-4 w-4" />}
                <span>Все файлы</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleFilter("mp3")}>
              <div className="flex items-center gap-2">
                {internalFilterType === "mp3" && <Check className="h-4 w-4" />}
                <span>MP3</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleFilter("wav")}>
              <div className="flex items-center gap-2">
                {internalFilterType === "wav" && <Check className="h-4 w-4" />}
                <span>WAV</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleFilter("ogg")}>
              <div className="flex items-center gap-2">
                {internalFilterType === "ogg" && <Check className="h-4 w-4" />}
                <span>OGG</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

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
