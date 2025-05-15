import {
  LayoutTemplate,
  Minus,
  MoveHorizontal,
  Plus,
  Redo2,
  Scissors,
  SquareMousePointer,
  Trash2,
  Undo2,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"
import { CompositeTrackButton } from "@/media-editor/timeline/components/composite-track-button"
import { useTimeline } from "@/media-editor/timeline/services"
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
  const { t } = useTranslation()
  const { activeSector } = useTimeline()
  return (
    <div className="flex-shrink-0">
      <div className="border-border flex items-center justify-between border-b px-2 py-1">
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
            className="flex h-8 w-8 items-center justify-center rounded-sm opacity-50"
            title={t("timeline.toolbar.layout")}
          >
            <LayoutTemplate size={16} />
          </button>

          {/* Mouse pointer */}
          <button
            onClick={() => {}}
            className="flex h-8 w-8 items-center justify-center rounded-sm opacity-50"
            title={t("timeline.toolbar.pointer")}
          >
            <SquareMousePointer size={16} />
          </button>

          {/* Back */}
          <button
            onClick={() => {}}
            className="flex h-8 w-8 items-center justify-center rounded-sm opacity-50"
            title={t("timeline.toolbar.undo")}
          >
            <Undo2 size={16} />
          </button>

          {/* Forward */}
          <button
            onClick={() => {}}
            className="flex h-8 w-8 items-center justify-center rounded-sm opacity-50"
            title={t("timeline.toolbar.redo")}
          >
            <Redo2 size={16} />
          </button>

          {/* Delete track */}
          <button
            onClick={() => {
              // delete track
              deleteTrack()
            }}
            className={cn(ICON_STYLE, !isTrashActive && "pointer-events-none opacity-50")}
            title={t("timeline.toolbar.delete")}
          >
            <Trash2 size={16} />
          </button>

          {/* Cut track */}
          <button
            onClick={() => {
              cutTrack()
            }}
            className={cn(ICON_STYLE, !isCutActive && "pointer-events-none opacity-50")}
            title={t("timeline.toolbar.cut")}
          >
            <Scissors size={16} className="rotate-270" />
          </button>

          {/* Composite Track Button */}
          <CompositeTrackButton sector={activeSector} className={ICON_STYLE} />
        </div>
        <div className="z-10 flex items-center gap-2 p-2">
          {/* Двунаправленная стрелка */}
          <button
            onClick={() => {
              // Вызываем функцию fitToScreen через родительский компонент
              if (isAbleToFitToTracks) {
                // Получаем контейнер таймлайна
                const timelineContainer = document.querySelector(".timeline-container")
                if (timelineContainer) {
                  // Получаем ширину контейнера
                  const width = timelineContainer.clientWidth
                  console.log(`MoveHorizontal button clicked, container width: ${width}px`)

                  // Отправляем событие FIT_TO_SCREEN с шириной контейнера
                  window.dispatchEvent(
                    new CustomEvent("fit-to-screen", {
                      detail: { width },
                    }),
                  )
                }
              }
            }}
            className={cn(
              ICON_STYLE,
              "relative flex items-center justify-center",
              !isAbleToFitToTracks && "pointer-events-none opacity-50",
            )}
            title={t("timeline.toolbar.fitToScreen")}
          >
            <MoveHorizontal size={16} />
          </button>
          <button
            onClick={handleScaleDecrease}
            className={cn(
              "flex h-4 w-4 cursor-pointer items-center justify-center rounded-full border-1 border-white bg-gray-800 text-gray-200 hover:bg-[#45444b]",
              !isAbleToScaleDown && "pointer-events-none opacity-50",
            )}
            title={t("timeline.toolbar.zoomOut")}
          >
            <Minus size={12} />
          </button>

          {/* Scale slider */}
          <div
            className={cn(
              "relative h-1 w-24 rounded-full border border-white bg-gray-800",
              !isAbleToScale && "pointer-events-none opacity-50",
            )}
          >
            <div
              className="absolute top-0 left-0 h-full rounded-full bg-white"
              style={{ width: `${sliderValue}%` }}
            />
            <input
              type="range"
              min={2}
              max={maxScale}
              value={String(sliderValue)}
              onChange={handleSliderChange}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              aria-label={t("timeline.zoom.fitToScreen")}
            />
          </div>

          <button
            onClick={handleScaleIncrease}
            className={cn(
              "flex h-4 w-4 cursor-pointer items-center justify-center rounded-full border-1 border-white bg-gray-800 text-gray-200 hover:bg-[#45444b]",
              !isAbleToScaleUp && "pointer-events-none opacity-50",
            )}
            title={t("timeline.toolbar.zoomIn")}
          >
            <Plus size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}
