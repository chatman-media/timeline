import dayjs from "dayjs"
import duration from "dayjs/plugin/duration"
import timezone from "dayjs/plugin/timezone"
import utc from "dayjs/plugin/utc"

import { MediaEditor } from "@/components/media-editor"

// Инициализируем плагин duration
dayjs.extend(duration)
dayjs.extend(utc)
dayjs.extend(timezone)

export default function Home() {
  return (
    <div className="min-h-screen font-[family-name:var(--font-geist-sans)] relative bg-white dark:bg-[#1b1a1f]">
      <MediaEditor />
    </div>
  )
}
