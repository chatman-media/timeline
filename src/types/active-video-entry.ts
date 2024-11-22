import { VideoInfo } from "./video"

export interface ActiveVideoEntry {
  video: VideoInfo /** Информация о текущем видео */
  index: number /** Индекс видео в общем списке */
  isActive: boolean /** Флаг активности видео в UI */
  allVideos?: VideoInfo[] /** Опциональный массив всех доступных видео */
}
