import { FfprobeData } from "fluent-ffmpeg"

export interface TimeRange {
  start: number
  end?: number
  duration: number
}

export interface RecordEntry {
  camera: number /** Индекс камеры, начиная с 1 */
  startTime: number /** Время начала записи в секундах (unix timestamp) */
  endTime?: number /** Время окончания записи в секундах (unix timestamp) */
}

export interface MediaFile {
  id?: string
  name: string
  path: string
  isVideo?: boolean
  probeData?: FfprobeData
  thumbnail?: string | null
}

export interface Track {
  id: string // Ключ камеры
  index: number // Номер камеры
  isActive: boolean // Флаг активности трека
  combinedDuration: number // Общая длительность видео
  videos: MediaFile[] // Все видео этой камеры
  timeRanges: TimeRange[] // Массив временных диапазонов
}

export interface VideoSegment {
  cameraIndex: number /** Индекс камеры, начиная с 1 */
  startTime: number /** Время начала сегмента в секундах (unix timestamp) */
  endTime: number /** Время окончания сегмента в секундах (unix timestamp) */
  duration: number /** Длительность сегмента в секундах */
  videoFile: string /** Путь к файлу видео */
  totalBitrate?: number /** Общий битрейт видео в bits/s */
  is360?: boolean /** Флаг, указывающий что видео панорамное (360°) */
  isCombined?: boolean /** Флаг, указывающий что сегмент состоит из нескольких видео */
}

export interface ScreenLayout {
  type: "1x1" | "2x2" | "3x3" | "4x4"
  activeTracks: string[] // Track IDs that are currently visible
}
