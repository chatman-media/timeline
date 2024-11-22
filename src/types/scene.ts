import { VideoInfo } from "./video"

/** Временной диапазон для распределения сцен */
export interface TimeRange {
  /** Минимальное время в секундах (unix timestamp) */
  min: number
  /** Максимальное время в секундах (unix timestamp) */
  max: number
}

/** Параметры для генерации сцен */
export interface SceneDuration {
  /** Время начала сцены в секундах от начала временного диапазона */
  startTime: number
  /** Длительность сцены в секундах */
  duration: number
}

/** Параметры для распределения сцен в мультикамерном монтаже */
export interface SceneDistributionParams {
  /** Желаемая длительность итогового видео в секундах */
  targetDuration: number
  /** Количество доступных камер */
  numCameras: number
  /** Средняя длительность одной сцены в секундах */
  averageSceneDuration: number
  /** Частота смены камеры (от 0 до 1) */
  cameraChangeFrequency: number
  /** Индекс основной камеры (начиная с 1) */
  mainCamera: number
  /** Вероятность использования основной камеры (от 0 до 1) */
  mainCameraProb: number
  /** Временной диапазон для распределения сцен */
  timeRange: TimeRange
  /** Массив доступных видео */
  videos: VideoInfo[]
}

/** Сегмент сцены с информацией о камере и времени */
export interface SceneSegment {
  /** Время начала сцены в секундах (unix timestamp) */
  startTime: number
  /** Время окончания сцены в секундах (unix timestamp) */
  endTime: number
  /** Длительность сцены в секундах */
  duration: number
  /** Индекс камеры, начиная с 1 */
  cameraIndex: number
  /** Путь к файлу видео */
  videoFile: string
  /** Общий битрейт видео в bits/s */
  totalBitrate?: number
}
