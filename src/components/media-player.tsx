import { CompilationSettings } from "./compilation-settings"
import { Timeline } from "./timeline"
import { ThemeToggle } from "./theme-toggle"
import { ActiveVideo } from "./active-video"
import { formatTimeWithMilliseconds } from "@/lib/utils"

interface MediaPlayerProps {
  currentTime: number
  play: () => void
  isPlaying: boolean
  activeCamera: string
}

export function MediaPlayer({ currentTime, play, isPlaying, activeCamera }: MediaPlayerProps) {
  return (
    <>
      <div className="flex gap-8 w-full px-3 sm:px-13 py-2">
        <div className="flex flex-col gap-4 w-[15%]">
          <div className="text-sm text-gray-900 dark:text-gray-100">
            {formatTimeWithMilliseconds(currentTime, true, true, true)}
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={play}
              className="px-3 py-1 text-sm rounded bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              {isPlaying ? "Пауза" : "Play"}
            </button>
            <div className="flex flex-col text-xs text-gray-500 dark:text-gray-400">
              <span>Или нажмите P</span>
            </div>
            <div className="text-sm text-gray-900 dark:text-gray-100">
              Камера: {activeCamera}
            </div>
            <div className="flex flex-col text-xs text-gray-500 dark:text-gray-400">
              <span>Нажмите номер нужной камеры</span>
            </div>
          </div>
        </div>
        <CompilationSettings />
        <div className="w-[60%] sticky top-4 bg-gray-50 dark:bg-[#111111] p-4 border border-gray-200 dark:border-gray-800">
          <ActiveVideo />
        </div>
      </div>
      <div className="flex gap-16 w-full px-1 sm:px-1">
        <Timeline />
      </div>
      <ThemeToggle />
    </>
  )
}
