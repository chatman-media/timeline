import { FfprobeData } from "fluent-ffmpeg"

export interface BitrateDataPoint {
  timestamp: number
  bitrate: number
}

export interface RecordEntry {
  camera: number /** Индекс камеры, начиная с 1 */
  startTime: number /** Время начала записи в секундах (unix timestamp) */
  endTime?: number /** Время окончания записи в секундах (unix timestamp) */
}

export interface MediaFile {
  name: string
  path: string
  thumbnail: string | null
  probeData: FfprobeData
  isVideo: boolean
}

export interface AssembledTrack {
  video: MediaFile // Первое видео трека (для метаданных)
  index: number // Номер камеры
  isActive: boolean // Флаг активности трека
  allVideos: MediaFile[] // Все видео этой камеры
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
