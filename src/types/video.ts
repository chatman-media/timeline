import { VideoMetadata } from "@/components/video-metadata"

export interface VideoInfo {
  name: string
  path: string
  thumbnail: string
  metadata: typeof VideoMetadata
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

export interface BitrateDataPoint {
  time: number
  bitrate: number
}

export interface VideoSegment {
  cameraIndex: number
  startTime: number
  endTime: number
}
