import { Track, MediaFile } from "./videos"

export interface TimeRange {
  min: number /** Минимальное время в секундах (unix timestamp) */
  max: number /** Максимальное время в секундах (unix timestamp) */
  duration: number /** Длительность временного промежутка в секундах */
}

export interface SceneDuration {
  startTime: number /** Время начала сцены в секундах от начала временного диапазона */
  duration: number /** Длительность сцены в секундах */
}

export interface SceneDistributionParams {
  targetDuration: number /** Желаемая длительность итогового видео в секундах */
  numCameras: number /** Количество доступных камер */
  averageSceneDuration: number /** Средняя длительность одной сцены в секундах */
  cameraChangeFrequency: number /** Частота смены камеры (от 0 до 1) */
  mainCamera: number /** Индекс основной камеры (начиная с 1) */
  mainCameraProb: number /** Вероятность использования основной камеры (от 0 до 1) */
  timeRange: TimeRange /** Временной диапазон для распределения сцен */
  videos: MediaFile[] /** Массив доступных видео */
  tracks: Track[]
}

export interface SceneSegment {
  startTime: number /** Время начала сцены в секундах (unix timestamp) */
  endTime: number /** Время окончания сцены в секундах (unix timestamp) */
  duration: number /** Длительность сцены в секундах */
  cameraIndex: number /** Индекс камеры, начиная с 1 */
  videoFile: string /** Путь к файлу видео */
  totalBitrate?: number /** Общий битрейт видео в bits/s */
}
