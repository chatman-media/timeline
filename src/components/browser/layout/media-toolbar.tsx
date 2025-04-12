import {
  File,
  Filter,
  Folder,
  Grid,
  Grid2x2,
  List,
  Mic,
  Monitor,
  SortDesc,
  Webcam,
  ZoomIn,
  ZoomOut,
} from "lucide-react"
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
  viewMode: "list" | "grid" | "thumbnails" | "metadata"
  onViewModeChange: (mode: "list" | "grid" | "thumbnails" | "metadata") => void
  onImport: () => void
  onImportFile: () => void
  onImportFolder: () => void
  onSort: (sortBy: string) => void
  onFilter: (filterType: string) => void
  onRecord?: () => void
  onRecordCamera?: () => void
  onRecordScreen?: () => void
  onRecordVoice?: () => void
  onIncreaseSize?: () => void
  onDecreaseSize?: () => void
  canIncreaseSize?: boolean
  canDecreaseSize?: boolean
  currentSize?: number
}

export function MediaToolbar({
  viewMode = "thumbnails",
  onViewModeChange,
  onImport,
  onImportFile,
  onImportFolder,
  onSort,
  onFilter,
  onRecord = () => {},
  onRecordCamera = () => {},
  onRecordScreen = () => {},
  onRecordVoice = () => {},
  onIncreaseSize = () => {},
  onDecreaseSize = () => {},
  canIncreaseSize = true,
  canDecreaseSize = true,
  currentSize = 100,
}: MediaToolbarProps) {
  return (
    <div className="flex items-center justify-between px-2 py-2 border-b">
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="w-6 h-6 mr-1 cursor-pointer">
              <SortDesc size={16} />
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
            <Button variant="ghost" size="sm" className="w-6 h-6 cursor-pointer">
              <Filter size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onFilter("all")}>Все файлы</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onFilter("video")}>Видео</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onFilter("audio")}>Аудио</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onFilter("image")}>Изображения</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
