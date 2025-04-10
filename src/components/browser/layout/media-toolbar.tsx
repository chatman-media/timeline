import { ChevronDown, Filter, Grid, Grid2x2, List, SortDesc, Upload } from "lucide-react"
import React from "react"

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
  onSort: (sortBy: string) => void
  onFilter: (filterType: string) => void
}

export function MediaToolbar({
  viewMode = "thumbnails",
  onViewModeChange,
  onImport,
  onSort,
  onFilter,
}: MediaToolbarProps) {
  return (
    <div className="flex items-center justify-between px-2 py-1 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1b1a1f]">
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          className="text-xs flex items-center gap-1 h-8"
          onClick={onImport}
        >
          <Upload size={14} />
          <span>Импорт</span>
          <ChevronDown size={14} />
        </Button>
      </div>

      <div className="flex items-center space-x-1">
        {/* Кнопки переключения режимов просмотра */}
        <TooltipProvider>
          <div className="flex rounded-md overflow-hidden mr-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-6 w-6 p-0",
                    viewMode === "list"
                      ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      : "text-gray-400 hover:text-gray-800 dark:hover:text-gray-200",
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
                    "h-6 w-6 p-1",
                    viewMode === "grid"
                      ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      : "text-gray-400 hover:text-gray-800 dark:hover:text-gray-200",
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
                    "h-6 w-6 p-1",
                    viewMode === "thumbnails"
                      ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      : "text-gray-400 hover:text-gray-800 dark:hover:text-gray-200",
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

        {/* Sort Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-gray-400 hover:text-gray-100 hover:bg-gray-700"
            >
              <SortDesc size={12} />
              <ChevronDown size={9} className="ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onSort("name")}>По имени</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSort("date")}>По дате</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSort("size")}>По размеру</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSort("duration")}>По длительности</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Filter Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-gray-400 hover:text-gray-100 hover:bg-gray-700"
            >
              <Filter size={12} />
              <ChevronDown size={9} className="ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onFilter("all")}>Все файлы</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onFilter("video")}>Видео</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onFilter("audio")}>Аудио</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onFilter("image")}>Изображения</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onFilter("favorites")}>Избранное</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
