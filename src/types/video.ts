import { FfprobeData } from "fluent-ffmpeg"

export interface VideoAnalysis {
  blackFrames: Array<{
    start: number
    end: number
  }>
  volumeStats: {
    meanVolume: number | null
    maxVolume: number | null
  }
}

export interface MediaFile {
  name: string
  path: string
  thumbnail?: string
  probeData: FfprobeData
  analysis?: VideoAnalysis
}

export interface VideosApiResponse {
  videos: MediaFile[]
}

// Массив видео, которые будут использованы для компиляции
export interface AssembledTrack {
  video: MediaFile // Главное видео компиляции (для метаданных)
  index: number // Номер камеры
  type: "video" | "audio"
  allMedia: MediaFile[] // Все видео этой компиляции
  displayName: string // V[X] для видео или A[X] для аудио
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

export interface VideoWithThumbnail extends MediaFile {
  thumbnailUrl: string
}

export interface RecordEntry {
  camera: number
  startTime: number
  endTime?: number
}

export interface TimeRange {
  min: number
  max: number
}

export interface UseVideosReturn {
  isLoading: boolean
  error: Error | null
  videos: MediaFile[]
  timeRange: TimeRange
  assembledTracks: AssembledTrack[]
}

export interface CompilationSettings {
  targetDuration: number
  minSegmentLength: number
  maxSegmentLength: number
  averageSceneDuration: number
  cameraChangeFrequency: number
  mainCameraPriority: number
}
