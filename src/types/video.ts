import type { VideoMetadata } from "./video-metadata"

export interface VideoInfo {
  name: string
  path: string
  thumbnail: string
  metadata: VideoMetadata
  bitrate_data: Array<{
    timestamp: number
    bitrate: number
  }>
  activeIndex?: number
  thumbnails?: string[]
  filename: string
}

export interface VideoWithThumbnail extends VideoInfo {
  thumbnailUrl: string
}
