import { VideoStream } from "./video-stream"
import { VideoFormat } from "./video-format"
import { AudioStream } from "./audio-stream"

export interface VideoMetadata {
  format: VideoFormat /** Общая информация о контейнере видео */
  video_stream?: VideoStream /** Метаданные видеопотока */
  audio_stream?: AudioStream /** Метаданные аудиопотока */
  creation_time?: string /** Время создания файла (ISO 8601) */
  tags?: Record<string, string> /** Дополнительные метаданные в формате ключ-значение */
}
