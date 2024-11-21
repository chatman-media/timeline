import { VideoMetadata } from "@/types/video-metadata"
import { SceneSegment } from "@/types/scenes"

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

export interface BitrateDataPoint {
  time: number
  bitrate: number
}

export interface VideoSegment {
  cameraIndex: number
  startTime: number
  endTime: number
  segments: SceneSegment[]
  totalBitrate?: number
}
