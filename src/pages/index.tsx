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
  const { isLoading, currentTime, hasVideos } = useMedia()

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
            {formatTimeWithMilliseconds(currentTime, false, false, false)}
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
