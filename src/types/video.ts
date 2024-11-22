import { VideoMetadata } from "./metadata"

export interface VideoInfo {
  name: string /** Отображаемое имя видео */
  path: string /** Полный путь к файлу видео */
  thumbnail: string /** Путь к превью изображению */
  metadata: VideoMetadata /** Метаданные видео (длительность, разрешение и т.д.) */
  bitrate_data: Array<{
    timestamp: number /** Временная метка в секундах */
    bitrate: number /** Значение битрейта в bits/s */
  }>
  activeIndex?: number /** Текущий активный индекс для UI */
  thumbnails?: string[] /** Массив путей к дополнительным превью */
  filename: string /** Имя файла видео без пути */
}

export interface VideoWithThumbnail extends VideoInfo {
  thumbnailUrl: string /** URL для доступа к превью через веб */
}

export interface BitrateDataPoint {
  time: number /** Время в секундах */
  bitrate: number /** Битрейт в bits/s */
}
