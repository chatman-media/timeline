import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import dayjs, { extend } from "dayjs"
import duration from "dayjs/plugin/duration"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"

// Инициализируем плагин duration если еще не инициализирован
if (!dayjs.isDuration) {
  extend(duration)
}

// Инициализируем необходимые плагины
dayjs.extend(utc)
dayjs.extend(timezone)

export const formatDuration = (seconds: number, afterComa = 3): string => {
  const duration = dayjs.duration(seconds, "seconds")

  if (afterComa === 0) {
    return duration.format("mm:ss")
  }
  const ms = Math.floor((seconds % 1) * 1000)

  return `${duration.format("mm:ss")}:${ms.toString().padStart(afterComa, "0").substring(0, afterComa)}`
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTimeWithMilliseconds(
  seconds: number,
  showDate = false,
  showMilliseconds = true,
): string {
  // Конвертируем секунды в миллисекунды и создаем объект dayjs
  const time = dayjs(seconds * 1000)
    .utc()
    .tz(dayjs.tz.guess())

  const hours = time.hour()
  const minutes = time.minute()
  const secs = time.second()
  const ms = time.millisecond()

  const timeString = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${
    secs.toString().padStart(2, "0")
  }${showMilliseconds ? `.${ms.toString().padStart(3, "0")}` : ""}`

  if (showDate) {
    return `${time.format("DD.MM.YY")} ${timeString}`
  }
  return timeString
}

export function formatBitrate(bitrate: number | undefined): string {
  if (!bitrate) return "N/A"
  return `${(bitrate / 1_000_000).toFixed(1)} Mbps`
}

export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`
}
