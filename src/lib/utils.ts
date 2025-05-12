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

export const formatDuration = (seconds: number, afterComa = 3, showHours = false): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 1000)

  if (showHours) {
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}${afterComa > 0 ? `:${ms.toString().padStart(3, "0").substring(0, afterComa)}` : ""}`
  }

  const timeString = `${minutes}:${secs.toString().padStart(2, "0")}`

  if (afterComa === 0) {
    return timeString
  }

  return `${timeString}:${ms.toString().padStart(3, "0").substring(0, afterComa)}`
}

// Добавим вспомогательную функцию для форматирования разрешения
export const formatResolution = (width: number, height: number) => {
  const pixels = width * height
  if (height > width) {
    ;[width, height] = [height, width]
  }
  // console.log(`[formatResolution] width: ${width}, height: ${height}, pixels: ${pixels}`)

  // 1920 × 1080 (FHD)
  if (width === 1920 && height === 1080) return "FHD"
  // 2048 × 1080 (DCI 2K)
  if (width === 2048 && height === 1080) return "DCI 2K"
  // 2560 × 1440 (QHD)
  if (width === 2560 && height === 1440) return "QHD"
  // 3200 × 1800 (QHD+)
  if (width === 3200 && height === 1800) return "QHD+"
  // 3840 × 2160 (4K UHD)
  if (width === 3840 && height === 2160) return "UHD"
  // 4096 × 2160 (DCI 4K)
  if (width === 4096 && height === 2160) return "DCI 4K"
  // 5120 × 2880 = 14,745,600 pixels
  if (width === 5120 && height === 2880) return "5K"
  // 6144 × 3240 = 19,906,560 pixels
  if (width === 6144 && height === 3240) return "6K"
  // 7680 × 4320 = 33,177,600 pixels
  if (width === 7680 && height === 4320) return "8K UHD"
  // 7680 × 3264 = 25,280,000 pixels
  if (pixels >= 24576000) return "8K UHD" // 7680x3264
  if (pixels >= 19906560) return "6K" // 6144x3240
  // 5120 × 2880 = 14,745,600 pixels
  if (pixels >= 14745600) return "5K"
  if (pixels >= 8294400) return "UHD" // 3840x2160
  if (pixels >= 6048000) return "QHD+" // 3240x1800
  if (pixels >= 4147200) return "QHD" // 2560x1440
  if (pixels >= 2073600) return "FHD" // 1920x1080
  if (pixels >= 921600) return "HD" // 1280x720
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

import { DEFAULT_LANGUAGE, formatDateByLanguage, LanguageCode } from "@/i18n/constants"

export function formatDate(timestamp: number): string {
  // Получаем текущий язык из localStorage или используем значение по умолчанию
  let currentLanguage = DEFAULT_LANGUAGE
  try {
    // Проверяем, что мы на клиенте
    if (typeof window !== "undefined") {
      // Сначала пробуем получить язык из localStorage
      const storedLanguage = localStorage.getItem("app-language")
      if (storedLanguage) {
        currentLanguage = storedLanguage as LanguageCode
      }
    }
  } catch (error) {
    console.error("Error getting current language:", error)
  }

  // Используем универсальный метод форматирования даты
  return formatDateByLanguage(new Date(timestamp * 1000), currentLanguage, {
    includeYear: true,
    longFormat: true,
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
    const time = new Date(probeData.format.tags.creation_time).getTime() / 1000
    // console.log(
    //   `[getMediaCreationTime] Время из метаданных: ${new Date(time * 1000).toISOString()}`,
    // )
    return time
  }

  // 2. Try to parse from filename (e.g. "20240910_170942")
  const parsedDate = probeData?.format.filename
    ? parseFileNameDateTime(probeData.format.filename)
    : null
  if (parsedDate) {
    const time = parsedDate.getTime() / 1000
    // console.log(
    //   `[getMediaCreationTime] Время из имени файла: ${new Date(time * 1000).toISOString()}`,
    // )
    return time
  }

  // 3. Try to get from probeData start_time
  const startTime = probeData?.format.start_time
  if (startTime) {
    console.log(
      `[getMediaCreationTime] Время из start_time: ${new Date(startTime * 1000).toISOString()}`,
    )
    return startTime
  }

  // 4. If all else fails, return current time
  console.warn(
    `[getMediaCreationTime] Не удалось определить время создания файла ${probeData?.format?.filename}, используем текущее время`,
  )
  return Math.floor(Date.now() / 1000)
}

/**
 * Извлекает информацию о модели камеры из метаданных видео
 * @param probeData Метаданные видео
 * @returns Название модели камеры или null, если информация не найдена
 */
export function getCameraModel(probeData: FfprobeData): string | null {
  // Проверяем различные поля метаданных, где может быть информация о камере

  // 1. Проверяем теги формата
  if (probeData?.format?.tags) {
    const tags = probeData.format.tags

    // Проверяем различные возможные теги для модели камеры
    if (tags.make && tags.model) {
      return `${tags.make} ${tags.model}`
    }

    if (tags.model) {
      return tags.model as string
    }

    if (tags.make) {
      return tags.make as string
    }

    // Проверяем compatible_brands, который может содержать информацию о производителе
    if (tags.compatible_brands) {
      const brands = (tags.compatible_brands as string).toLowerCase()

      // Проверяем наличие известных брендов в строке compatible_brands
      if (brands.includes("sony")) return "Sony"
      if (brands.includes("apple")) return "iPhone"
      if (brands.includes("gopro")) return "GoPro"
      if (brands.includes("canon")) return "Canon"
      if (brands.includes("nikon")) return "Nikon"
      if (brands.includes("pana")) return "Panasonic"
      if (brands.includes("olymp")) return "Olympus"
      if (brands.includes("fuji")) return "Fujifilm"

      // Если нашли какие-то бренды, но они не соответствуют известным,
      // возвращаем саму строку compatible_brands для дальнейшего анализа
      return `Camera (${tags.compatible_brands})`
    }

    if (tags.encoder) {
      return tags.encoder as string
    }

    if (tags.handler_name) {
      return tags.handler_name as string
    }

    if (tags.device_model) {
      return tags.device_model as string
    }
  }

  // 2. Проверяем теги видеопотока
  const videoStream = probeData?.streams?.find((stream) => stream.codec_type === "video")
  if (videoStream?.tags) {
    const tags = videoStream.tags

    if (tags.make && tags.model) {
      return `${tags.make} ${tags.model}`
    }

    if (tags.model) {
      return tags.model as string
    }

    if (tags.make) {
      return tags.make as string
    }

    if (tags.encoder) {
      return tags.encoder as string
    }

    if (tags.handler_name) {
      return tags.handler_name as string
    }
  }

  // 3. Если не нашли информацию о камере, возвращаем null
  return null
}
