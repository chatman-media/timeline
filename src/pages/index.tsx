import dayjs from "dayjs"
import duration from "dayjs/plugin/duration"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"

import { CompilationSettings } from "@/components/compilation-settings"
import { useMedia } from "@/hooks/use-media"
import { Timeline } from "@/components/timeline"
import { ThemeToggle } from "@/components/theme-toggle"
import { ActiveVideo } from "@/components/active-video"
import { formatTimeWithMilliseconds } from "@/lib/utils"

// Инициализируем плагин duration
dayjs.extend(duration)
dayjs.extend(utc)
dayjs.extend(timezone)

export default function Home() {
  const { isLoading, currentTime, hasVideos, play, isPlaying } = useMedia()

  return (
    <div className="min-h-screen font-[family-name:var(--font-geist-sans)] relative bg-white dark:bg-[#0A0A0A]">
      {isLoading
        ? (
          <div className="flex items-center justify-center h-screen">
            <div className="text-gray-600 dark:text-gray-400">Загрузка медиа...</div>
          </div>
        )
        : !hasVideos
        ? (
          <div className="flex items-center justify-center h-screen">
            <div className="text-gray-600 dark:text-gray-400">Файлы не найдены</div>
          </div>
        )
        : (
          <>
            <div className="flex gap-16 w-full px-12 sm:px-16 py-8">
              <div className="flex flex-col gap-4 w-[10%]">
                <div className="text-sm text-gray-900 dark:text-gray-100">
                  {formatTimeWithMilliseconds(currentTime, false, true, true)}
                </div>
                <div>
                  <button
                    onClick={play}
                    className="px-3 py-1 text-sm rounded bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
                  >
                    {isPlaying ? "Пауза" : "Play"}
                  </button>
                </div>
              </div>
              <CompilationSettings />
              <div className="w-[40%] sticky top-4 bg-gray-50 dark:bg-[#111111] p-4 border border-gray-200 dark:border-gray-800">
                <ActiveVideo />
              </div>
            </div>
            <div className="flex gap-16 w-full px-12 sm:px-16">
              <Timeline />
            </div>
            <ThemeToggle />
          </>
        )}
    </div>
  )
}
