import { Minus, Plus } from "lucide-react"

const ICON_SIZE = 2 // размер в единицах измерения tailwind (2 = w-2/h-2)

interface TrackControlsProps {
  onAddToTrack: (e: React.MouseEvent) => void
  onRemoveFromTrack: (e: React.MouseEvent) => void
  iconSize?: number
}

export function TrackControls(
  { onAddToTrack, onRemoveFromTrack, iconSize = ICON_SIZE }: TrackControlsProps,
) {
  return (
    <div className="relative w-8">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          className="p-1 ml-1 rounded bg-white/90 hover:bg-white shadow-sm hover:shadow border border-gray-200 dark:bg-gray-800/90 dark:hover:bg-gray-800 dark:border-gray-700 transition-all duration-200 cursor-pointer"
          title="Добавить"
          onClick={onAddToTrack}
        >
          <Plus
            className={`w-${iconSize} h-${iconSize} text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200`}
          />
        </button>
        <button
          className="p-1 ml-1 rounded bg-white/90 hover:bg-white shadow-sm hover:shadow border border-gray-200 dark:bg-gray-800/90 dark:hover:bg-gray-800 dark:border-gray-700 transition-all duration-200 cursor-pointer"
          title="Скрыть из медиатеки"
          onClick={onRemoveFromTrack}
        >
          <Minus
            className={`w-${iconSize} h-${iconSize} text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200`}
          />
        </button>
      </div>
    </div>
  )
}
