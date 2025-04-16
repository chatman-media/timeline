import { type ClassValue, clsx } from "clsx"
import dayjs, { extend } from "dayjs"
import duration from "dayjs/plugin/duration"
import timezone from "dayjs/plugin/timezone"
import utc from "dayjs/plugin/utc"
import { twMerge } from "tailwind-merge"

import { FfprobeData } from "@/types/ffprobe"
import { MediaFile } from "@/types/media"

// Инициализируем плагин duration если еще не инициализирован
if (!dayjs.isDuration) {
  extend(duration)
}

// Инициализируем необходимые плагины
dayjs.extend(utc)
dayjs.extend(timezone)

export const formatDuration = (seconds: number, afterComa = 3): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 1000)

  const timeString =
    hours > 0
      ? `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
      : `${minutes}:${secs.toString().padStart(2, "0")}`

  if (afterComa === 0) {
    return timeString
  }

  return `${timeString}:${ms.toString().padStart(3, "0").substring(0, afterComa)}`
}

// Добавим вспомогательную функцию для форматирования разрешения
export const formatResolution = (width: number, height: number) => {
  const pixels = width * height

  // Определение стандартов разрешения для 6K и 8K
  if (pixels >= 33177600) return "8K" // 7680x4320 = 33,177,600 pixels
  if (pixels >= 19906560) return "6K" // 6144x3240 = 19,906,560 pixels

  // Для 4K и ниже используем существующую логику с K-значениями
  if (pixels >= 2073600) {
    const k = pixels / (2000 * 1000)
    // Значения K только до 4K
    const kValues = [1.2, 1.4, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0, 3.2, 3.4, 3.6, 3.8, 4.0]
    const closestK = kValues.reduce((prev, curr) =>
      Math.abs(curr - k) < Math.abs(prev - k) ? curr : prev,
    )
    return `${closestK}K`
  }

  if (pixels >= 2073600) return "1080p" // 1920x1080
  if (pixels >= 921600) return "720p" // 1280x720
  return "SD"
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTimeWithMilliseconds(
  seconds: number,
  showDate = false,
  showSeconds = true,
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

  const timeString = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}${
    showSeconds ? `:${secs.toString().padStart(2, "0")}` : ""
  }${showMilliseconds ? `:${ms.toString().padStart(3, "0")}` : ""}`

  if (showDate) {
    return `${time.format("DD.MM.YY")} ${timeString}`
  }
  return timeString
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "2-digit",
  })
}

export function formatBitrate(bitrate: number | undefined): string {
  if (!bitrate) return "N/A"
  return `${(bitrate / 1_000_000).toFixed(1)} Mbps`
}

export const formatTime = (seconds: number, showMilliseconds = false): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 1000)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}${
    ms > 0 && showMilliseconds ? `:${ms.toString().padStart(3, "0")}` : ""
  }`
}

export function generateVideoId(videos: MediaFile[]): string {
  // Сортируем видео по дате создания
  const sortedVideos = [...videos].sort((a, b) => {
    const timeA = new Date(a.startTime || 0).getTime()
    const timeB = new Date(b.startTime || 0).getTime()
    return timeA - timeB
  })

  // Находим максимальный существующий номер
  const maxNumber = sortedVideos.reduce((max, video) => {
    const match = video.id?.match(/V(\d+)/)
    if (match) {
      const num = parseInt(match[1])
      return num > max ? num : max
    }
    return max
  }, 0)

  return `V${maxNumber + 1}`
}

export function isVideoAvailable(
  video: MediaFile,
  currentTime: number,
  tolerance: number = 0.3,
): boolean {
  const startTime = video.startTime || 0
  const endTime = startTime + (video.duration || 0)
  return currentTime >= startTime - tolerance && currentTime <= endTime + tolerance
}

export function parseFileNameDateTime(fileName: string): Date | null {
  const match = fileName.match(/\d{8}_\d{6}/)
  if (!match) return null

  const dateTimeStr = match[0] // "20240910_170942"
  const year = dateTimeStr.slice(0, 4)
  const month = dateTimeStr.slice(4, 6)
  const day = dateTimeStr.slice(6, 8)
  const hour = dateTimeStr.slice(9, 11)
  const minute = dateTimeStr.slice(11, 13)
  const second = dateTimeStr.slice(13, 15)

  return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`)
}

export function formatFileSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"]
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`
}

export function getMediaCreationTime(probeData: FfprobeData): number {
  // 1. Try to get from probeData metadata
  if (probeData?.format?.tags?.creation_time) {
    return new Date(probeData.format.tags.creation_time).getTime() / 1000
  }

  // 2. Try to parse from filename (e.g. "20240910_170942")
  const parsedDate = probeData?.format.filename
    ? parseFileNameDateTime(probeData.format.filename)
    : null
  if (parsedDate) {
    return parsedDate.getTime() / 1000
  }

  // 3. Try to get from probeData start_time
  const startTime = probeData?.format.start_time
  if (startTime) {
    return startTime
  }

  return 0
}
