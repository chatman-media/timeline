import type { MediaFile } from "./video"

export interface AssembledTrack {
  video: MediaFile // Первое видео трека (для метаданных)
  index: number // Номер камеры
  isActive: boolean // Флаг активности трека
  allVideos: MediaFile[] // Все видео этой камеры
}
