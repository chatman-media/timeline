import type { VideoInfo } from "./video"

export interface AssembledTrack {
  video: VideoInfo // Первое видео трека (для метаданных)
  index: number // Номер камеры
  isActive: boolean // Флаг активности трека
  allVideos: VideoInfo[] // Все видео этой камеры
}
