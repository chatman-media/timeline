import dayjs from "dayjs"
import duration from "dayjs/plugin/duration"
import timezone from "dayjs/plugin/timezone"
import utc from "dayjs/plugin/utc"

import { LoadingState } from "@/components/layout/loading-state"
import { NoFiles } from "@/components/layout/no-files"
import { MediaEditor } from "@/components/media-editor"
import { useMedia } from "@/hooks/use-media"

// Инициализируем плагин duration
dayjs.extend(duration)
dayjs.extend(utc)
dayjs.extend(timezone)

export default function Home() {
  const {
    isLoading,
    hasMedia,
  } = useMedia()

  return (
    <div className="min-h-screen font-[family-name:var(--font-geist-sans)] relative bg-white dark:bg-[#1b1a1f]">
      {isLoading ? <LoadingState /> : hasMedia ? <MediaEditor /> : <NoFiles />}
    </div>
  )
}
