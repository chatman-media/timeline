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
