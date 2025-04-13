import dayjs from "dayjs"
import duration from "dayjs/plugin/duration"
import timezone from "dayjs/plugin/timezone"
import utc from "dayjs/plugin/utc"

import { MediaEditor } from "@/components/layout/media-editor"

// Инициализируем плагин duration
dayjs.extend(duration)
dayjs.extend(utc)
dayjs.extend(timezone)

export default function Home() {
  return (
    <div className="min-h-screen font-[family-name:var(--font-geist-sans)] relative bg-[#f7f8f9] dark:bg-[#1b1a1f]">
      <MediaEditor />
    </div>
  )
}
