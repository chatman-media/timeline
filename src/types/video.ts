export interface VideoInfo {
  name: string
  path: string
  thumbnail: string
  metadata: {
    format: {
      duration: number
    }
    video_stream?: {
      width: number
      height: number
    }
    creation_time?: string
  }
  bitrate_data?: Array<{
    timestamp: number
    bitrate: number
  }>
} 