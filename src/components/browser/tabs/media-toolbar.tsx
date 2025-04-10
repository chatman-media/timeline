import React from "react"
import { Button } from "../../ui/button"
import { 
  Filter, 
  SortDesc, 
  Grid2x2, 
  List, 
  Grid, 
  ChevronDown, 
  Upload,
  LayoutGrid,
  Check
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu"

interface MediaToolbarProps {
  viewMode: "list" | "grid" | "thumbnails" | "metadata"
  onViewModeChange: (mode: "list" | "grid" | "thumbnails" | "metadata") => void
  onImport: () => void
  onSort: (sortBy: string) => void
  onFilter: (filterType: string) => void
  onGroup: (groupBy: string) => void
  currentSort: string
  currentGroup: string
  currentFilter: string
}

export function MediaToolbar({
  viewMode = "thumbnails",
  onViewModeChange,
  onImport,
  onSort,
  onFilter,
  onGroup,
  currentSort = "name",
  currentGroup = "none",
  currentFilter = "all"
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

      <div className="flex items-center space-x-2">
        {/* View Mode Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-gray-400 hover:text-gray-100 hover:bg-gray-700"
            >
              <Grid2x2 size={16} />
              <ChevronDown size={12} className="ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onViewModeChange("metadata")} className="flex justify-between">
              <div className="flex items-center">
                <Grid className="mr-2 h-4 w-4" />
                Metadata View
              </div>
              {viewMode === "metadata" && <Check className="h-4 w-4 ml-2" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onViewModeChange("thumbnails")} className="flex justify-between">
              <div className="flex items-center">
                <Grid2x2 className="mr-2 h-4 w-4" />
                Thumbnail View
              </div>
              {viewMode === "thumbnails" && <Check className="h-4 w-4 ml-2" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onViewModeChange("list")} className="flex justify-between">
              <div className="flex items-center">
                <List className="mr-2 h-4 w-4" />
                List View
              </div>
              {viewMode === "list" && <Check className="h-4 w-4 ml-2" />}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sort Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-gray-400 hover:text-gray-100 hover:bg-gray-700 flex items-center"
            >
              <SortDesc size={16} />
              <ChevronDown size={12} className="ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onSort("name")} className="flex justify-between">
              <span>По имени</span>
              {currentSort === "name" && <Check className="h-4 w-4 ml-2" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSort("duration")} className="flex justify-between">
              <span>По длине</span>
              {currentSort === "duration" && <Check className="h-4 w-4 ml-2" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSort("type")} className="flex justify-between">
              <span>По типу</span>
              {currentSort === "type" && <Check className="h-4 w-4 ml-2" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSort("creationDate")} className="flex justify-between">
              <span>По дате создания</span>
              {currentSort === "creationDate" && <Check className="h-4 w-4 ml-2" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSort("importDate")} className="flex justify-between">
              <span>По дате импорта</span>
              {currentSort === "importDate" && <Check className="h-4 w-4 ml-2" />}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Group By Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-gray-400 hover:text-gray-100 hover:bg-gray-700 flex items-center"
            >
              <LayoutGrid size={16} />
              <ChevronDown size={12} className="ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onGroup("none")} className="flex justify-between">
              <span>Без группировки</span>
              {currentGroup === "none" && <Check className="h-4 w-4 ml-2" />}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onGroup("type")} className="flex justify-between">
              <span>По типу</span>
              {currentGroup === "type" && <Check className="h-4 w-4 ml-2" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onGroup("creationDate")} className="flex justify-between">
              <span>По дате создания</span>
              {currentGroup === "creationDate" && <Check className="h-4 w-4 ml-2" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onGroup("duration")} className="flex justify-between">
              <span>По длине</span>
              {currentGroup === "duration" && <Check className="h-4 w-4 ml-2" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onGroup("importDate")} className="flex justify-between">
              <span>По дате импорта</span>
              {currentGroup === "importDate" && <Check className="h-4 w-4 ml-2" />}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Filter Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-gray-400 hover:text-gray-100 hover:bg-gray-700"
            >
              <Filter size={16} />
              <ChevronDown size={12} className="ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onFilter("all")} className="flex justify-between">
              <span>Все файлы</span>
              {currentFilter === "all" && <Check className="h-4 w-4 ml-2" />}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onFilter("video")} className="flex justify-between">
              <span>Видео</span>
              {currentFilter === "video" && <Check className="h-4 w-4 ml-2" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onFilter("audio")} className="flex justify-between">
              <span>Аудио</span>
              {currentFilter === "audio" && <Check className="h-4 w-4 ml-2" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onFilter("image")} className="flex justify-between">
              <span>Изображения</span>
              {currentFilter === "image" && <Check className="h-4 w-4 ml-2" />}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onFilter("favorites")} className="flex justify-between">
              <span>Избранное</span>
              {currentFilter === "favorites" && <Check className="h-4 w-4 ml-2" />}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}