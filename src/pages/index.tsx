import dayjs from "dayjs"
import duration from "dayjs/plugin/duration"
import timezone from "dayjs/plugin/timezone"
import utc from "dayjs/plugin/utc"

import { MediaEditor } from "@/media-editor"

// Инициализируем плагин duration
dayjs.extend(duration)
dayjs.extend(utc)
dayjs.extend(timezone)

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[#f7f8f9] font-[family-name:var(--font-geist-sans)] dark:bg-[#1b1a1f]">
      <MediaEditor />
    </div>
  )
}
