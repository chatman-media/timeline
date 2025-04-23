import {
  ArrowDownUp,
  ArrowUpDown,
  Check,
  File,
  Filter,
  Folder,
  Grid2x2,
  List,
  ListFilterPlus,
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
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface MusicToolbarProps {
  viewMode: "list" | "thumbnails"
  onViewModeChange: (mode: "list" | "thumbnails") => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  onImport: () => void
  onImportFile: () => void
  onImportFolder: () => void
  onSort: (sortBy: string) => void
  onFilter: (filterType: string) => void
  onChangeOrder?: () => void
  onGroupBy?: (groupBy: "none" | "artist" | "genre" | "album") => void
  sortOrder?: "asc" | "desc"
  currentSortBy?: string
  currentFilterType?: string
  currentGroupBy?: string
  availableExtensions: string[]
}

/**
 * Компонент для управления музыкальными инструментами
 *
 * @param viewMode - Режим просмотра (список, сетка, миниатюры)
 * @param onViewModeChange - Callback для изменения режима просмотра
 * @param searchQuery - Текущий запрос поиска
 * @param setSearchQuery - Callback для установки запроса поиска
 * @param onImport - Callback для импорта файлов
 * @param onImportFile - Callback для импорта файлов
 * @param onImportFolder - Callback для импорта папок
 * @param onSort - Callback для сортировки
 * @param onFilter - Callback для фильтрации
 * @param onChangeOrder - Callback для изменения порядка сортировки
 * @param onGroupBy - Callback для группировки
 * @param sortOrder - Порядок сортировки (возрастание, убывание)
 * @param currentSortBy - Текущий параметр сортировки
 * @param currentFilterType - Текущий тип фильтра
 * @param currentGroupBy - Текущая группировка
 */
export function MusicToolbar({
  viewMode = "thumbnails",
  onViewModeChange,
  searchQuery = "",
  setSearchQuery,
  onImport,
  onImportFile,
  onImportFolder,
  onSort,
  onFilter,
  onChangeOrder = () => {},
  onGroupBy = () => {},
  sortOrder = "desc",
  currentSortBy = "date",
  currentFilterType = "all",
  currentGroupBy = "none",
  availableExtensions,
}: MusicToolbarProps) {
  // Внутренний стейт для управления текущим выбором
  const [internalViewMode, setInternalViewMode] = useState(viewMode)
  const [internalGroupBy, setInternalGroupBy] = useState(currentGroupBy)
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

  useEffect(() => {
    setInternalGroupBy(currentGroupBy)
  }, [currentGroupBy])

  // Функции для обработки изменений
  const handleViewModeChange = (mode: "list" | "thumbnails") => {
    setInternalViewMode(mode)
    onViewModeChange(mode)
  }

  const handleSort = (sortBy: string) => {
    onSort(sortBy)
  }

  const handleFilter = (filterType: string) => {
    setInternalFilterType(filterType)
    onFilter(filterType)
  }

  const handleGroupBy = (groupBy: "none" | "artist" | "genre" | "album") => {
    onGroupBy(groupBy)
  }

  return (
    <div className="flex items-center justify-between px-2 py-2">
      <div className="flex w-[calc(100%-100px)] items-center gap-2">
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
                  className="cursor-pointer rounded-sm p-1 hover:bg-[#dddbdd] dark:hover:bg-[#dddbdd]/25"
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
                  className="cursor-pointer rounded-sm p-1 hover:bg-[#dddbdd] dark:hover:bg-[#dddbdd]/25"
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

        <Input
          type="search"
          placeholder="Поиск"
          className="mr-5 h-6 w-full max-w-[400px] rounded-sm border border-gray-300 text-xs outline-none focus:border-gray-400 focus:ring-0 focus-visible:ring-0 dark:border-gray-600 dark:focus:border-gray-500"
          style={{
            backgroundColor: "transparent",
          }}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="flex items-end gap-2">
        {/* Кнопки режима отображения */}
        <TooltipProvider>
          <div className="flex overflow-hidden rounded-md">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "mr-1 h-6 w-6 cursor-pointer",
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
                    "mr-1 h-6 w-6 cursor-pointer",
                    internalViewMode === "thumbnails" && "bg-secondary text-secondary-foreground",
                  )}
                  onClick={() => handleViewModeChange("thumbnails")}
                >
                  <Grid2x2 size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Обложки</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>

        {/* Sort Dropdown */}
        <TooltipProvider>
          <Tooltip>
            <DropdownMenu>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm"
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
                <DropdownMenuItem
                  className="h-6 cursor-pointer"
                  onClick={() => handleSort("title")}
                >
                  <div className="flex items-center gap-2">
                    {internalSortBy === "title" && <Check className="h-4 w-4" />}
                    <span>По заголовку</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="h-6 cursor-pointer"
                  onClick={() => handleSort("artist")}
                >
                  <div className="flex items-center gap-2">
                    {internalSortBy === "artist" && <Check className="h-4 w-4" />}
                    <span>По артисту</span>
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
                  <Button variant="ghost" size="sm"
                                      className={cn(
                                        "h-6 w-6 cursor-pointer",
                                        internalFilterType !== "all" ? "bg-[#dddbdd] dark:bg-[#45444b]" : "",
                                      )}
                  >
                    <Filter size={16} />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Фильтр</TooltipContent>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleFilter("all")}>
                  <div className="flex items-center gap-2">
                    {internalFilterType === "all" && <Check className="h-4 w-4" />}
                    <span>Все файлы</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {availableExtensions.map((extension) => (
                  <DropdownMenuItem key={extension} onClick={() => handleFilter(extension)}>
                    <div className="flex items-center gap-2">
                      {internalFilterType === extension && <Check className="h-4 w-4" />}
                      <span>{extension.toUpperCase()}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
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
                <DropdownMenuItem onClick={() => handleGroupBy("artist")}>
                  <div className="flex items-center gap-2">
                    {internalGroupBy === "artist" && <Check className="h-4 w-4" />}
                    <span>По артисту</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleGroupBy("genre")}>
                  <div className="flex items-center gap-2">
                    {internalGroupBy === "genre" && <Check className="h-4 w-4" />}
                    <span>По жанру</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleGroupBy("album")}>
                  <div className="flex items-center gap-2">
                    {internalGroupBy === "album" && <Check className="h-4 w-4" />}
                    <span>По альбому</span>
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
