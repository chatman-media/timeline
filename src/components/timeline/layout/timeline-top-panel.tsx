import {
  ArrowUpDown,
  Minus,
  MoveHorizontal,
  Plus,
  Scissors,
  SquareMousePointer,
  Trash2,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Track } from "@/types/media"

interface TimelineTopPanelProps {
  isTrashActive?: boolean
  isCutActive?: boolean
  isAbleToScale?: boolean
  isAbleToScaleUp?: boolean
  isAbleToScaleDown?: boolean
  // увеличить по размеру шкалы времени
  isAbleToFitToTracks?: boolean
  tracks: Track[]
  deleteTrack: () => void
  cutTrack: () => void
  handleScaleDecrease: () => void
  handleScaleIncrease: () => void
  handleSliderChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  sliderValue: number
  maxScale: number
}

const ICON_STYLE =
  "flex rounded-sm items-center justify-center w-8 h-8 hover:bg-[#dddbdd] dark:hover:bg-[#45444b] cursor-pointer"

export function TimelineTopPanel({
  isTrashActive = false,
  isCutActive = false,
  isAbleToScale = false,
  isAbleToScaleUp = false,
  isAbleToScaleDown = false,
  isAbleToFitToTracks = false,
  deleteTrack,
  cutTrack,
  handleScaleDecrease,
  handleScaleIncrease,
  handleSliderChange,
  sliderValue,
  maxScale = 2000,
}: TimelineTopPanelProps) {
  return (
    <div className="flex-shrink-0">
      <div className="flex items-center justify-between px-2 py-1 border-b border-border">
        <div className="flex items-center gap-1">
          {/* <Popover>
            <PopoverTrigger asChild>
              <Button
                className="cursor-pointer rounded-sm hover:bg-[#45444b] w-8 h-8"
                variant="ghost"
                size="icon"
                title="Макет"
              >
                <LayoutTemplate size={20} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-2" sideOffset={0}>
              <LayoutPreviews
                onLayoutChange={() => {}}
                layoutMode={'default'}
                hasExternalDisplay={false}
              />
            </PopoverContent>
          </Popover> */}

          {/* Layout */}
          <button
            onClick={() => {}}
            className="flex rounded-sm items-center justify-center w-8 h-8 opacity-50"
          >
            <SquareMousePointer size={16} />
          </button>
          {/* Delete track */}
          <button
            onClick={() => {
              // delete track
              deleteTrack()
            }}
            className={cn(ICON_STYLE, !isTrashActive && "pointer-events-none opacity-50")}
          >
            <Trash2 size={16} />
          </button>

          {/* Cut track */}
          <button
            onClick={() => {
              cutTrack()
            }}
            className={cn(ICON_STYLE, !isCutActive && "pointer-events-none opacity-50")}
          >
            <Scissors size={16} className="rotate-270" />
          </button>
        </div>
        <div className="flex items-center gap-2 p-2 z-10">
          {/* Двунаправленная стрелка */}
          <button
            className={cn(
              ICON_STYLE,
              "relative flex items-center justify-center",
              !isAbleToFitToTracks && "pointer-events-none opacity-50",
            )}
          >
            <MoveHorizontal size={16} />
          </button>
          <button
            onClick={handleScaleDecrease}
            className={cn(
              "w-4 h-4 flex items-center justify-center rounded-full bg-gray-800 hover:bg-[#45444b] text-gray-200 border-1 border-white cursor-pointer",
              !isAbleToScaleDown && "pointer-events-none opacity-50",
            )}
          >
            <Minus size={12} />
          </button>

          {/* Scale slider */}
          <div
            className={cn(
              "relative w-24 h-1 rounded-full bg-gray-800 border border-white",
              !isAbleToScale && "pointer-events-none opacity-50",
            )}
          >
            <div
              className="absolute left-0 top-0 h-full bg-white rounded-full"
              style={{ width: `${sliderValue}%` }}
            />
            <input
              type="range"
              min={2}
              max={maxScale}
              value={String(sliderValue)}
              onChange={handleSliderChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>

          <button
            onClick={handleScaleIncrease}
            className={cn(
              "w-4 h-4 flex items-center justify-center rounded-full bg-gray-800 hover:bg-[#45444b] text-gray-200 border-1 border-white cursor-pointer",
              !isAbleToScaleUp && "pointer-events-none opacity-50",
            )}
          >
            <Plus size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}
