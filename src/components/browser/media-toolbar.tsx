import React, { useState } from "react"
import { Button } from "../ui/button"
import { Filter, SortDesc, Grid2x2, List, Grid, ChevronDown, Upload } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"

interface MediaToolbarProps {
  viewMode: "list" | "grid" | "thumbnails" | "metadata"
  onViewModeChange: (mode: "list" | "grid" | "thumbnails" | "metadata") => void
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

      <div className="flex items-center space-x-2">
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
            <DropdownMenuItem onClick={() => onViewModeChange("metadata")}>
              <Grid className="mr-2 h-4 w-4" />
              Metadata View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onViewModeChange("thumbnails")}>
              <Grid2x2 className="mr-2 h-4 w-4" />
              Thumbnail View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onViewModeChange("list")}>
              <List className="mr-2 h-4 w-4" />
              List View
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sort Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-gray-400 hover:text-gray-100 hover:bg-gray-700"
            >
              <SortDesc size={16} />
              <ChevronDown size={12} className="ml-1" />
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
              className="h-8 text-gray-400 hover:text-gray-100 hover:bg-gray-700"
            >
              <Filter size={16} />
              <ChevronDown size={12} className="ml-1" />
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
